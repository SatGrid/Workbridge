import { z } from 'zod';
export const jobSchema = z
  .object({
    title: z.string().trim().min(3).max(100),
    location: z.string().trim().min(2).max(100),
    workplace: z.enum(['Remote', 'Hybrid', 'On-site']),
    type: z.enum(['Full-time', 'Part-time', 'Contract', 'Internship']),
    category: z.enum(['Engineering', 'Design', 'Product', 'Marketing', 'Operations']),
    salary_min: z.coerce.number().int().min(0).max(10000000),
    salary_max: z.coerce.number().int().min(0).max(10000000),
    description: z.string().trim().min(30).max(8000),
    requirements: z.string().trim().min(10).max(5000),
  })
  .refine((value) => value.salary_max >= value.salary_min, {
    message: 'Maximum salary must be at least the minimum.',
    path: ['salary_max'],
  });
export const profileSchema = z.object({
  full_name: z.string().trim().min(2).max(80),
  headline: z.string().trim().max(140),
  location: z.string().trim().max(100),
  bio: z.string().trim().max(2000),
});
export const companySchema = z.object({
  name: z.string().trim().min(2).max(100),
  website: z.union([
    z.literal(''),
    z.url().refine((v) => /^https?:\/\//.test(v), 'Use an https:// website URL.'),
  ]),
  description: z.string().trim().max(2000),
});
export const authSchema = z.object({ email: z.email(), password: z.string().min(8).max(128) });
export const idSchema = z.uuid();
export const statusSchema = z.enum(['applied', 'shortlisted', 'rejected', 'hired']);
