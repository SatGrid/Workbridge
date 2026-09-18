import { LoginForm } from '@/components/login-form';
export const metadata = { title: 'Sign in' };
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; message?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="auth-layout">
      <div className="auth-copy">
        <div className="eyebrow">
          <span className="eyebrow-line" /> YOUR NEXT CHAPTER
        </div>
        <h1>
          Good things
          <br />
          start with
          <br />
          <span>a connection.</span>
        </h1>
        <p>
          Whether you’re looking for your next opportunity or your next great teammate, you’re in
          the right place.
        </p>
      </div>
      <LoginForm role={params.role ?? 'applicant'} message={params.message} />
    </div>
  );
}
