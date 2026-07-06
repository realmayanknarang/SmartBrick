/**
 * client/src/pages/marketplace/CreateProjectPage.jsx
 *
 * Create Project Page — Sub-phase M4B.
 * Allows marketplace owners to post a new project with client-side validation.
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import TextInput from '../../components/TextInput';
import Select from '../../components/Select';
import Button from '../../components/Button';
import Card from '../../components/Card';
import apiClient from '../../api/client';
import './CreateProjectPage.css';

// ─── Inline Back Icon ────────────────────────────────────────────────────────

function ArrowLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

// ─── Small Textarea Field Component ─────────────────────────────────────────

function TextareaField({ label, required, value, onChange, placeholder, error }) {
  const controlClasses = [
    'textarea-field__control',
    error ? 'textarea-field__control--error' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className="textarea-field">
      <label className="textarea-field__label">
        {label}
        {required && <span className="textarea-field__required"> *</span>}
      </label>
      <textarea
        className={controlClasses}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
      />
      {error && <p className="textarea-field__error" role="alert">{error}</p>}
    </div>
  );
}

function CreateProjectPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  // Form Fields State
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [constructionType, setConstructionType] = useState('');
  const [plotSize, setPlotSize] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [timeline, setTimeline] = useState('');
  const [description, setDescription] = useState('');

  // Validation / Loading States
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // Fetch project details if in edit mode
  useEffect(() => {
    if (!isEdit) return;

    let active = true;
    async function fetchProject() {
      try {
        setLoading(true);
        const res = await apiClient.get(`/api/marketplace/projects/${id}`);
        if (!active) return;

        const p = res.data.project;
        setTitle(p.title || '');
        setLocation(p.location || '');
        setConstructionType(p.constructionType || '');
        setPlotSize(p.plotSize || '');
        setBudgetMin(p.budgetMin ? String(p.budgetMin) : '');
        setBudgetMax(p.budgetMax ? String(p.budgetMax) : '');
        setTimeline(p.timeline || '');
        setDescription(p.description || '');
      } catch (err) {
        console.error('[CreateProjectPage] Failed to fetch project:', err);
        setSubmitError('Failed to load project details.');
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchProject();
    return () => { active = false; };
  }, [id, isEdit]);

  // Construction type dropdown options
  const constructionOptions = [
    { value: 'house', label: 'House' },
    { value: 'villa', label: 'Villa' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'industrial', label: 'Industrial' },
    { value: 'other', label: 'Other' }
  ];

  // Perform validation on inputs
  const validateForm = () => {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Project title is required.';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Project title must be at least 3 characters.';
    }

    if (!location.trim()) {
      newErrors.location = 'Location is required.';
    }

    if (!constructionType) {
      newErrors.constructionType = 'Construction type is required.';
    }

    const min = Number(budgetMin);
    const max = Number(budgetMax);

    if (!budgetMin) {
      newErrors.budgetMin = 'Minimum budget is required.';
    } else if (isNaN(min) || min <= 0) {
      newErrors.budgetMin = 'Must be a positive number.';
    }

    if (!budgetMax) {
      newErrors.budgetMax = 'Maximum budget is required.';
    } else if (isNaN(max) || max <= 0) {
      newErrors.budgetMax = 'Must be a positive number.';
    } else if (min && max <= min) {
      newErrors.budgetMax = 'Maximum budget must be greater than minimum budget.';
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required.';
    } else if (description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload = {
        title: title.trim(),
        location: location.trim(),
        plotSize: plotSize.trim() || undefined,
        budgetMin: Number(budgetMin),
        budgetMax: Number(budgetMax),
        timeline: timeline.trim() || undefined,
        description: description.trim()
      };

      if (!isEdit) {
        payload.constructionType = constructionType;
        await apiClient.post('/api/marketplace/projects', payload);
        setSubmitSuccess('Project posted successfully!');
      } else {
        await apiClient.patch(`/api/marketplace/projects/${id}`, payload);
        setSubmitSuccess('Project updated successfully!');
      }
      
      setTimeout(() => {
        navigate('/marketplace/owner/projects');
      }, 1500);

    } catch (err) {
      console.error('[CreateProjectPage] Submit failed:', err);
      const apiErrorMessage = err?.response?.data?.message || err?.response?.data?.error || 'Failed to save project. Please try again.';
      setSubmitError(apiErrorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="create-project-page">
      {/* Header Row */}
      <header className="create-project-page__header">
        <Link to={isEdit ? `/marketplace/owner/projects/${id}` : '/marketplace/owner/projects'} className="create-project-page__back-btn" aria-label="Back">
          <ArrowLeftIcon />
        </Link>
        <h2 className="create-project-page__title">{isEdit ? 'Edit Project' : 'Post a New Project'}</h2>
      </header>

      <Card surface="navy-secondary" padding="var(--space-6)">
        <form onSubmit={handleSubmit} className="create-project-form" noValidate>
          <div className="create-project-form__grid">
            
            {/* Column 1 */}
            <div className="create-project-form__col">
              <TextInput
                label="Project Title"
                placeholder="e.g. 3BHK House in Sector 21"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                error={errors.title}
                disabled={loading}
              />

              <TextInput
                label="Location"
                placeholder="e.g. Chandigarh, Sector 21"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                error={errors.location}
                disabled={loading}
              />

              <Select
                label="Construction Type"
                placeholder="Select a type..."
                options={constructionOptions}
                value={constructionType}
                onChange={(e) => setConstructionType(e.target.value)}
                required
                error={errors.constructionType}
                disabled={loading || isEdit}
              />

              <TextInput
                label="Plot Size (Optional)"
                placeholder="e.g. 2400 sqft or 200 sq yards"
                value={plotSize}
                onChange={(e) => setPlotSize(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Column 2 */}
            <div className="create-project-form__col">
              <div className="budget-range-row">
                <TextInput
                  label="Min Budget (₹)"
                  type="number"
                  placeholder="Min"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  required
                  error={errors.budgetMin}
                  disabled={loading}
                />
                <TextInput
                  label="Max Budget (₹)"
                  type="number"
                  placeholder="Max"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  required
                  error={errors.budgetMax}
                  disabled={loading}
                />
              </div>

              <TextInput
                label="Timeline (Optional)"
                placeholder="e.g. 12 months"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                disabled={loading}
              />

              <TextareaField
                label="Description"
                placeholder="Describe your requirements, scope, preferred materials, and any specific notes for builders..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                error={errors.description}
                disabled={loading}
              />
            </div>

          </div>

          {/* Attachments Note */}
          <div className="attachments-note">
            <strong>Attachments Note:</strong> Document attachment will be available soon.
          </div>

          {/* Feedback Banners */}
          {submitError && (
            <div className="form-error-banner" role="alert">
              {submitError}
            </div>
          )}

          {submitSuccess && (
            <div className="form-success-banner" role="status">
              {submitSuccess}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="create-project-submit"
          >
            {loading ? (isEdit ? 'Saving...' : 'Posting...') : (isEdit ? 'Save Changes' : 'Post Project')}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default CreateProjectPage;
