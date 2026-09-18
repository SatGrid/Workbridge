import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
const ids = {
  app: '00000000-0000-4000-8000-000000000001',
  recruiter: '00000000-0000-4000-8000-000000000002',
  other: '00000000-0000-4000-8000-000000000003',
  admin: '00000000-0000-4000-8000-000000000004',
};
test('shared workflow and database authorization', async (t) => {
  const db = new PGlite();
  await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;
 create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
 alter table storage.objects enable row level security;
 create function storage.foldername(text) returns text[] language sql as $$ select string_to_array($1,'/') $$;
 grant usage on schema public,auth,storage to anon,authenticated;
 grant select,insert,delete on storage.objects to authenticated;`);
  await db.exec(
    readFileSync(new URL('../supabase/migrations/001_workbridge.sql', import.meta.url), 'utf8'),
  );
  for (const [role, id] of Object.entries(ids))
    await db.query(`insert into auth.users(id,raw_user_meta_data) values($1,$2::jsonb)`, [
      id,
      JSON.stringify({
        full_name: role + ' Person',
        role:
          role === 'recruiter' || role === 'other'
            ? 'recruiter'
            : role === 'admin'
              ? 'admin'
              : 'applicant',
      }),
    ]);
  await t.test('signup metadata cannot grant admin', async () => {
    const r = await db.query<{ role: string }>(`select role from profiles where id=$1`, [
      ids.admin,
    ]);
    assert.equal(r.rows[0].role, 'applicant');
  });
  await db.query(`update profiles set role='admin' where id=$1`, [ids.admin]);
  const as = async (user: string, sql: string, params: unknown[] = []) => {
    await db.exec('begin;set local role authenticated;');
    try {
      await db.query(`select set_config('request.jwt.claim.sub',$1,true)`, [user]);
      const result = await db.query(sql, params);
      await db.exec('commit;');
      return result;
    } catch (error) {
      await db.exec('rollback;');
      throw error;
    }
  };
  await as(ids.recruiter, `insert into companies(owner_id,name) values($1,'Layers')`, [
    ids.recruiter,
  ]);
  const company = (
    await db.query<{ id: string }>(`select id from companies where owner_id=$1`, [ids.recruiter])
  ).rows[0].id;
  const insertJob = `insert into jobs(company_id,title,location,workplace,type,category,salary_min,salary_max,description,requirements) values($1,'Frontend Engineer','Bengaluru, India','Remote','Full-time','Engineering',1200000,2200000,'Build thoughtful, accessible experiences with our team.','Experience with React and TypeScript.') returning id`;
  await t.test('unapproved recruiter cannot publish', async () => {
    await assert.rejects(() => as(ids.recruiter, insertJob, [company]), /row-level security/);
  });
  await t.test('applicant cannot self-promote or approve recruiter', async () => {
    await assert.rejects(
      () => as(ids.app, `update profiles set role='admin' where id=$1`, [ids.app]),
      /permission denied/,
    );
    await assert.rejects(
      () => as(ids.app, `select manage_user($1,'approve')`, [ids.recruiter]),
      /Administrator access required/,
    );
  });
  await as(ids.admin, `select manage_user($1,'approve')`, [ids.recruiter]);
  const job = (await as(ids.recruiter, insertJob, [company])).rows[0] as { id: string };
  await t.test('application requires a resume', async () => {
    await assert.rejects(
      () =>
        as(ids.app, `insert into applications(job_id,applicant_id) values($1,$2)`, [
          job.id,
          ids.app,
        ]),
      /row-level security/,
    );
  });
  await as(ids.app, `update profiles set resume_path=$1 where id=$2`, [
    `${ids.app}/resume.pdf`,
    ids.app,
  ]);
  await as(ids.app, `insert into storage.objects(bucket_id,name) values('resumes',$1)`, [
    `${ids.app}/resume.pdf`,
  ]);
  const application = (
    await as(ids.app, `insert into applications(job_id,applicant_id) values($1,$2) returning id`, [
      job.id,
      ids.app,
    ])
  ).rows[0] as { id: string };
  await t.test('duplicate applications are rejected', async () => {
    await assert.rejects(
      () =>
        as(ids.app, `insert into applications(job_id,applicant_id) values($1,$2)`, [
          job.id,
          ids.app,
        ]),
      /duplicate key/,
    );
  });
  await t.test('applicant cannot mark themselves hired', async () => {
    const r = await as(ids.app, `update applications set status='hired' where id=$1 returning id`, [
      application.id,
    ]);
    assert.equal(r.rows.length, 0);
  });
  await t.test('other recruiter cannot read applicant or resume', async () => {
    assert.equal((await as(ids.other, 'select * from applications')).rows.length, 0);
    assert.equal(
      (await as(ids.other, `select * from profiles where id=$1`, [ids.app])).rows.length,
      0,
    );
    assert.equal((await as(ids.other, `select * from storage.objects`)).rows.length, 0);
  });
  await t.test('owner sees application, resume, and can update shared status', async () => {
    assert.equal((await as(ids.recruiter, `select * from storage.objects`)).rows.length, 1);
    await as(ids.recruiter, `update applications set status='shortlisted' where id=$1`, [
      application.id,
    ]);
    const r = await as(ids.app, `select status from applications where id=$1`, [application.id]);
    assert.equal((r.rows[0] as { status: string }).status, 'shortlisted');
  });
  await t.test('closing a job preserves applicant access to its detail', async () => {
    await as(ids.recruiter, `update jobs set status='closed' where id=$1`, [job.id]);
    assert.equal((await as(ids.app, `select * from jobs where id=$1`, [job.id])).rows.length, 1);
  });
  await t.test('suspension revokes recruiter access', async () => {
    await as(ids.admin, `select manage_user($1,'suspend')`, [ids.recruiter]);
    assert.equal((await as(ids.recruiter, 'select * from applications')).rows.length, 0);
    assert.equal((await as(ids.recruiter, 'select * from storage.objects')).rows.length, 0);
  });
  await t.test('admin can oversee applications but cannot suspend itself', async () => {
    assert.equal((await as(ids.admin, 'select * from applications')).rows.length, 1);
    await assert.rejects(
      () => as(ids.admin, `select manage_user($1,'suspend')`, [ids.admin]),
      /own administrative access/,
    );
  });
  await db.close();
});
