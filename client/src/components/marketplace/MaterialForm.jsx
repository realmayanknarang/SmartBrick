/**
 * client/src/components/marketplace/MaterialForm.jsx
 *
 * Shared Material Form — Phase M6B.
 * Used by both AddMaterialPage (new listing) and EditMaterialPage (edit listing).
 * Renders all form fields and validation logic exactly once.
 *
 * Props
 * ──────────────────────────────────────────────────────────────────────────
 * initialValues  object — pre-filled field values (optional, omit for Add)
 * onSubmit       function(formData) — called with validated form data on submit
 * isLoading      boolean — disables all inputs and the submit button
 * submitLabel    string — label for the submit button (e.g. "Add Material" / "Save Changes")
 * loadingLabel   string — label shown while loading (defaults to "Saving...")
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import TextInput from '../TextInput';
import Select from '../Select';
import Button from '../Button';
import './MaterialForm.css';

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { value: 'cement',     label: 'Cement' },
  { value: 'steel',      label: 'Steel' },
  { value: 'sand',       label: 'Sand' },
  { value: 'bricks',     label: 'Bricks' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing',   label: 'Plumbing' },
  { value: 'paint',      label: 'Paint' },
  { value: 'flooring',   label: 'Flooring' },
  { value: 'other',      label: 'Other' },
];

// ─── MaterialForm ─────────────────────────────────────────────────────────────

function MaterialForm({
  initialValues = {},
  onSubmit,
  isLoading,
  submitLabel  = 'Submit',
  loadingLabel = 'Saving...',
}) {
  // Form State — initialise from initialValues (supports pre-fill for Edit)
  const [name, setName]               = useState(initialValues.name         ?? '');
  const [category, setCategory]       = useState(initialValues.category     ?? '');
  const [brand, setBrand]             = useState(initialValues.brand        ?? '');
  const [pricePerUnit, setPricePerUnit] = useState(
    initialValues.pricePerUnit !== undefined ? String(initialValues.pricePerUnit) : ''
  );
  const [unit, setUnit]               = useState(initialValues.unit         ?? '');
  const [stock, setStock]             = useState(
    initialValues.stock !== undefined ? String(initialValues.stock) : '0'
  );
  const [deliveryTime, setDeliveryTime] = useState(initialValues.deliveryTime ?? '');
  const [imageUrl, setImageUrl]       = useState(
    (initialValues.images && initialValues.images[0]?.url) ? initialValues.images[0].url : ''
  );

  // Validation errors
  const [errors, setErrors] = useState({});

  // ── Validation ──────────────────────────────────────────────────────────────
  function validate() {
    const newErrors = {};

    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = 'Name is required and must be at least 2 characters.';
    }

    if (!category) {
      newErrors.category = 'Category is required.';
    }

    if (pricePerUnit === '' || isNaN(Number(pricePerUnit)) || Number(pricePerUnit) < 0) {
      newErrors.pricePerUnit = 'Price per unit is required and must be a non-negative number.';
    }

    if (!unit.trim()) {
      newErrors.unit = 'Unit is required (e.g. "per bag", "per ton").';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ── Submit Handler ──────────────────────────────────────────────────────────
  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    const formData = {
      name:        name.trim(),
      category,
      brand:       brand.trim() || undefined,
      pricePerUnit: Number(pricePerUnit),
      unit:        unit.trim(),
      stock:       Number(stock) || 0,
      deliveryTime: deliveryTime.trim() || undefined,
    };

    // Only include images if a URL was entered
    if (imageUrl.trim()) {
      formData.images = [{ url: imageUrl.trim(), filename: 'main' }];
    }

    onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="material-form" noValidate>
      <div className="material-form__fields">

        {/* 1. Material Name */}
        <TextInput
          label="Material Name"
          placeholder="e.g. OPC 53 Grade Cement"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          error={errors.name}
          disabled={isLoading}
          id="material-form-name"
        />

        {/* 2. Category */}
        <Select
          label="Category"
          placeholder="Select a category..."
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          error={errors.category}
          disabled={isLoading}
          id="material-form-category"
        />

        {/* 3. Brand */}
        <TextInput
          label="Brand (Optional)"
          placeholder="e.g. UltraTech, JSW, ACC"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          disabled={isLoading}
          id="material-form-brand"
        />

        {/* 4. Price + Unit (side by side) */}
        <div className="material-form__row">
          <TextInput
            label="Price per Unit (₹)"
            type="number"
            placeholder="e.g. 395"
            value={pricePerUnit}
            onChange={(e) => setPricePerUnit(e.target.value)}
            required
            error={errors.pricePerUnit}
            disabled={isLoading}
            id="material-form-price"
            min="0"
          />
          <TextInput
            label="Unit"
            placeholder="per bag, per ton, per meter, per piece"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            required
            error={errors.unit}
            disabled={isLoading}
            id="material-form-unit"
          />
        </div>

        {/* 5. Stock Quantity */}
        <div className="material-form__field-group">
          <TextInput
            label="Current Stock"
            type="number"
            placeholder="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            disabled={isLoading}
            id="material-form-stock"
            min="0"
          />
          <p className="material-form__helper">
            Enter 0 if currently out of stock
          </p>
        </div>

        {/* 6. Delivery Time */}
        <TextInput
          label="Delivery Time (Optional)"
          placeholder="e.g. 1-2 days, Same day in Chandigarh"
          value={deliveryTime}
          onChange={(e) => setDeliveryTime(e.target.value)}
          disabled={isLoading}
          id="material-form-delivery"
        />

        {/* 7. Image URL */}
        <div className="material-form__field-group">
          <TextInput
            label="Material Image URL (Optional)"
            placeholder="https://example.com/image.jpg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            disabled={isLoading}
            id="material-form-image-url"
          />
          <p className="material-form__helper">
            Image upload via URL — enter a direct image URL if available (optional). File upload coming soon.
          </p>
        </div>

      </div>

      {/* Action Buttons */}
      <div className="material-form__actions">
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
          id="material-form-submit-btn"
        >
          {isLoading ? loadingLabel : submitLabel}
        </Button>

        <Link
          to="/marketplace/vendor/materials"
          className="material-form__cancel-link"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

export default MaterialForm;
