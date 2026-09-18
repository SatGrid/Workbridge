'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import type { ActionState } from '@/app/actions';
import { Button } from './ui/button';
export function Submit({
  children = 'Save changes',
  variant = 'primary',
}: {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} variant={variant}>
      {pending ? 'Saving…' : children}
    </Button>
  );
}
export function ActionForm({
  action,
  children,
  submit = 'Save changes',
  className = '',
  variant = 'primary',
  confirm,
}: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
  children?: React.ReactNode;
  submit?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  confirm?: string;
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form
      action={formAction}
      className={`form ${className}`}
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
    >
      {children}
      <Submit variant={variant}>{submit}</Submit>
      {state.error && (
        <p className="notice notice-error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="notice notice-success" role="status">
          {state.success}
        </p>
      )}
    </form>
  );
}
export function Field({
  label,
  name,
  defaultValue = '',
  type = 'text',
  required = false,
  placeholder = '',
  maxLength,
  min,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
  min?: number;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        type={type}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        min={min}
      />
    </label>
  );
}
export function TextArea({
  label,
  name,
  defaultValue = '',
  required = false,
  maxLength = 2000,
  placeholder = '',
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        required={required}
        maxLength={maxLength}
        rows={5}
        placeholder={placeholder}
      />
    </label>
  );
}
