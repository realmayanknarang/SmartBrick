import PurchaseOrder from '../../models/PurchaseOrder.js';
import Project from '../../models/Project.js';
import Site from '../../models/Site.js';
import Vendor from '../../models/Vendor.js';
import Material from '../../models/Material.js';
import '../../models/UsageHistory.js';

async function createProject(overrides = {}) {
  return Project.create({
    name: 'Integration Project',
    builderName: 'Builder',
    status: 'planning',
    budget: 1_000_000,
    startDate: new Date('2025-01-01'),
    expectedEndDate: new Date('2025-12-31'),
    ...overrides,
  });
}

async function createSite(projectId, overrides = {}) {
  return Site.create({
    project: projectId,
    name: 'Integration Site',
    city: 'Mumbai',
    latitude: 19.076,
    longitude: 72.877,
    currentPhase: 'foundation',
    ...overrides,
  });
}

async function createVendor(overrides = {}) {
  return Vendor.create({
    name: 'Integration Vendor',
    category: 'cement',
    city: 'Delhi',
    pricePerUnit: 350,
    unit: 'bag',
    ...overrides,
  });
}

async function createMaterial(overrides = {}) {
  return Material.create({
    name: 'OPC Cement',
    category: 'cement',
    unit: 'bag',
    ...overrides,
  });
}

async function createOrderData(overrides = {}) {
  const project = await createProject();
  const site = await createSite(project._id);
  const vendor = await createVendor();
  const material = await createMaterial();

  return {
    project: project._id,
    site: site._id,
    vendor: vendor._id,
    material: material._id,
    quantity: 12,
    pricePerUnit: 425,
    totalCost: 1,
    orderDate: new Date('2025-04-10'),
    deliveryStatus: 'pending',
    approvalStage: 'site_engineer',
    ...overrides,
  };
}

describe('PurchaseOrder integration behavior', () => {
  test('creating a valid PurchaseOrder succeeds and recalculates totalCost', async () => {
    const order = await PurchaseOrder.create(await createOrderData({
      quantity: 12,
      pricePerUnit: 425,
      totalCost: 99,
    }));

    expect(order.totalCost).toBe(5_100);
  });

  test('creating a PurchaseOrder with invalid quantity is rejected with validation details', async () => {
    await expect(
      PurchaseOrder.create(await createOrderData({ quantity: -1 }))
    ).rejects.toMatchObject({
      name: 'ValidationError',
      errors: {
        quantity: expect.objectContaining({
          message: 'Quantity must be at least 1',
        }),
      },
    });
  });

  test('creating a PurchaseOrder with negative price is rejected with validation details', async () => {
    await expect(
      PurchaseOrder.create(await createOrderData({ pricePerUnit: -1 }))
    ).rejects.toMatchObject({
      name: 'ValidationError',
      errors: {
        pricePerUnit: expect.objectContaining({
          message: 'Price per unit cannot be negative',
        }),
      },
    });
  });

  test('deleting a Project that still has Sites referencing it is blocked', async () => {
    const project = await createProject();
    await createSite(project._id);

    await expect(
      Project.deleteOne({ _id: project._id })
    ).rejects.toThrow(/Cannot delete Project/);

    expect(await Project.exists({ _id: project._id })).not.toBeNull();
  });

  test('deleting a Project with no referencing Sites succeeds', async () => {
    const project = await createProject();

    await expect(
      Project.deleteOne({ _id: project._id })
    ).resolves.toMatchObject({ deletedCount: 1 });

    expect(await Project.exists({ _id: project._id })).toBeNull();
  });
});
