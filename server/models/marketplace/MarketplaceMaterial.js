/**
 * server/models/marketplace/MarketplaceMaterial.js
 *
 * A material listing posted by a vendor_supplier.
 * Vendors publish their product catalogue here; owners and builders
 * browse it when sourcing materials for a MarketplaceProject.
 *
 * Note: this is distinct from the existing Phase 1-13 Material model
 * (server/models/Material.js), which tracks stock on internal project
 * sites.  This model is the marketplace-facing product listing.
 *
 * Phase M1D — marketplace schema extension.
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

const marketplaceMaterialSchema = new Schema(
  {
    // The vendor_supplier who owns this listing.
    vendor: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Vendor reference is required'],
    },

    name: {
      type:      String,
      required:  [true, 'Material name is required'],
      trim:      true,
      minlength: [2, 'Material name must be at least 2 characters'],
    },

    category: {
      type:     String,
      required: [true, 'Category is required'],
      enum: {
        values: [
          'cement', 'steel', 'sand', 'bricks',
          'electrical', 'plumbing', 'paint', 'flooring', 'other',
        ],
        message:
          'category must be one of: cement, steel, sand, bricks, ' +
          'electrical, plumbing, paint, flooring, other',
      },
    },

    brand: {
      type: String,
      trim: true,
    },

    pricePerUnit: {
      type:     Number,
      required: [true, 'Price per unit is required'],
      min:      [0, 'Price per unit cannot be negative'],
    },

    unit: {
      type:     String,
      required: [true, 'Unit is required'],
      trim:     true,
    },

    stock: {
      type:    Number,
      default: 0,
      min:     [0, 'Stock cannot be negative'],
    },

    // Human-readable estimate, e.g. "3-5 business days".
    deliveryTime: {
      type: String,
      trim: true,
    },

    // Product images uploaded by the vendor.
    images: [
      {
        filename: { type: String },
        url:      { type: String },
      },
    ],

    // Soft-delete flag: set to false to de-list without data loss.
    isActive: {
      type:    Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────

// All listings for a specific vendor (vendor catalogue view).
marketplaceMaterialSchema.index({ vendor: 1 });

// Browse / filter by category across all vendors.
marketplaceMaterialSchema.index({ category: 1 });

const MarketplaceMaterial = mongoose.model('MarketplaceMaterial', marketplaceMaterialSchema);

export default MarketplaceMaterial;
