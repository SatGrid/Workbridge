'use client';
import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, ArrowUpRight, X, MoveUpRight } from 'lucide-react';
import type { Job } from '@/lib/types';
import { JobCard } from './job-card';
export function JobBrowser({ jobs, sample }: { jobs: Job[]; sample: boolean }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All roles');
  const [workplace, setWorkplace] = useState('Any workplace');
  const [type, setType] = useState('Any type');
  const [sort, setSort] = useState('Newest');
  const filtered = useMemo(
    () =>
      jobs
        .filter(
          (j) =>
            (category === 'All roles' || j.category === category) &&
            (workplace === 'Any workplace' || j.workplace === workplace) &&
            (type === 'Any type' || j.type === type) &&
            `${j.title} ${j.companies.name} ${j.location}`
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .sort((a, b) =>
          sort === 'Highest salary'
            ? b.salary_max - a.salary_max
            : b.created_at.localeCompare(a.created_at),
        ),
    [jobs, category, workplace, type, query, sort],
  );
  const reset = () => {
    setQuery('');
    setCategory('All roles');
    setWorkplace('Any workplace');
    setType('Any type');
  };
  return (
    <>
      <section className="intro">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" /> A LITTLE AMBITION. A NEW BEGINNING.
          </div>
          <h1>
            Your next chapter
            <br />
            looks <span>good on you.</span>
          </h1>
          <p>
            Find work that feels like you. Discover roles across India
            <br className="desktop-break" /> at teams where you can make a difference.
          </p>
        </div>
        <div className="intro-note">
          <div className="orbit-icon">
            <MoveUpRight strokeWidth={1.25} />
          </div>
          <span>
            Good people.
            <br />
            Great possibilities.
          </span>
          <small>Your bridge to what’s next.</small>
        </div>
      </section>
      <div className="search-bar">
        <Search size={21} />
        <label className="sr-only" htmlFor="job-search">
          Search jobs, companies, or locations
        </label>
        <input
          id="job-search"
          placeholder="Job title, company, or location"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button aria-label="Clear search" className="icon-button" onClick={() => setQuery('')}>
            <X size={16} />
          </button>
        )}
        <span className="search-divider" />
        <label className="sr-only" htmlFor="workplace">
          Workplace
        </label>
        <select id="workplace" value={workplace} onChange={(e) => setWorkplace(e.target.value)}>
          <option>Any workplace</option>
          <option>Remote</option>
          <option>Hybrid</option>
          <option>On-site</option>
        </select>
        <button
          className="button button-primary"
          onClick={() =>
            document
              .getElementById('opportunities')
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        >
          Explore jobs <ArrowUpRight size={17} />
        </button>
      </div>
      <div className="browse-layout" id="opportunities">
        <aside className="filters">
          <div className="filter-heading">
            <h2>Make it your own</h2>
            <SlidersHorizontal size={16} />
          </div>
          <div className="filter-block">
            <h3>YOUR FIELD</h3>
            <div className="category-list">
              {['All roles', 'Engineering', 'Design', 'Product', 'Marketing', 'Operations'].map(
                (c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    aria-pressed={category === c}
                    className={category === c ? 'selected' : ''}
                  >
                    <span>{c}</span>
                    <span>
                      {c === 'All roles'
                        ? jobs.length
                        : jobs.filter((j) => j.category === c).length}
                    </span>
                  </button>
                ),
              )}
            </div>
          </div>
          <div className="filter-block">
            <label className="field">
              <span>EMPLOYMENT TYPE</span>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option>Any type</option>
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
                <option>Internship</option>
              </select>
            </label>
          </div>
          <button className="reset-button" onClick={reset}>
            Reset filters
          </button>
          <div className="sidebar-note">
            <span className="mini-bridge">↗</span>
            <h3>
              Small step.
              <br />
              Big possibility.
            </h3>
            <p>Your next opportunity could be one application away.</p>
          </div>
        </aside>
        <section className="results" aria-label="Job results">
          <div className="results-header">
            <div>
              <h2>
                Find your next move<span className="count-badge">{filtered.length}</span>
              </h2>
              <p aria-live="polite">
                {sample
                  ? 'A selection of sample opportunities to explore.'
                  : `${filtered.length} opportunities waiting for the right person.`}
              </p>
            </div>
            <label className="sort-label">
              Sort by
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option>Newest</option>
                <option>Highest salary</option>
              </select>
            </label>
          </div>
          {filtered.length ? (
            <div className="job-grid">
              {filtered.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Search size={30} />
              <h3>No matches just yet</h3>
              <p>Try a different keyword or expand your filters.</p>
              <button className="button button-secondary" onClick={reset}>
                Clear filters
              </button>
            </div>
          )}
          <div className="results-footnote">
            <span>Thoughtful teams. Meaningful work.</span>
            <span>
              Make your next move count <ArrowUpRight size={14} />
            </span>
          </div>
        </section>
      </div>
    </>
  );
}
