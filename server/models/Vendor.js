import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vendor name is required'],
      trim: true,
      minlength: [2, 'Vendor name must be at least 2 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['cement', 'steel', 'sand', 'bricks', 'electrical', 'plumbing'],
        message: 'Category must be one of: cement, steel, sand, bricks, electrical, plumbing',
      },
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    contactPhone: {
      type: String,
      validate: {
        validator(v) {
          // Allow the field to be absent/null; only validate format when present
          if (v == null || v === '') return true;
          // Accepts optional leading +, then 7–15 digits (with optional spaces/dashes)
          return /^\+?[\d\s\-]{7,15}$/.test(v);
        },
        message: 'Please provide a valid phone number',
      },
    },
    pricePerUnit: {
      type: Number,
      required: [true, 'Price per unit is required'],
      min: [0, 'Price per unit cannot be negative'],
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      trim: true,
    },
    reliabilityScore: {
      type: Number,
      default: 0,
      min: [0, 'Reliability score cannot be less than 0'],
      max: [100, 'Reliability score cannot exceed 100'],
    },
    deliveryScore: {
      type: Number,
      default: 0,
      min: [0, 'Delivery score cannot be less than 0'],
      max: [100, 'Delivery score cannot exceed 100'],
    },
    qualityScore: {
      type: Number,
      default: 0,
      min: [0, 'Quality score cannot be less than 0'],
      max: [100, 'Quality score cannot exceed 100'],
    },
    pastDelays: {
      type: Number,
      default: 0,
      min: [0, 'Past delays cannot be negative'],
    },
    totalOrdersCompleted: {
      type: Number,
      default: 0,
      min: [0, 'Total orders completed cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound index: category + city — used heavily by vendor-selection queries
vendorSchema.index({ category: 1, city: 1 });

// ── Referential Integrity ──────────────────────────────────────────────────
//
// Vendors are intentionally NEVER hard-deleted.
// Any Vendor referenced by an existing PurchaseOrder must remain queryable
// so that historical orders stay meaningful and auditable.
//
// The ONLY supported "removal" is a soft-delete: set isActive = false via
// Vendor.softDelete(id).  Attempts to call Model.deleteOne(), doc.deleteOne(),
// or Model.findOneAndDelete() will be blocked by the middleware below.

const HARD_DELETE_ERROR =
  'Hard deletion of a Vendor is not permitted. ' +
  'Use Vendor.softDelete(id) to mark the vendor inactive instead. ' +
  'This protects the referential integrity of existing PurchaseOrders.';

// Block query-level deleteOne  (e.g. Vendor.deleteOne({ _id: id }))
vendorSchema.pre('deleteOne', { document: false, query: true }, function (next) {
  next(new Error(HARD_DELETE_ERROR));
});

// Block document-level deleteOne  (e.g. vendor.deleteOne())
vendorSchema.pre('deleteOne', { document: true, query: false }, function (next) {
  next(new Error(HARD_DELETE_ERROR));
});

// Block findOneAndDelete  (e.g. Vendor.findOneAndDelete({ _id: id }))
vendorSchema.pre('findOneAndDelete', function (next) {
  next(new Error(HARD_DELETE_ERROR));
});

/**
 * Vendor.softDelete(vendorId)
 *
 * The only supported way to "remove" a Vendor from active use.
 * Sets isActive = false so the vendor no longer appears in active listings
 * while keeping the document intact for historical PurchaseOrder references.
 *
 * @param {string|ObjectId} vendorId
 * @returns {Promise<Document|null>} The updated document, or null if not found.
 */
vendorSchema.statics.softDelete = function (vendorId) {
  return this.findByIdAndUpdate(
    vendorId,
    { isActive: false },
    { new: true, runValidators: true }
  );
};

const Vendor = mongoose.model('Vendor', vendorSchema);

export default Vendor;
