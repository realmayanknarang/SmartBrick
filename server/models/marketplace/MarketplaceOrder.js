import mongoose from 'mongoose';

const { Schema } = mongoose;

const deliveryUpdateSchema = new Schema({
  message:   { type: String, required: true, trim: true },
  stage:     { type: String, enum: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

const marketplaceOrderSchema = new Schema(
  {
    material: {
      type:     Schema.Types.ObjectId,
      ref:      'MarketplaceMaterial',
      required: [true, 'Material is required'],
    },
    builder: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Builder reference is required'],
    },
    vendor: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Vendor reference is required'],
    },
    quantity: {
      type:     Number,
      required: [true, 'Quantity is required'],
      min:      [1, 'Quantity must be at least 1'],
    },
    pricePerUnit: {
      type:     Number,
      required: [true, 'Price per unit is required'],
      min:      [0, 'Price cannot be negative'],
    },
    totalCost: {
      type: Number,
      min:  0,
    },
    deliveryAddress: {
      type:     String,
      required: [true, 'Delivery address is required'],
      trim:     true,
    },
    contactPhone: {
      type:     String,
      required: [true, 'Contact phone is required'],
      trim:     true,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type:    String,
      enum:    ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    deliveryUpdates: [deliveryUpdateSchema],
  },
  { timestamps: true }
);

marketplaceOrderSchema.pre('save', function (next) {
  this.totalCost = this.quantity * this.pricePerUnit;
  next();
});

marketplaceOrderSchema.index({ builder: 1 });
marketplaceOrderSchema.index({ vendor: 1 });
marketplaceOrderSchema.index({ status: 1 });

const MarketplaceOrder = mongoose.model('MarketplaceOrder', marketplaceOrderSchema);

export default MarketplaceOrder;
