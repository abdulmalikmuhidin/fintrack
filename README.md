# FinTrack - Personal Finance Application

A full-stack personal finance application built with Next.js, NestJS, and MongoDB.

## 🏗️ Project Structure

```
fintrack/
├── apps/
│   ├── web/          # Next.js frontend application
│   └── api/          # NestJS backend API
├── package.json      # Root workspace configuration
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB Atlas account (or local MongoDB instance)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd fintrack
   ```

2. Install all dependencies:
   ```bash
   npm run install:all
   ```

3. Set up environment variables (keep local secrets out of Git):
   ```bash
   # Copy these templates only if you do not already have local env files.
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env.local
   ```

4. Configure your environment variables:
   
   **Backend (apps/api/.env):**
   - `PORT` - API server port (default: 3001)
   - `MONGODB_URI` - Required MongoDB Atlas or local MongoDB connection string
   - `FRONTEND_URL` - Exact frontend origin allowed by CORS and auth origin checks
   - `JWT_SECRET` - Required random secret with at least 32 characters; never commit it
   - `JWT_EXPIRES_IN_SECONDS` - JWT and session-cookie lifetime (300–86400; default: 900)
   
   Generate a secret locally without adding it to source control:
   ```bash
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```
   Put the generated value in `JWT_SECRET`. Use a separate random value for each environment.

   **Frontend (apps/web/.env.local):**
   - `NEXT_PUBLIC_API_URL` - Backend API base URL (development default: `http://localhost:3001/api`)

   The API sets a short-lived `HttpOnly`, `SameSite=Lax` cookie. The web and API may use
   different ports during development, but production deployments must use the same site
   (for example, `app.example.com` and `api.example.com`) and HTTPS. Auth POST requests
   require an `Origin` matching `FRONTEND_URL`.

### Development

Start both frontend and backend in development mode:
```bash
npm run dev
```

Or start them individually:
```bash
# Backend only
npm run dev:api

# Frontend only
npm run dev:web
```

### Building

Build all applications:
```bash
npm run build
```

Build individual applications:
```bash
# Backend only
npm run build:api

# Frontend only
npm run build:web
```

### Production

Start production builds:
```bash
# Backend
cd apps/api && npm run start:prod

# Frontend
cd apps/web && npm run start
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend in development mode |
| `npm run dev:api` | Start backend in development mode |
| `npm run dev:web` | Start frontend in development mode |
| `npm run build` | Build all applications |
| `npm run build:api` | Build backend |
| `npm run build:web` | Build frontend |
| `npm run lint` | Lint all applications |
| `npm run test` | Run tests for all applications |
| `npm run install:all` | Install dependencies for all workspaces |

## 🌐 Environment Variables

### Backend (apps/api/.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API server port | 3001 |
| `MONGODB_URI` | MongoDB connection string | Required |
| `FRONTEND_URL` | Frontend origin for CORS | http://localhost:3000 |

### Frontend (apps/web/.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | http://localhost:3001/api |

## 📡 API Endpoints

### Health Check
- `GET /api/health` - Returns API status
  ```json
  {
    "status": "ok",
    "service": "fintrack-api"
  }
  ```
  **Note:** This endpoint checks API liveness only, not database connectivity.

### Authentication
- `POST /api/auth/register` - Create an account and return its public profile
- `POST /api/auth/login` - Verify credentials and set the HttpOnly session cookie
- `GET /api/auth/me` - Return the authenticated user's public profile
- `POST /api/auth/logout` - Clear the session cookie

The browser sends the cookie with credentialed requests. JWTs are not exposed to frontend
JavaScript or stored in localStorage. Passwords are hashed with bcryptjs before persistence.

## 🛠️ Technology Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React 18

### Backend
- NestJS 10
- TypeScript
- Mongoose (MongoDB ODM)
- @nestjs/config for configuration

### Database
- MongoDB Atlas / MongoDB

## 📝 Development Notes

- The health endpoint (`/api/health`) only checks API liveness, not database connectivity
- CORS and auth POST origin checks use the frontend origin specified in `FRONTEND_URL`
- Global API prefix is set to `/api`
- Environment variables are loaded and validated via `@nestjs/config`
- The API requires `MONGODB_URI` and a strong `JWT_SECRET` at startup

## 🔒 Security

- Never commit `.env` files to version control
- Use strong passwords for MongoDB connections
- Keep dependencies updated

## 📄 License

This project is licensed under the MIT License.