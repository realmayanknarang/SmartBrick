import express from 'express';
import User from '../models/User.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// ── SIGN UP ──────────────────────────────────────
router.post('/auth/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    // Validation
    const errors = {};
    if (!firstName?.trim())
      errors.firstName = 'First name is required';
    if (!lastName?.trim())
      errors.lastName = 'Last name is required';
    if (!email?.trim())
      errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = 'Invalid email format';
    if (!password)
      errors.password = 'Password is required';
    else if (password.length < 8)
      errors.password = 'Password must be at least 8 characters';

    const VALID_ROLES = [
      'owner', 'builder', 'vendor'
    ];
    if (!role || !VALID_ROLES.includes(role))
      errors.role = 'Please select a valid role';

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    // Check for existing email
    const existing = await User.findOne({
      email: email.toLowerCase().trim()
    });
    if (existing) {
      return res.status(409).json({
        errors: { email: 'An account with this email already exists' }
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      name: `${firstName.trim()} ${lastName.trim()}`
    });

    // Generate token
    const token = signToken({
      userId: user._id,
      role: user.role
    });

    // Return token + safe user object (no passwordHash)
    res.status(201).json({
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// ── SIGN IN ──────────────────────────────────────
router.post('/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Find user
    const user = await User.findOne({
      email: email.toLowerCase().trim()
    });

    // Use the same error message whether user doesn't
    // exist OR password is wrong — prevents email
    // enumeration attacks
    if (!user || !user.passwordHash) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    const passwordValid = await verifyPassword(
      password, user.passwordHash
    );
    if (!passwordValid) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Generate token
    const token = signToken({
      userId: user._id,
      role: user.role
    });

    res.json({
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({ error: 'Sign in failed' });
  }
});

// ── GET CURRENT USER ─────────────────────────────
// Used by the client on app load to restore session
router.get('/auth/me', requireAuth, (req, res) => {
  res.json({
    user: {
      _id: req.user._id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// ── SYNC ──────────────────────────────────────────
// Returns the current user's MongoDB id and role.
// Called by marketplace dashboards on mount to link
// the JWT-authenticated session to a MongoDB User ID.
router.post('/auth/sync', requireAuth, (req, res) => {
  res.json({
    id: req.user._id,
    role: req.user.role,
  });
});

// ── SIGN OUT ──────────────────────────────────────
// JWT is stateless — sign out is client-side only
// (delete the token). This endpoint exists for
// consistency and future token blacklisting if needed.
router.post('/auth/signout', requireAuth, (req, res) => {
  res.json({ message: 'Signed out successfully' });
});

export default router;
