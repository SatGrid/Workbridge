import Link from 'next/link';
import { ArrowUpRight, BriefcaseBusiness, LayoutDashboard, UserRound } from 'lucide-react';
import { currentProfile, home } from '@/lib/auth';
import { signOut } from '@/app/actions';
import { Button } from './ui/button';
export async function Header() {
  const profile = await currentProfile();
  return (
    <header className="header">
      <div className="nav-wrap">
        <Link href="/" className="brand" aria-label="Workbridge home">
          <span className="brand-symbol">
            <span />
            <span />
            <span />
          </span>
          workbridge<span className="brand-period">.</span>
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/" className="nav-link">
            <BriefcaseBusiness size={17} /> Find a job
          </Link>
          {profile ? (
            <>
              <Link className="nav-link" href={home(profile.role)}>
                <LayoutDashboard size={17} /> My workspace
              </Link>
              <Link className="icon-button" href="/profile" aria-label="Your profile">
                <UserRound size={18} />
              </Link>
              <form action={signOut}>
                <Button variant="ghost">Sign out</Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login?role=recruiter" className="nav-link recruiter-link">
                For employers <ArrowUpRight size={15} />
              </Link>
              <Button asChild variant="secondary">
                <Link href="/login">
                  Sign in <ArrowUpRight size={16} />
                </Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
