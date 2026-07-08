/**
 * server/routes/auth.js
 *
 * Custom JWT-based authentication endpoints:
 * - POST /api/auth/signup: Register new user with email/password and role
 * - POST /api/auth/signin: Sign in with email/password, return JWT
 * - POST /api/auth/set-role: Set role for users who signed up without one
 * - GET /api/auth/me: Get current user info
 */

import { Router } from 'express';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';

const router = Router();

// Apply the stricter auth rate limit (20 req / 15 min per IP) to every
// endpoint on this router — protects against brute-force on auth flows.
router.use(authLimiter);

const ALLOWED_ROLES = [
  'owner',
  'project_manager',
  'site_engineer',
  'finance',
  'marketplace_owner',
  'builder',
  'vendor_supplier',
];

// ── POST /api/auth/signup ────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required.',
      });
    }

    // Validate role if provided
    if (role && !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid role. Must be one of: ${ALLOWED_ROLES.join(', ')}`,
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'User with this email already exists.',
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const name = [firstName, lastName].filter(Boolean).join(' ') || email.split('@')[0];
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      firstName: firstName || null,
      lastName: lastName || null,
      name,
      role: role || null,
    });

    // Sign JWT
    const token = signToken({ userId: user._id });

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (err) {
    console.error('[POST /api/auth/signup] Error:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while creating your account.',
    });
  }
});

// ── POST /api/auth/signin ────────────────────────────────────────────────────
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required.',
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password.',
      });
    }

    // Check if user has a password (for existing seed users)
    if (!user.passwordHash) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'This account does not have a password set. Please contact support.',
      });
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password.',
      });
    }

    // Sign JWT
    const token = signToken({ userId: user._id });

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (err) {
    console.error('[POST /api/auth/signin] Error:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while signing in.',
    });
  }
});

// ── POST /api/auth/set-role ──────────────────────────────────────────────────
router.post('/set-role', requireAuth, async (req, res) => {
  try {
    const { role } = req.body;

    // Validate role
    if (!role || !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Role must be one of: ${ALLOWED_ROLES.join(', ')}. Received: "${role ?? ''}"`,
      });
    }

    // Get user from req
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found.',
      });
    }

    // Abuse guard — role already set
    if (user.role) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Role already set. Contact an admin to change it.',
      });
    }

    // Set role
    user.role = role;
    await user.save();

    return res.status(200).json({
      success: true,
      role: user.role,
    });
  } catch (err) {
    console.error('[POST /api/auth/set-role] Error:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while saving your role.',
    });
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  try {
    return res.status(200).json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
      },
    });
  } catch (err) {
    console.error('[GET /api/auth/me] Error:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred.',
    });
  }
});

export default router;
