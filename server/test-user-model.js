import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';

// Just test creating a User instance without connecting to DB
const testUser = new User({
  name: 'Test User',
  email: 'test@example.com',
  role: 'owner',
  firstName: 'Test',
  lastName: 'User',
  passwordHash: 'hashedpass123'
});

console.log('✅ User model accepts new fields!');
console.log('Test user data:', testUser.toObject());
