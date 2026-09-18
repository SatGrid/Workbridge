export type Role = 'applicant' | 'recruiter' | 'admin';
export type Profile = {
  id: string;
  full_name: string;
  role: Role;
  approved: boolean;
  is_active: boolean;
  headline: string;
  location: string;
  bio: string;
  resume_path: string | null;
  created_at: string;
};
export type Company = {
  id: string;
  owner_id: string;
  name: string;
  website: string;
  description: string;
};
export type Job = {
  id: string;
  company_id: string;
  title: string;
  location: string;
  workplace: 'Remote' | 'Hybrid' | 'On-site';
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  salary_min: number;
  salary_max: number;
  category: string;
  description: string;
  requirements: string;
  status: 'published' | 'closed';
  created_at: string;
  companies: Company;
};
export type Application = {
  id: string;
  job_id: string;
  applicant_id: string;
  cover_note: string;
  status: 'applied' | 'shortlisted' | 'rejected' | 'hired';
  created_at: string;
  jobs: Job;
  profiles: Profile;
};
