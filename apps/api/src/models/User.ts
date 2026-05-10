import mongoose, { Schema } from "mongoose";

export const USER_ROLES = ["customer", "vendor", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface IUser {
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
      default: "customer"
    }
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 });

export const User =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);
