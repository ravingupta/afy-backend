# CLAUDE.md

This file contains project-specific notes and guidelines for Claude Code.

## Project Overview

**afy-backend** - Express.js API service for Agent For You, deployed on Vercel.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 5
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma 7
- **Deployment**: Vercel Serverless

## Project Structure

```
src/
├── app.ts                     # Express app configuration
├── index.ts                   # Local dev server entry
├── controllers/               # Route handler functions (*.controller.ts)
├── middleware/                # Express middleware
│   ├── auth.ts                # Authentication middleware
│   ├── errorHandler.ts        # 404 and error handling
│   └── requestLogger.ts       # Request logging
├── models/                    # Database models (*.model.ts)
├── routes/                    # Route definitions (*.router.ts)
└── services/                  # Business logic and external services
    └── db.service.ts          # Prisma client singleton
api/
└── index.js                   # Vercel serverless entry point
prisma/
└── schema.prisma              # Database schema
```

## Prisma 7 Notes

This project uses **Prisma 7** which has breaking changes from earlier versions:

1. **Type imports** - Use `.prisma/client` for generated types:
   ```typescript
   import type { User } from '.prisma/client';
   ```

2. **PrismaClient type** - Use `InstanceType<typeof PrismaClient>`:
   ```typescript
   type PrismaClientType = InstanceType<typeof PrismaClient>;
   ```

3. **Database URL** - Configured in `prisma.config.ts`, NOT in `schema.prisma`

4. **Adapter pattern** - Uses `@prisma/adapter-pg` with `pg` pool:
   ```typescript
   const pool = new pg.Pool({ connectionString });
   const adapter = new PrismaPg(pool);
   return new PrismaClient({ adapter });
   ```

5. **Schema datasource** - No `url` field in datasource block

## File Naming Conventions

- Routes: `*.router.ts`
- Controllers: `*.controller.ts`
- Models: `*.model.ts`
- Services: `*.service.ts`

## Commands

```bash
npm run dev          # Run locally with ts-node
npm run build        # Compile TypeScript
npm run start        # Run compiled build
npx prisma generate  # Regenerate Prisma client
npx prisma migrate dev  # Run migrations
npx prisma studio    # Open database GUI
```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - development/production
- `PORT` - Server port (default: 3000)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for auth verification)
- `JWT_SECRET` - Secret for signing access tokens (min 32 chars)

Environment files load order: `.env.local` first, then `.env` as fallback.

## Authentication Flow

The auth system embeds Supabase tokens in our JWT and verifies with Supabase on every request for real-time revocation.

1. Client authenticates with Supabase (email/password, OAuth, etc.)
2. Client sends Supabase access token to `POST /auth/login`
3. Backend verifies token with Supabase, creates/finds user in DB
4. Backend returns JWT (1 hour expiry) containing embedded Supabase token
5. Client uses JWT in `Authorization: Bearer <token>` header
6. On each request, middleware verifies both JWT and Supabase token
7. If Supabase token is revoked/expired, request is rejected

**Benefits:**
- Real-time session revocation (logout from Supabase = instant invalidation)
- Single source of truth (Supabase)
- No refresh token complexity

**Trade-offs:**
- Supabase API call on every authenticated request (~50-100ms latency)

### Auth Endpoints

- `POST /auth/login` - Exchange Supabase token for JWT
- `POST /auth/logout` - Logout (protected)
- `GET /auth/me` - Get current user info (protected)

## CORS

Allowed origins:
- `http://localhost:3000`
- `http://localhost:5173`
- `https://www.agentforyou.ca`
- `https://agentforyou.ca`
