import mongoose, { Schema, models, model } from "mongoose";

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
  EDITOR = "editor",
  COUNSELOR = "counselor",
}

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  theme: "light" | "dark";
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    theme: { type: String, enum: ["light", "dark"], default: "light" },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },
  },
  { timestamps: true }
);

export const User = models.User || model<IUser>("User", UserSchema);
