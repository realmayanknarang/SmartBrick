import mongoose from 'mongoose';

const purchaseOrderSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
    },
    site: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Site',
      required: [true, 'Site reference is required'],
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: [true, 'Vendor reference is required'],
    },
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material',
      required: [true, 'Material reference is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    pricePerUnit: {
      type: Number,
      required: [true, 'Price per unit is required'],
      min: [0, 'Price per unit cannot be negative'],
    },
    totalCost: {
      type: Number,
      required: [true, 'Total cost is required'],
      min: [0, 'Total cost cannot be negative'],
    },
    orderDate: {
      type: Date,
      required: [true, 'Order date is required'],
    },
    deliveryStatus: {
      type: String,
      required: [true, 'Delivery status is required'],
      enum: {
        values: ['pending', 'delivered', 'delayed'],
        message: 'Delivery status must be one of: pending, delivered, delayed',
      },
      default: 'pending',
    },
    approvalStage: {
      type: String,
      required: [true, 'Approval stage is required'],
      enum: {
        values: ['site_engineer', 'project_manager', 'finance', 'approved', 'rejected'],
        message: 'Approval stage must be one of: site_engineer, project_manager, finance, approved, rejected',
      },
      default: 'site_engineer',
    },
  },
  { timestamps: true }
);

// Pre-save hook: always recalculate totalCost from quantity * pricePerUnit
// to prevent stale or tampered client values from persisting.
purchaseOrderSchema.pre('save', function (next) {
  this.totalCost = this.quantity * this.pricePerUnit;
  next();
});

// Compound index: project + site — filters all orders belonging to a specific site
purchaseOrderSchema.index({ project: 1, site: 1 });
// Single-field index: orderDate descending — supports reverse-chronological order feeds
purchaseOrderSchema.index({ orderDate: -1 });

const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);

export default PurchaseOrder;
