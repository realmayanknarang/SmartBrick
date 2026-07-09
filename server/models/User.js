import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
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
    passwordHash: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: [
          'owner',    // property owner who posts projects
          'builder',  // contractor / construction company
          'vendor',   // material supplier
        ],
        message:
          'Role must be one of: owner, builder, vendor',
      },
    },
    /**
     * The user's Clerk user ID (e.g. "user_2abc...").
     * Populated once the user signs in through Clerk and their account is
     * linked via the /api/auth/sync endpoint (added in this phase).
     * Sparse index: existing seed documents without this field are unaffected.
     */
    clerkUserId: {
      type: String,
      unique: true,
      sparse: true, // allows multiple documents with no clerkUserId set
      trim: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;
