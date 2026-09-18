import type { Job } from './types';
const companies = [
  {
    name: 'Layers',
    description: 'Tools that make creative collaboration feel effortless.',
    website: 'https://example.com',
  },
  {
    name: 'Orbit',
    description: 'Building a more thoughtful way to work together.',
    website: 'https://example.com',
  },
  {
    name: 'Forma',
    description: 'Digital experiences shaped around people.',
    website: 'https://example.com',
  },
  {
    name: 'Northstar',
    description: 'Helping ambitious teams find their next direction.',
    website: 'https://example.com',
  },
];
export const sampleJobs: Job[] = [
  ['Senior Product Designer', 'Design', 'Remote', 'Full-time', 1800000, 2600000, 0],
  ['Frontend Engineer', 'Engineering', 'Hybrid', 'Full-time', 1200000, 2200000, 1],
  ['Product Manager', 'Product', 'Remote', 'Full-time', 2000000, 3200000, 2],
  ['Brand & Marketing Designer', 'Marketing', 'Remote', 'Contract', 600000, 1000000, 3],
  ['Software Engineering Intern', 'Engineering', 'On-site', 'Internship', 240000, 360000, 2],
  ['People Operations Associate', 'Operations', 'Hybrid', 'Full-time', 500000, 800000, 0],
].map((row, i) => ({
  id: `10000000-0000-4000-8000-00000000000${i + 1}`,
  company_id: `20000000-0000-4000-8000-00000000000${Number(row[6]) + 1}`,
  title: String(row[0]),
  category: String(row[1]),
  workplace: row[2] as Job['workplace'],
  type: row[3] as Job['type'],
  salary_min: Number(row[4]),
  salary_max: Number(row[5]),
  location: [
    'Bengaluru, India',
    'Hyderabad, India',
    'Gurugram, India',
    'Mumbai, India',
    'Pune, India',
    'Bengaluru, India',
  ][i],
  status: 'published',
  created_at: `2026-09-${18 - i}T12:00:00Z`,
  description: `Join ${companies[Number(row[6])].name} and help a small, thoughtful team build products people love. You will take ownership of meaningful projects, collaborate across disciplines, and turn ambitious ideas into useful experiences.\n\nThis role is based in India. Remote roles are open to candidates across India. We value clear communication, curiosity, and the care you bring to your craft. You will have room to learn, a supportive team, and the flexibility to do your best work.`,
  requirements:
    'Strong fundamentals in your field and a portfolio of thoughtful work.\nClear communication and a collaborative approach.\nComfort taking a project from an early idea to a finished result.',
  companies: {
    ...companies[Number(row[6])],
    id: `20000000-0000-4000-8000-00000000000${Number(row[6]) + 1}`,
    owner_id: 'sample',
  },
}));
