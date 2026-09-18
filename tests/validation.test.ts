import { test } from 'node:test';
import assert from 'node:assert/strict';
import { jobSchema, companySchema } from '../lib/validation.ts';
const job = {
  title: 'Frontend Engineer',
  location: 'Worldwide',
  workplace: 'Remote',
  type: 'Full-time',
  category: 'Engineering',
  salary_min: 80000,
  salary_max: 120000,
  description: 'Build thoughtful and accessible web applications with our team.',
  requirements: 'Experience building React applications.',
};
test('salary ranges and employment options are validated', () => {
  assert.equal(jobSchema.safeParse(job).success, true);
  assert.equal(jobSchema.safeParse({ ...job, salary_max: 100 }).success, false);
  assert.equal(jobSchema.safeParse({ ...job, workplace: 'Anywhere' }).success, false);
  assert.equal(jobSchema.safeParse({ ...job, salary_min: -1 }).success, false);
});
test('company URLs accept only HTTP(S)', () => {
  assert.equal(
    companySchema.safeParse({ name: 'Layers', website: 'https://example.com', description: '' })
      .success,
    true,
  );
  assert.equal(
    companySchema.safeParse({ name: 'Layers', website: 'javascript:alert(1)', description: '' })
      .success,
    false,
  );
});
