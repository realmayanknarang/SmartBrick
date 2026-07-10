import express from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { resolveMarketplaceUser } from '../../middleware/marketplace/checkOwnership.js';
import MarketplaceOrder from '../../models/marketplace/MarketplaceOrder.js';
import MarketplaceMaterial from '../../models/marketplace/MarketplaceMaterial.js';
import mongoose from 'mongoose';

const router = express.Router();

// ─── POST /api/marketplace/orders ────────────────────────────────────────────

router.post(
  '/orders',
  requireAuth,
  requireRole('builder'),
  resolveMarketplaceUser,
  async (req, res) => {
    try {
      const { materialId, quantity, deliveryAddress, contactPhone, notes } = req.body;
      const errors = [];

      if (!materialId) errors.push('materialId is required.');
      else if (!mongoose.Types.ObjectId.isValid(materialId)) errors.push('Invalid materialId.');

      if (!quantity || !Number.isFinite(Number(quantity)) || Number(quantity) < 1)
        errors.push('Quantity must be at least 1.');

      if (!deliveryAddress || !String(deliveryAddress).trim())
        errors.push('Delivery address is required.');

      if (!contactPhone || !String(contactPhone).trim())
        errors.push('Contact phone is required.');

      if (errors.length > 0) {
        return res.status(400).json({ error: 'Validation Error', messages: errors });
      }

      const material = await MarketplaceMaterial.findById(materialId).populate('vendor', 'name email');
      if (!material || !material.isActive) {
        return res.status(404).json({ error: 'Not Found', message: 'Material not found.' });
      }

      const order = await MarketplaceOrder.create({
        material:        material._id,
        builder:         req.user._id,
        vendor:          material.vendor._id,
        quantity:        Number(quantity),
        pricePerUnit:    material.pricePerUnit,
        deliveryAddress: String(deliveryAddress).trim(),
        contactPhone:    String(contactPhone).trim(),
        notes:           notes ? String(notes).trim() : undefined,
      });

      await order.populate([
        { path: 'material', select: 'name brand unit' },
        { path: 'vendor', select: 'name email' },
      ]);

      return res.status(201).json({ order });
    } catch (err) {
      if (err.name === 'ValidationError') {
        return res.status(400).json({
          error:    'Validation Error',
          messages: Object.values(err.errors).map((e) => e.message),
        });
      }
      console.error('[POST /api/marketplace/orders] Error:', err);
      return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to place order.' });
    }
  }
);

// ─── GET /api/marketplace/orders/my — builder's orders ───────────────────────

router.get(
  '/orders/my',
  requireAuth,
  requireRole('builder'),
  resolveMarketplaceUser,
  async (req, res) => {
    try {
      const orders = await MarketplaceOrder.find({ builder: req.user._id })
        .populate({ path: 'material', select: 'name brand unit category' })
        .populate({ path: 'vendor', select: 'name email' })
        .sort({ createdAt: -1 })
        .lean();

      return res.json({ orders, total: orders.length });
    } catch (err) {
      console.error('[GET /api/marketplace/orders/my] Error:', err);
      return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch orders.' });
    }
  }
);

// ─── GET /api/marketplace/orders/received — vendor's received orders ────────

router.get(
  '/orders/received',
  requireAuth,
  requireRole('vendor'),
  resolveMarketplaceUser,
  async (req, res) => {
    try {
      const orders = await MarketplaceOrder.find({ vendor: req.user._id })
        .populate({ path: 'material', select: 'name brand unit category' })
        .populate({ path: 'builder', select: 'name email' })
        .sort({ createdAt: -1 })
        .lean();

      return res.json({ orders, total: orders.length });
    } catch (err) {
      console.error('[GET /api/marketplace/orders/received] Error:', err);
      return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch orders.' });
    }
  }
);

// ─── PATCH /api/marketplace/orders/:id/status — vendor updates status ───────

router.patch(
  '/orders/:id/status',
  requireAuth,
  requireRole('vendor'),
  resolveMarketplaceUser,
  async (req, res) => {
    try {
      const { status } = req.body;
      const VALID_STATUSES = ['confirmed', 'shipped', 'delivered', 'cancelled'];

      if (!status || !VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          error: 'Validation Error',
          messages: [`Status must be one of: ${VALID_STATUSES.join(', ')}.`],
        });
      }

      const order = await MarketplaceOrder.findOne({ _id: req.params.id, vendor: req.user._id });
      if (!order) {
        return res.status(404).json({ error: 'Not Found', message: 'Order not found.' });
      }

      order.status = status;
      order.deliveryUpdates.push({ message: `Order ${status}`, stage: status === 'cancelled' ? 'processing' : status });
      await order.save();

      await order.populate([
        { path: 'material', select: 'name brand unit' },
        { path: 'builder', select: 'name email' },
      ]);

      return res.json({ order });
    } catch (err) {
      console.error('[PATCH /api/marketplace/orders/:id/status] Error:', err);
      return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update order status.' });
    }
  }
);

// ─── POST /api/marketplace/orders/:id/updates — vendor adds delivery update ──

router.post(
  '/orders/:id/updates',
  requireAuth,
  requireRole('vendor'),
  resolveMarketplaceUser,
  async (req, res) => {
    try {
      const { message } = req.body;

      if (!message || !String(message).trim()) {
        return res.status(400).json({ error: 'Validation Error', messages: ['Update message is required.'] });
      }

      const order = await MarketplaceOrder.findOne({ _id: req.params.id, vendor: req.user._id });
      if (!order) {
        return res.status(404).json({ error: 'Not Found', message: 'Order not found.' });
      }

      order.deliveryUpdates.push({ message: String(message).trim() });
      await order.save();

      await order.populate([
        { path: 'material', select: 'name brand unit' },
        { path: 'builder', select: 'name email' },
      ]);

      return res.json({ order });
    } catch (err) {
      console.error('[POST /api/marketplace/orders/:id/updates] Error:', err);
      return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to add update.' });
    }
  }
);

export default router;
