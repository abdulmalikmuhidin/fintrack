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

3. Set up environment variables:
   ```bash
   # Copy environment templates
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   
   # Edit the .env files with your configuration
   ```

4. Configure your environment variables:
   
   **Backend (apps/api/.env):**
   - `PORT` - API server port (default: 3001)
   - `MONGODB_URI` - MongoDB connection string
   - `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:3000)
   
   **Frontend (apps/web/.env):**
   - `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:3001/api)

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
- CORS is configured to allow the frontend origin specified in `FRONTEND_URL`
- Global API prefix is set to `/api`
- Environment variables are loaded via `@nestjs/config` with validation

## 🔒 Security

- Never commit `.env` files to version control
- Use strong passwords for MongoDB connections
- Keep dependencies updated

## 📄 License

This project is licensed under the MIT License.