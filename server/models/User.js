import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: ['owner', 'project_manager', 'site_engineer', 'finance'],
        message: 'Role must be one of: owner, project_manager, site_engineer, finance',
      },
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;
