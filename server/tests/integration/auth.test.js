import express from 'express';
import request from 'supertest';
import { createTestUser, authHeader } from '../authHelper.js';

const User = (await import('../../models/User.js')).default;
const authRouter = (await import('../../routes/auth.js')).default;
const testAuthRouter = (await import('../../routes/testAuth.js')).default;

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  app.use('/api/test-auth', testAuthRouter);
  return app;
}

describe('auth integration routes', () => {
  let app;

  beforeEach(() => {
    app = buildApp();
  });

  test('protected routes return 401 with no auth token', async () => {
    const res = await request(app).get('/api/test-auth/protected');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Authentication required');
  });

  test('owner-only route returns 403 for the wrong role and 200 for owner', async () => {
    const { token: builderToken } = await createTestUser({ name: 'Builder', role: 'builder' });
    const { token: ownerToken } = await createTestUser({ name: 'Owner', role: 'owner' });

    const forbidden = await request(app)
      .get('/api/test-auth/owner-only')
      .set(authHeader(builderToken));
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.error).toBe('Insufficient permissions');

    const allowed = await request(app)
      .get('/api/test-auth/owner-only')
      .set(authHeader(ownerToken));
    expect(allowed.status).toBe(200);
    expect(allowed.body.message).toBe('Owner access confirmed');
  });

  test('set-role endpoint blocks a second role selection for the same user', async () => {
    const { token } = await createTestUser({ name: 'New User', email: 'new.user@example.com', role: null });

    const first = await request(app)
      .post('/api/auth/set-role')
      .set(authHeader(token))
      .send({ role: 'builder' });

    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({ success: true, role: 'builder' });

    const second = await request(app)
      .post('/api/auth/set-role')
      .set(authHeader(token))
      .send({ role: 'owner' });

    expect(second.status).toBe(403);
    expect(second.body.error).toBe('Forbidden');
    expect(second.body.message).toMatch(/Role already set/);

    const stored = await User.findOne({ email: 'new.user@example.com' }).lean();
    expect(stored.role).toBe('builder');
  });
});
