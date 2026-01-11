import type { User as PrismaUser } from '.prisma/client';
import prisma from '../services/db.service';

// Re-export Prisma User type
export type User = PrismaUser;

// Input types derived from the model
export type UserCreateInput = {
  email: string;
  name?: string | null;
};

export type UserUpdateInput = {
  email?: string;
  name?: string | null;
};

// User model accessor
export const UserModel = prisma.user;
