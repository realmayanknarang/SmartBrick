/**
 * server/tests/unit/modelValidators.test.js
 *
 * Unit tests for Mongoose schema validators and hooks — Phase 12B
 * ─────────────────────────────────────────────────────────────────────────────
 * Tests the custom logic baked into the Mongoose schemas:
 *
 *   1. Project — date-ordering validator:
 *      expectedEndDate must be AFTER startDate (Phase 2)
 *
 *   2. PurchaseOrder — totalCost pre-save hook:
 *      totalCost is always recalculated as quantity × pricePerUnit on save,
 *      regardless of the value submitted by the client (Phase 2)
 *
 *   3. Vendor — soft-delete enforcement:
 *      Hard deletion is blocked; isActive=false is the only permitted removal
 *
 * These tests use the in-memory MongoDB instance configured in tests/setup.js
 * and cleaned between tests by tests/dbHelper.js (via setupFilesAfterEnv).
 * They DO NOT touch the real Atlas database.
 */

import mongoose from 'mongoose';
import Project      from '../../models/Project.js';
import PurchaseOrder from '../../models/PurchaseOrder.js';
import Vendor       from '../../models/Vendor.js';
import Site         from '../../models/Site.js';
import Material     from '../../models/Material.js';

// ─── Shared test-data factories ───────────────────────────────────────────────

/** Creates a minimal valid Project document in the in-memory DB */
async function createProject(overrides = {}) {
  return Project.create({
    name:            'Test Project',
    builderName:     'Test Builder',
    status:          'planning',
    budget:          1_000_000,
    startDate:       new Date('2024-01-01'),
    expectedEndDate: new Date('2025-01-01'),
    ...overrides,
  });
}

/** Creates a minimal valid Site document */
async function createSite(projectId, overrides = {}) {
  return Site.create({
    project:      projectId,
    name:         'Test Site',
    city:         'Mumbai',
    latitude:     19.076,
    longitude:    72.877,
    currentPhase: 'foundation',
    ...overrides,
  });
}

/** Creates a minimal valid Vendor document */
async function createVendor(overrides = {}) {
  return Vendor.create({
    name:         'Test Vendor',
    category:     'cement',
    city:         'Delhi',
    pricePerUnit: 350,
    unit:         'bag',
    ...overrides,
  });
}

/** Creates a minimal valid Material document */
async function createMaterial(overrides = {}) {
  return Material.create({
    name:     'OPC Cement',
    category: 'cement',
    unit:     'bag',
    ...overrides,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Project — date-ordering validator
// ─────────────────────────────────────────────────────────────────────────────

describe('Project schema — date-ordering validator', () => {

  test('creating a Project with expectedEndDate AFTER startDate succeeds', async () => {
    await expect(
      Project.create({
        name:            'Valid Project',
        builderName:     'Builder A',
        status:          'planning',
        budget:          500_000,
        startDate:       new Date('2024-03-01'),
        expectedEndDate: new Date('2025-03-01'), // after start — valid
      })
    ).resolves.toBeTruthy();
  });

  test('creating a Project with expectedEndDate BEFORE startDate is rejected', async () => {
    await expect(
      Project.create({
        name:            'Invalid Project',
        builderName:     'Builder B',
        status:          'planning',
        budget:          500_000,
        startDate:       new Date('2025-01-01'),
        expectedEndDate: new Date('2024-01-01'), // before start — invalid
      })
    ).rejects.toMatchObject({
      name: 'ValidationError',
    });
  });

  test('creating a Project with expectedEndDate EQUAL to startDate is rejected', async () => {
    const sameDate = new Date('2024-06-01');
    await expect(
      Project.create({
        name:            'Same Date Project',
        builderName:     'Builder C',
        status:          'planning',
        budget:          500_000,
        startDate:       sameDate,
        expectedEndDate: sameDate, // same date — NOT after, so invalid
      })
    ).rejects.toMatchObject({
      name: 'ValidationError',
    });
  });

  test('error message mentions expectedEndDate when date ordering is violated', async () => {
    try {
      await Project.create({
        name:            'Bad Dates',
        builderName:     'Builder D',
        status:          'planning',
        budget:          100_000,
        startDate:       new Date('2025-06-01'),
        expectedEndDate: new Date('2024-01-01'),
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (err) {
      expect(err.errors.expectedEndDate.message).toContain('after the start date');
    }
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// 2. PurchaseOrder — totalCost pre-save hook
// ─────────────────────────────────────────────────────────────────────────────

describe('PurchaseOrder schema — totalCost pre-save hook', () => {

  let project, site, vendor, material;

  beforeEach(async () => {
    project  = await createProject();
    site     = await createSite(project._id);
    vendor   = await createVendor();
    material = await createMaterial();
  });

  function makeOrderData(overrides = {}) {
    return {
      project:      project._id,
      site:         site._id,
      vendor:       vendor._id,
      material:     material._id,
      quantity:     10,
      pricePerUnit: 350,
      totalCost:    999,       // intentionally wrong — hook should recalculate
      orderDate:    new Date(),
      deliveryStatus: 'pending',
      approvalStage:  'site_engineer',
      ...overrides,
    };
  }

  test('totalCost is recalculated as quantity × pricePerUnit on save, ignoring submitted value', async () => {
    const order = await PurchaseOrder.create(makeOrderData({
      quantity:     10,
      pricePerUnit: 350,
      totalCost:    1,         // deliberately wrong
    }));

    // Hook should have overwritten 1 with 10 × 350 = 3500
    expect(order.totalCost).toBe(3500);
  });

  test('totalCost is recalculated correctly for large quantities', async () => {
    const order = await PurchaseOrder.create(makeOrderData({
      quantity:     500,
      pricePerUnit: 420,
      totalCost:    0,         // wrong
    }));

    expect(order.totalCost).toBe(210_000); // 500 × 420
  });

  test('totalCost is recalculated on update via doc.save() too', async () => {
    const order = await PurchaseOrder.create(makeOrderData({
      quantity:     10,
      pricePerUnit: 350,
    }));

    // Modify the order and save again
    order.quantity     = 20;
    order.pricePerUnit = 400;
    order.totalCost    = 999; // wrong — hook should fix it
    await order.save();

    expect(order.totalCost).toBe(8000); // 20 × 400
  });

  test('creating a PurchaseOrder with quantity < 1 is rejected', async () => {
    await expect(
      PurchaseOrder.create(makeOrderData({ quantity: 0 }))
    ).rejects.toMatchObject({ name: 'ValidationError' });
  });

  test('creating a PurchaseOrder with negative pricePerUnit is rejected', async () => {
    await expect(
      PurchaseOrder.create(makeOrderData({ pricePerUnit: -1 }))
    ).rejects.toMatchObject({ name: 'ValidationError' });
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Vendor — soft-delete enforcement (hard delete is blocked)
// ─────────────────────────────────────────────────────────────────────────────

describe('Vendor schema — soft-delete enforcement', () => {

  test('Vendor.softDelete() sets isActive to false without deleting the document', async () => {
    const vendor = await createVendor({ name: 'Soft Delete Vendor' });
    const updated = await Vendor.softDelete(vendor._id);

    expect(updated.isActive).toBe(false);

    // Document still exists in the DB
    const stillExists = await Vendor.findById(vendor._id);
    expect(stillExists).not.toBeNull();
  });

  test('Vendor.deleteOne() (query-level) is blocked — hard deletion not permitted', async () => {
    const vendor = await createVendor({ name: 'Hard Delete Vendor' });

    await expect(
      Vendor.deleteOne({ _id: vendor._id })
    ).rejects.toThrow(/Hard deletion of a Vendor is not permitted/);
  });

  test('vendor.deleteOne() (document-level) is blocked', async () => {
    const vendor = await createVendor({ name: 'Doc Level Delete Vendor' });

    await expect(
      vendor.deleteOne()
    ).rejects.toThrow(/Hard deletion of a Vendor is not permitted/);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Project — referential integrity (cannot delete if Sites exist)
// ─────────────────────────────────────────────────────────────────────────────

describe('Project schema — referential integrity guard', () => {

  test('deleting a Project that has Sites referencing it is blocked', async () => {
    const project = await createProject();
    await createSite(project._id); // creates a Site referencing this project

    // Attempt to delete the project — should be blocked
    await expect(
      Project.deleteOne({ _id: project._id })
    ).rejects.toThrow(/Cannot delete Project/);
  });

  test('deleting a Project with NO Sites succeeds', async () => {
    const project = await createProject();
    // No sites created — deletion should succeed

    await expect(
      Project.deleteOne({ _id: project._id })
    ).resolves.not.toThrow();
  });

});
