/**
 * client/src/pages/marketplace/BrowseProjectsPage.jsx
 *
 * Builder Browse Projects Page — Sub-phase M5B.
 * Shows all open projects available to builders, with server-side filtering.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/Button';
import apiClient from '../../api/client';
import './BrowseProjectsPage.css';

// ─── Inline SVG Icons ────────────────────────────────────────────────────────

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function EmptySearchIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-on-dark-muted, #9FB0BC)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function EmptyProjectsIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-on-dark-muted, #9FB0BC)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 12;

const CONSTRUCTION_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'house', label: 'House' },
  { value: 'villa', label: 'Villa' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'other', label: 'Other' },
];

function formatINR(val) {
  if (val === undefined || val === null) return '';
  return new Intl.NumberFormat('en-IN').format(val);
}

function formatRelativeDays(dateString) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const diffDays = Math.floor((Date.now() - date) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

function typeBadgeClass(type) {
  switch (type) {
    case 'house':       return 'type-badge--house';
    case 'villa':       return 'type-badge--villa';
    case 'apartment':   return 'type-badge--apartment';
    case 'commercial':  return 'type-badge--commercial';
    case 'industrial':  return 'type-badge--industrial';
    default:            return 'type-badge--other';
  }
}

function formatTypeLabel(type) {
  if (!type) return 'Other';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <Card surface="navy" className="browse-project-card browse-project-card--loading">
      <div className="skeleton-badge pulse" />
      <div className="skeleton-title pulse" />
      <div className="skeleton-text pulse" />
      <div className="skeleton-text pulse" style={{ width: '60%' }} />
      <div className="skeleton-budget pulse" />
      <div className="skeleton-footer pulse" />
    </Card>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────────

function ProjectCard({ project }) {
  const descPreview = project.description
    ? project.description.length > 160
      ? project.description.slice(0, 157) + '...'
      : project.description
    : null;

  return (
    <Card surface="navy" className="browse-project-card">
      {/* Top: type badge */}
      <div className="browse-project-card__top">
        <span className={`type-badge ${typeBadgeClass(project.constructionType)}`}>
          {formatTypeLabel(project.constructionType)}
        </span>
        <span className="browse-project-card__posted">
          Posted {formatRelativeDays(project.createdAt)}
        </span>
      </div>

      {/* Title */}
      <h3 className="browse-project-card__title">{project.title}</h3>

      {/* Meta: location + timeline */}
      <div className="browse-project-card__meta">
        {project.location && (
          <span className="browse-project-card__meta-item">
            <PinIcon /> {project.location}
          </span>
        )}
        {project.timeline && (
          <span className="browse-project-card__meta-item">
            <CalendarIcon /> {project.timeline}
          </span>
        )}
      </div>

      {/* Budget */}
      <div className="browse-project-card__budget">
        <span className="budget-label">Budget Range</span>
        <span className="budget-value">
          ₹{formatINR(project.budgetMin)} – ₹{formatINR(project.budgetMax)}
        </span>
      </div>

      {/* Description preview */}
      {descPreview && (
        <p className="browse-project-card__desc">{descPreview}</p>
      )}

      {/* Footer: CTA */}
      <div className="browse-project-card__footer">
        <Button
          as={Link}
          to={`/marketplace/builder/projects/${project._id}`}
          variant="secondary"
          className="browse-project-card__view-btn"
          id={`view-project-${project._id}`}
        >
          View Details
        </Button>
      </div>
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

function BrowseProjectsPage() {
  // Filter state (local inputs — not applied until Search is clicked)
  const [filterType, setFilterType] = useState('');
  const [filterBudgetMin, setFilterBudgetMin] = useState('');
  const [filterBudgetMax, setFilterBudgetMax] = useState('');
  const [filterLocation, setFilterLocation] = useState('');

  // Applied filters (what the current fetch uses)
  const [appliedFilters, setAppliedFilters] = useState({
    constructionType: '',
    budgetMin: '',
    budgetMax: '',
    location: '',
  });

  const [projects, setProjects] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Track whether any filter was ever applied
  const [hasFiltered, setHasFiltered] = useState(false);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const fetchProjects = useCallback(async (filters, page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('status', 'open');
      params.set('page', page);
      params.set('limit', PAGE_SIZE);
      if (filters.constructionType) params.set('constructionType', filters.constructionType);
      if (filters.budgetMin)        params.set('budgetMin', filters.budgetMin);
      if (filters.budgetMax)        params.set('budgetMax', filters.budgetMax);
      if (filters.location)         params.set('location', filters.location);

      const res = await apiClient.get(`/marketplace/projects?${params.toString()}`);
      const data = res.data;

      // Support both paginated ({ projects, total }) and flat ({ projects }) responses
      const list = data.projects || [];
      setProjects(list);
      // If server returns total use it, otherwise use array length (no pagination)
      setTotalCount(data.total ?? data.totalCount ?? list.length);
    } catch (err) {
      console.error('[BrowseProjectsPage] Failed to fetch projects:', err);
      setProjects([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchProjects(appliedFilters, currentPage);
  }, [appliedFilters, currentPage, fetchProjects]);

  function handleSearch() {
    const newFilters = {
      constructionType: filterType,
      budgetMin: filterBudgetMin,
      budgetMax: filterBudgetMax,
      location: filterLocation,
    };
    setHasFiltered(true);
    setCurrentPage(1);
    setAppliedFilters(newFilters);
  }

  function handleClearFilters() {
    setFilterType('');
    setFilterBudgetMin('');
    setFilterBudgetMax('');
    setFilterLocation('');
    setHasFiltered(false);
    setCurrentPage(1);
    setAppliedFilters({ constructionType: '', budgetMin: '', budgetMax: '', location: '' });
  }

  function handlePageChange(newPage) {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const isFiltered =
    appliedFilters.constructionType ||
    appliedFilters.budgetMin ||
    appliedFilters.budgetMax ||
    appliedFilters.location;

  return (
    <div className="browse-projects-page">
      {/* Page Header */}
      <header className="browse-projects-page__header">
        <div className="browse-projects-page__header-left">
          <h2 className="browse-projects-page__title">Open Projects</h2>
          {!loading && (
            <span className="browse-projects-page__count" aria-live="polite">
              {totalCount} {totalCount === 1 ? 'project' : 'projects'} available
            </span>
          )}
        </div>
        <Link to="/marketplace/builder/proposals" className="browse-projects-page__my-link">
          My Proposals
        </Link>
      </header>

      {/* Filter Bar */}
      <div className="browse-filter-bar" role="search" aria-label="Filter projects">
        {/* Construction Type */}
        <div className="browse-filter-bar__field">
          <label htmlFor="filter-type" className="browse-filter-label">Type</label>
          <select
            id="filter-type"
            className="browse-filter-select"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          >
            {CONSTRUCTION_TYPES.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Budget Min */}
        <div className="browse-filter-bar__field">
          <label htmlFor="filter-budget-min" className="browse-filter-label">Min Budget (₹)</label>
          <input
            id="filter-budget-min"
            type="number"
            min="0"
            placeholder="e.g. 500000"
            className="browse-filter-input"
            value={filterBudgetMin}
            onChange={e => setFilterBudgetMin(e.target.value)}
          />
        </div>

        {/* Budget Max */}
        <div className="browse-filter-bar__field">
          <label htmlFor="filter-budget-max" className="browse-filter-label">Max Budget (₹)</label>
          <input
            id="filter-budget-max"
            type="number"
            min="0"
            placeholder="e.g. 5000000"
            className="browse-filter-input"
            value={filterBudgetMax}
            onChange={e => setFilterBudgetMax(e.target.value)}
          />
        </div>

        {/* Location */}
        <div className="browse-filter-bar__field browse-filter-bar__field--grow">
          <label htmlFor="filter-location" className="browse-filter-label">Location</label>
          <input
            id="filter-location"
            type="text"
            placeholder="City, state, or area…"
            className="browse-filter-input"
            value={filterLocation}
            onChange={e => setFilterLocation(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>

        {/* Actions */}
        <div className="browse-filter-bar__actions">
          <Button
            variant="primary"
            onClick={handleSearch}
            id="browse-search-btn"
            className="browse-filter-bar__search-btn"
          >
            Search
          </Button>
          {isFiltered && (
            <button
              type="button"
              className="browse-filter-bar__clear-link"
              onClick={handleClearFilters}
              id="browse-clear-filters-btn"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        /* Loading skeletons */
        <div className="browse-projects-grid" aria-label="Loading projects">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : projects.length === 0 ? (
        /* Empty state */
        <div className="browse-projects-empty">
          <div className="browse-projects-empty__icon" aria-hidden="true">
            {isFiltered ? <EmptySearchIcon /> : <EmptyProjectsIcon />}
          </div>
          {isFiltered ? (
            <>
              <h3 className="browse-projects-empty__title">No projects match your filters</h3>
              <p className="browse-projects-empty__subtitle">
                Try adjusting or clearing your filters to see more results.
              </p>
              <Button
                variant="primary"
                onClick={handleClearFilters}
                id="browse-empty-clear-btn"
              >
                Clear Filters
              </Button>
            </>
          ) : (
            <>
              <h3 className="browse-projects-empty__title">No open projects right now</h3>
              <p className="browse-projects-empty__subtitle">
                No projects are open right now. Check back soon!
              </p>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="browse-projects-grid">
            {projects.map(project => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="browse-pagination" aria-label="Projects pagination">
              <button
                className="browse-pagination__btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous page"
                id="pagination-prev-btn"
              >
                <ChevronLeftIcon /> Previous
              </button>
              <span className="browse-pagination__info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="browse-pagination__btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next page"
                id="pagination-next-btn"
              >
                Next <ChevronRightIcon />
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

export default BrowseProjectsPage;
