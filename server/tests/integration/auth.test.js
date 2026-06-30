import express from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';

const clerkUsers = new Map();

jest.unstable_mockModule('@clerk/express', () => ({
  getAuth: jest.fn((req) => ({
    userId: req.get('x-test-user-id') || null,
  })),
  clerkClient: {
    users: {
      getUser: jest.fn(async (userId) => {
        const email = clerkUsers.get(userId) || `${userId}@example.com`;
        return {
          id: userId,
          firstName: 'Test',
          lastName: 'User',
          primaryEmailAddressId: `email_${userId}`,
          emailAddresses: [
            { id: `email_${userId}`, emailAddress: email },
          ],
        };
      }),
    },
  },
  clerkMiddleware: jest.fn(() => (_req, _res, next) => next()),
}));

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
    clerkUsers.clear();
    app = buildApp();
  });

  test('protected routes return 401 with no auth token', async () => {
    const res = await request(app).get('/api/test-auth/protected');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  test('owner-only route returns 403 for the wrong role and 200 for owner', async () => {
    await User.create({
      name: 'Site Engineer',
      email: 'engineer@example.com',
      role: 'site_engineer',
      clerkUserId: 'user_engineer',
    });
    await User.create({
      name: 'Owner',
      email: 'owner@example.com',
      role: 'owner',
      clerkUserId: 'user_owner',
    });

    const forbidden = await request(app)
      .get('/api/test-auth/owner-only')
      .set('x-test-user-id', 'user_engineer');
    expect(forbidden.status).toBe(403);
    expect(forbidden.body.error).toBe('Forbidden');

    const allowed = await request(app)
      .get('/api/test-auth/owner-only')
      .set('x-test-user-id', 'user_owner');
    expect(allowed.status).toBe(200);
    expect(allowed.body.message).toBe('Owner access confirmed');
  });

  test('set-role endpoint blocks a second role selection for the same user', async () => {
    clerkUsers.set('user_new', 'new.user@example.com');

    const first = await request(app)
      .post('/api/auth/set-role')
      .set('x-test-user-id', 'user_new')
      .send({ role: 'site_engineer' });

    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({ success: true, role: 'site_engineer' });

    const second = await request(app)
      .post('/api/auth/set-role')
      .set('x-test-user-id', 'user_new')
      .send({ role: 'owner' });

    expect(second.status).toBe(403);
    expect(second.body.error).toBe('Forbidden');
    expect(second.body.message).toMatch(/Role already set/);

    const stored = await User.findOne({ clerkUserId: 'user_new' }).lean();
    expect(stored.role).toBe('site_engineer');
  });
});
