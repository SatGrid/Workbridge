'use client';
import { useState, useActionState } from 'react';
import { authenticate } from '@/app/actions';
import { Field, Submit } from '@/components/forms';
export function LoginForm({ role, message }: { role: string; message?: string }) {
  const [mode, setMode] = useState('signin');
  const [state, action] = useActionState(authenticate, {});
  return (
    <section className="panel auth-card">
      <div className="auth-tabs" role="tablist" aria-label="Account access">
        <button role="tab" aria-selected={mode === 'signin'} onClick={() => setMode('signin')}>
          Sign in
        </button>
        <button role="tab" aria-selected={mode === 'signup'} onClick={() => setMode('signup')}>
          Create account
        </button>
      </div>
      <form action={action} className="form">
        <input type="hidden" name="mode" value={mode} />
        {mode === 'signup' && (
          <>
            <Field label="Full name" name="full_name" required maxLength={80} />
            <label className="field">
              <span>I’m here to</span>
              <select name="role" defaultValue={role === 'recruiter' ? 'recruiter' : 'applicant'}>
                <option value="applicant">Find my next role</option>
                <option value="recruiter">Hire for my team</option>
              </select>
            </label>
          </>
        )}
        <label className="field">
          <span>Email address</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            maxLength={128}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            placeholder="At least 8 characters"
          />
        </label>
        <Submit>{mode === 'signup' ? 'Create account' : 'Welcome back'}</Submit>
      </form>
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
      {message && <p className="notice">{message}</p>}
      <p className="auth-subtitle">
        {mode === 'signup'
          ? 'Recruiter accounts are reviewed by an administrator before they can publish jobs.'
          : 'One account. Your own workspace.'}
      </p>
    </section>
  );
}
