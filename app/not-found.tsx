import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="empty-state">
      <h1>This page has moved on</h1>
      <p>The job may have been removed, or this link is no longer available.</p>
      <Link className="button button-primary" href="/">
        Explore jobs
      </Link>
    </div>
  );
}
