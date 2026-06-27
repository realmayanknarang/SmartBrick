import mongoose from 'mongoose';

const siteSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
    },
    name: {
      type: String,
      required: [true, 'Site name is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180'],
    },
    currentPhase: {
      type: String,
      required: [true, 'Current phase is required'],
      enum: {
        values: ['foundation', 'structure', 'finishing'],
        message: 'Current phase must be one of: foundation, structure, finishing',
      },
    },
  },
  { timestamps: true }
);

// Index: project — lists all sites under a project efficiently
siteSchema.index({ project: 1 });

// ── Referential Integrity ──────────────────────────────────────────────────
//
// A Site must not be deleted while PurchaseOrders or UsageHistory records
// still reference it. Doing so would leave those documents pointing at a
// non-existent Site, corrupting financial and consumption history.
//
// Pattern: load PurchaseOrder and UsageHistory lazily via mongoose.model()
// to avoid circular imports (those models import Site, not vice-versa).

/**
 * Shared guard used by both query-middleware hooks below.
 * Counts PurchaseOrders and UsageHistory records referencing this site
 * and blocks deletion if either count is non-zero.
 *
 * @param {ObjectId} siteId
 * @param {Function} next
 */
async function guardSiteDelete(siteId, next) {
  try {
    const PurchaseOrder = mongoose.model('PurchaseOrder');
    const UsageHistory  = mongoose.model('UsageHistory');

    const [orderCount, usageCount] = await Promise.all([
      PurchaseOrder.countDocuments({ site: siteId }),
      UsageHistory.countDocuments({ site: siteId }),
    ]);

    const problems = [];
    if (orderCount > 0) problems.push(`${orderCount} PurchaseOrder(s)`);
    if (usageCount > 0) problems.push(`${usageCount} UsageHistory record(s)`);

    if (problems.length > 0) {
      return next(
        new Error(
          `Cannot delete Site: ${problems.join(' and ')} still reference it. ` +
            'Reassign or remove those records before deleting the Site.'
        )
      );
    }
    next();
  } catch (err) {
    next(err);
  }
}

// Query-level: Site.deleteOne({ _id: id })
siteSchema.pre('deleteOne', { document: false, query: true }, async function (next) {
  const filter = this.getFilter();
  await guardSiteDelete(filter._id, next);
});

// Document-level: site.deleteOne()
siteSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  await guardSiteDelete(this._id, next);
});

// findOneAndDelete: Site.findOneAndDelete({ _id: id })
siteSchema.pre('findOneAndDelete', async function (next) {
  const filter = this.getFilter();
  await guardSiteDelete(filter._id, next);
});

const Site = mongoose.model('Site', siteSchema);

export default Site;
