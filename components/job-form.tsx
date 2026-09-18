import { ActionForm, Field, TextArea } from '@/components/forms';
import { saveJob } from '@/app/actions';
import type { Job } from '@/lib/types';
export function JobForm({ job }: { job?: Job }) {
  return (
    <ActionForm action={saveJob} submit={job ? 'Save job' : 'Publish job'}>
      {job && <input name="id" type="hidden" value={job.id} />}
      <Field
        label="Job title"
        name="title"
        defaultValue={job?.title}
        placeholder="e.g. Frontend Engineer"
        required
        maxLength={100}
      />
      <div className="form-grid">
        <Field
          label="Location"
          name="location"
          defaultValue={job?.location}
          placeholder="e.g. Bengaluru, India or Remote, India"
          required
          maxLength={100}
        />
        <label className="field">
          <span>Workplace</span>
          <select name="workplace" defaultValue={job?.workplace ?? 'Remote'}>
            {['Remote', 'Hybrid', 'On-site'].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Employment type</span>
          <select name="type" defaultValue={job?.type ?? 'Full-time'}>
            {['Full-time', 'Part-time', 'Contract', 'Internship'].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Field</span>
          <select name="category" defaultValue={job?.category ?? 'Engineering'}>
            {['Engineering', 'Design', 'Product', 'Marketing', 'Operations'].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <Field
          label="Minimum annual salary (INR)"
          name="salary_min"
          type="number"
          min={0}
          defaultValue={job?.salary_min ?? 0}
          required
        />
        <Field
          label="Maximum annual salary (INR)"
          name="salary_max"
          type="number"
          min={0}
          defaultValue={job?.salary_max ?? 0}
          required
        />
      </div>
      <TextArea
        label="About the opportunity"
        name="description"
        defaultValue={job?.description}
        required
        maxLength={8000}
      />
      <TextArea
        label="Requirements"
        name="requirements"
        defaultValue={job?.requirements}
        required
        maxLength={5000}
      />
    </ActionForm>
  );
}
