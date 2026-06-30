import express from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';

jest.unstable_mockModule('@clerk/express', () => ({
  getAuth: jest.fn((req) => ({
    userId: req.get('x-test-user-id') || null,
  })),
  clerkClient: {
    users: {
      getUser: jest.fn(),
    },
  },
  clerkMiddleware: jest.fn(() => (_req, _res, next) => next()),
}));

const Vendor = (await import('../../models/Vendor.js')).default;
const vendorRouter = (await import('../../routes/vendorRoutes.js')).default;

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/vendors', vendorRouter);
  return app;
}

describe('vendor integration routes', () => {
  test('GET /api/vendors returns only active vendors', async () => {
    const active = await Vendor.create({
      name: 'Active Cement Co',
      category: 'cement',
      city: 'Mumbai',
      pricePerUnit: 350,
      unit: 'bag',
      reliabilityScore: 95,
      deliveryScore: 90,
      qualityScore: 88,
      isActive: true,
    });
    await Vendor.create({
      name: 'Inactive Cement Co',
      category: 'cement',
      city: 'Mumbai',
      pricePerUnit: 300,
      unit: 'bag',
      reliabilityScore: 100,
      deliveryScore: 100,
      qualityScore: 100,
      isActive: false,
    });

    const res = await request(buildApp())
      .get('/api/vendors')
      .set('x-test-user-id', 'user_authenticated');

    expect(res.status).toBe(200);
    expect(res.body.vendors).toHaveLength(1);
    expect(res.body.vendors[0]._id).toBe(String(active._id));
    expect(res.body.vendors.map((v) => v.name)).not.toContain('Inactive Cement Co');
  });

  test('GET /api/vendors is protected', async () => {
    const res = await request(buildApp()).get('/api/vendors');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });
});
