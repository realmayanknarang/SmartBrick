import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [2, 'Project name must be at least 2 characters'],
    },
    builderName: {
      type: String,
      required: [true, 'Builder name is required'],
      trim: true,
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['planning', 'foundation', 'structure', 'finishing', 'completed'],
        message: 'Status must be one of: planning, foundation, structure, finishing, completed',
      },
      default: 'planning',
    },
    budget: {
      type: Number,
      required: [true, 'Budget is required'],
      min: [0, 'Budget cannot be negative'],
    },
    spentSoFar: {
      type: Number,
      default: 0,
      min: [0, 'Spent so far cannot be negative'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    expectedEndDate: {
      type: Date,
      required: [true, 'Expected end date is required'],
      validate: {
        validator(v) {
          // this.startDate is available via the document context
          return v > this.startDate;
        },
        message: 'Expected end date must be after the start date',
      },
    },
  },
  { timestamps: true }
);

// ── Referential Integrity ──────────────────────────────────────────────────
//
// A Project must not be deleted while any Site still references it.
// Silently cascading the delete would orphan PurchaseOrders and UsageHistory
// records that reference those Sites, breaking historical traceability.
//
// Pattern: use mongoose.model('Site') lazily inside the hook to avoid
// circular-import issues (Site.js does not import Project.js).

/**
 * Shared guard used by both query-middleware hooks below.
 * Resolves the project _id from either a query filter or a document,
 * then counts referencing Sites and blocks deletion if any are found.
 *
 * @param {ObjectId} projectId
 * @param {Function} next
 */
async function guardProjectDelete(projectId, next) {
  try {
    const Site = mongoose.model('Site');
    const siteCount = await Site.countDocuments({ project: projectId });
    if (siteCount > 0) {
      return next(
        new Error(
          `Cannot delete Project: ${siteCount} Site(s) still reference it. ` +
            'Delete or reassign all associated Sites before removing the Project.'
        )
      );
    }
    next();
  } catch (err) {
    next(err);
  }
}

// Query-level: Project.deleteOne({ _id: id })  /  Project.deleteMany(...)
projectSchema.pre('deleteOne', { document: false, query: true }, async function (next) {
  const filter = this.getFilter();
  await guardProjectDelete(filter._id, next);
});

// Document-level: project.deleteOne()
projectSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  await guardProjectDelete(this._id, next);
});

// findOneAndDelete: Project.findOneAndDelete({ _id: id })
projectSchema.pre('findOneAndDelete', async function (next) {
  const filter = this.getFilter();
  await guardProjectDelete(filter._id, next);
});

const Project = mongoose.model('Project', projectSchema);

export default Project;
