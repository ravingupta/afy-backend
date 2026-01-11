// Re-export all models
export * from './user.model';

// Re-export prisma client for direct access if needed
export { default as prisma } from '../services/db.service';
