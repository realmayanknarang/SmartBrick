/**
 * server/tests/integration/marketplaceRoleIsolation.test.js
 *
 * Phase M8A — Security audit: role isolation + ownership on marketplace routes.
 *
 * These tests mount the marketplace routers on a bare Express app (the real
 * index.js calls app.listen() at import time and is not exported) and exercise
 * the requireAuth / requireRole / ownership guards with real JWTs.
 *
 * Covers the explicit role-violation checks (a-d) from the M8A spec plus the
 * two GET /materials role-gate fixes added in this phase.
 */

// JWT_SECRET is provided by tests/dbHelper.js (setupFilesAfterEnv), which runs
// before this file's imports are evaluated — utils/jwt.js reads it at import time.

import express from 'express';
import request from 'supertest';

import User from '../../models/User.js';
import MarketplaceProject from '../../models/marketplace/MarketplaceProject.js';
import Proposal from '../../models/marketplace/Proposal.js';
import MarketplaceMaterial from '../../models/marketplace/MarketplaceMaterial.js';
import { signToken } from '../../utils/jwt.js';

import projectRouter from '../../routes/marketplace/projectRoutes.js';
import proposalRouter from '../../routes/marketplace/proposalRoutes.js';
import materialRouter from '../../routes/marketplace/materialRoutes.js';

// ─── Test app (marketplace routers only) ──────────────────────────────────────

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/marketplace', projectRouter);
  app.use('/api/marketplace', proposalRouter);
  app.use('/api/marketplace', materialRouter);
  return app;
}

const app = buildApp();

// ─── Fixtures ─────────────────────────────────────────────────────────────────

let seq = 0;
async function makeUser(role) {
  seq += 1;
  const user = await User.create({
    name: `${role}-${seq}`,
    email: `${role}-${seq}@test.dev`,
    role,
  });
  return { user, token: signToken({ userId: user._id.toString() }) };
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('M8A — marketplace role isolation', () => {
  it('(a) builder cannot approve a proposal → 403', async () => {
    const { token } = await makeUser('builder');
    const res = await request(app)
      .patch('/api/marketplace/proposals/507f1f77bcf86cd799439011/approve')
      .set(auth(token))
      .send();
    expect(res.status).toBe(403);
  });

  it('(b) marketplace_owner cannot submit a proposal → 403', async () => {
    const { token } = await makeUser('marketplace_owner');
    const res = await request(app)
      .post('/api/marketplace/proposals')
      .set(auth(token))
      .send({ projectId: '507f1f77bcf86cd799439011', estimatedBudget: 100, estimatedDuration: '3 months' });
    expect(res.status).toBe(403);
  });

  it('(c) builder cannot add a material → 403', async () => {
    const { token } = await makeUser('builder');
    const res = await request(app)
      .post('/api/marketplace/materials')
      .set(auth(token))
      .send({ name: 'Cement', category: 'cement', pricePerUnit: 350, unit: 'bag' });
    expect(res.status).toBe(403);
  });

  it('(d) internal site_engineer cannot list projects → 403', async () => {
    const { token } = await makeUser('site_engineer');
    const res = await request(app)
      .get('/api/marketplace/projects')
      .set(auth(token));
    expect(res.status).toBe(403);
  });

  it('internal role cannot browse marketplace materials → 403 (M8A Rule 3 fix)', async () => {
    const { token } = await makeUser('finance');
    const res = await request(app)
      .get('/api/marketplace/materials')
      .set(auth(token));
    expect(res.status).toBe(403);
  });

  it('marketplace_owner CAN browse materials → 200 (fix does not break legit roles)', async () => {
    const { token } = await makeUser('marketplace_owner');
    const res = await request(app)
      .get('/api/marketplace/materials')
      .set(auth(token));
    expect(res.status).toBe(200);
  });

  it('unauthenticated request → 401', async () => {
    const res = await request(app).get('/api/marketplace/projects');
    expect(res.status).toBe(401);
  });
});

describe('M8A — ownership enforcement on writes', () => {
  it('non-owner marketplace_owner cannot PATCH another owner’s project → 403', async () => {
    const { user: ownerA } = await makeUser('marketplace_owner');
    const { token: tokenB } = await makeUser('marketplace_owner');

    const project = await MarketplaceProject.create({
      owner: ownerA._id,
      title: 'Owner A villa',
      description: 'A private project',
      location: 'Pune',
      budgetMin: 100000,
      budgetMax: 200000,
      constructionType: 'villa',
    });

    const res = await request(app)
      .patch(`/api/marketplace/projects/${project._id}`)
      .set(auth(tokenB))
      .send({ title: 'Hijacked' });

    expect(res.status).toBe(403);

    // Confirm no write occurred.
    const fresh = await MarketplaceProject.findById(project._id).lean();
    expect(fresh.title).toBe('Owner A villa');
  });

  it('vendor cannot PATCH another vendor’s material → 403', async () => {
    const { user: vendorA } = await makeUser('vendor_supplier');
    const { token: tokenB } = await makeUser('vendor_supplier');

    const material = await MarketplaceMaterial.create({
      vendor: vendorA._id,
      name: 'Vendor A cement',
      category: 'cement',
      pricePerUnit: 350,
      unit: 'bag',
    });

    const res = await request(app)
      .patch(`/api/marketplace/materials/${material._id}`)
      .set(auth(tokenB))
      .send({ pricePerUnit: 1 });

    expect(res.status).toBe(403);
    const fresh = await MarketplaceMaterial.findById(material._id).lean();
    expect(fresh.pricePerUnit).toBe(350);
  });

  it('duplicate proposal returns a clean 400 message, not a raw Mongo error', async () => {
    const { user: owner } = await makeUser('marketplace_owner');
    const { user: builder, token: builderToken } = await makeUser('builder');

    const project = await MarketplaceProject.create({
      owner: owner._id,
      title: 'Open project',
      description: 'Accepting proposals',
      location: 'Delhi',
      budgetMin: 100000,
      budgetMax: 500000,
      constructionType: 'house',
      status: 'open',
    });

    await Proposal.create({
      project: project._id,
      builder: builder._id,
      estimatedBudget: 300000,
      estimatedDuration: '6 months',
    });

    const res = await request(app)
      .post('/api/marketplace/proposals')
      .set(auth(builderToken))
      .send({ projectId: project._id.toString(), estimatedBudget: 320000, estimatedDuration: '5 months' });

    expect(res.status).toBe(400);
    expect(String(res.body.message)).toMatch(/already submitted a proposal/i);
  });
});
