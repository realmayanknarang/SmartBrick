import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';

export async function createTestUser(overrides = {}) {
  const data = {
    name: 'Test User',
    email: `test_${Date.now()}@example.com`,
    role: 'owner',
    ...overrides,
  };

  // When role is explicitly null, bypass validation so the User can be
  // created without a role (used by the set-role test).
  const opts = data.role === null ? { validateBeforeSave: false } : {};

  console.log('[authHelper] creating user with:', JSON.stringify(data), 'opts:', JSON.stringify(opts));
  const user = await User.create(data, opts);
  if (data.role === null) {
    // Ensure the document actually has role:null in the DB
    await User.updateOne({ _id: user._id }, { $unset: { role: '' } });
  }

  const token = signToken({ userId: user._id });
  return { user, token };
}

export function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}
