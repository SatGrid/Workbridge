# Workbridge

A compact full-stack job portal with applicant, recruiter, and admin workspaces. Built with Next.js App Router, TypeScript, Tailwind CSS, Radix-based UI components, and Supabase (PostgreSQL, Auth, private Storage).

## Start locally

Requires Node.js 24+ and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://127.0.0.1:3000. Without Supabase credentials, the public job browser displays **clearly labeled sample data**. Search, filters, sorting, and job details work. Authentication and account actions require the backend; preview mode never pretends to save an application.

## Connect a new Supabase project

1. Create a project at https://supabase.com/dashboard. In **SQL Editor**, run the complete contents of `supabase/migrations/001_workbridge.sql` once. It creates the tables, permissions, signup trigger, and private resumes bucket.
2. From the project's **Connect** dialog, copy the Project URL and publishable key into `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

3. In **Authentication → URL Configuration**, set Site URL to `http://127.0.0.1:3000` for local development. Add your deployed HTTPS origin when hosting.
4. In **Authentication → Email Templates → Confirm signup**, use this confirmation link:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm your email</a>
```

5. Restart the development server. Create an applicant account and a recruiter account using the app, then confirm both emails. The first administrator must be provisioned explicitly: create and confirm your own account, then run this in the Supabase SQL Editor, replacing the email:

```sql
update public.profiles
set role = 'admin', approved = true
where id = (select id from auth.users where email = 'YOUR_ADMIN_EMAIL');
```

Never expose a service-role key to the browser or prefix it with `NEXT_PUBLIC_`. The running app needs only the publishable key; its access is limited by database policies.

## Optional demo accounts and jobs

For a **dedicated portfolio/demo Supabase project**, the seed script creates three accounts and three jobs. It does not modify existing accounts. Add `SUPABASE_SERVICE_ROLE_KEY` to your ignored `.env.local` temporarily, then run:

```sh
npm run seed
```

It prints separately generated passwords for the applicant, recruiter, and admin. Store them privately. Remove the service-role key from `.env.local` after seeding. Share applicant/recruiter credentials only in a disposable demo database. Do not publish the administrator password. The script aborts if a target account already exists; it is not a database reset tool.

## Connected workflow

1. Admin approves a recruiter in `/admin`.
2. Recruiter saves a company profile at `/profile`, then publishes a job.
3. Applicant saves their profile, uploads a PDF resume (maximum 5 MB), and applies.
4. Recruiter sees that application and can mark it applied, shortlisted, rejected, or hired.
5. Applicant sees the same updated record in `/dashboard`; admin can oversee jobs, applications, and users.

Recruiters can edit or close their own jobs. Admins can edit, close, or delete any job, review/delete applications, approve recruiters, and suspend/restore users. Suspensions are enforced in database policies; public signup cannot create an admin. User management intentionally uses suspension rather than hard-deleting authentication identities.

## Data and permissions

- `profiles`: one per Auth user. Public metadata cannot grant an admin role.
- `companies`: one company per recruiter.
- `jobs`: belongs to a company, with annual INR salary range and published/closed status.
- `applications`: unique per applicant/job, with a shared review status.
- `resumes`: private PDF bucket. Applicant owner, associated job recruiter, and admin access only; download links expire after 60 seconds.

Server actions validate input and verify the session. PostgreSQL row-level security and column grants enforce ownership and prevent role/status escalation even through direct API calls. Account role and approval edits go through a restricted admin function. Personal profile data is never part of the public job listing.

Resume downloads use the applicant's current resume. Replacing a resume updates what recruiters can download for existing applications. Salaries are stored as annual INR amounts and displayed in lakhs (for example, ₹12L / year). Sample opportunities are fictional India-based roles, not live vacancies or salary benchmarks. Messaging, payments, scheduling, and AI matching are outside scope.

## Checks

```sh
npm test
npm run typecheck
npm run build
```

Tests execute the actual migration in embedded PostgreSQL (PGlite), with Supabase Auth/Storage schemas stubbed, to verify ownership, approval, resume visibility, duplicate applications, status changes, and suspension. This is not a substitute for a final smoke test against a configured Supabase project.

## Deploy

Import this GitHub repository into a Next.js-compatible host such as Vercel. Set the two public Supabase environment variables, deploy, then update the Supabase Site URL and confirmation settings. Use HTTPS. No deployment or live database is provisioned by this repository alone.
