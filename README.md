# Alice's Tech HRM

A production-oriented MERN workforce management system for Alice's Tech Solutions. The frontend is deployed on Vercel and the Node.js backend is hosted on AWS EC2.

## Features

- Employee, Admin, SuperAdmin, and Candidate portals
- Role- and department-based navigation and authorization
- Night-shift attendance, breaks, corrections, monthly calendar, and day details
- Leave balances, approvals, holidays, salary structures, payroll, and payslips
- Employee onboarding, offboarding, resignation, withdrawal, and handover workflows
- Candidate management, interviews, sales, and lead-generation workflows
- Real-time direct and group chat with Socket.IO
- Optional role-scoped AI HR assistant
- Dashboards, reports, health checks, rate limits, and audit records

## Tech Stack

| Area | Technologies |
| --- | --- |
| Frontend | React, Vite, Redux Toolkit, React Router, Tailwind CSS |
| Backend | Node.js, Express, Mongoose, Socket.IO |
| Database | MongoDB |
| Authentication | JWT in secure HTTP-only cookies |
| Services | OpenAI API, Cloudinary, SMTP |
| Hosting | Vercel frontend, AWS EC2 backend |

## Project Structure

```text
Backend/    Express API, models, services, jobs, and Socket.IO
Frontend/   React application
README.md   Project overview and setup
```

## Local Setup

Requirements: Node.js, npm, and MongoDB.

```bash
git clone <repository-url>
cd Alices-Technology
npm install
cd Backend && npm install
cd ../Frontend && npm install
cd ..
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- API: `http://localhost:4000/api/v1`
- Health check: `http://localhost:4000/health`

## Environment Variables

Create `Backend/.env`:

```env
PORT=4000
NODE_ENV=development
MONGODB_URL=mongodb://127.0.0.1:27017/hrm
JWT_SECRET=replace_with_a_long_random_secret
FRONTEND_URL=http://localhost:5173
ATTENDANCE_TZ=Asia/Kolkata

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

MAIL_HOST=
MAIL_PORT=587
MAIL_USER=
MAIL_PASS=

# Optional AI assistant
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.6-luna
AI_RATE_LIMIT=20
```

Create `Frontend/.env` when the backend differs from the local default:

```env
VITE_API_URL=http://localhost:4000/api/v1
VITE_SOCKET_URL=http://localhost:4000
```

Never expose backend secrets through `VITE_*` variables or commit `.env` files.

## Commands

From the repository root:

```bash
npm run dev       # frontend and backend
npm run client    # frontend only
npm run server    # backend only
```

Production checks:

```bash
cd Frontend
npm run lint
npm run build

cd ../Backend
npm start
```

## Initial SuperAdmin

Configure the `SUPER_ADMIN_*` values required by `Backend/scripts/createAdmin.js`, then run:

```bash
cd Backend
node scripts/createAdmin.js
```

## Deployment

### Backend — AWS EC2

1. Configure production variables in `Backend/.env`.
2. Set `NODE_ENV=production` and restrict `FRONTEND_URL` to the Vercel domain.
3. Install dependencies and run the backend with a process manager such as PM2.
4. Restart with updated environment variables after configuration changes.

### Frontend — Vercel

1. Set `VITE_API_URL` to the EC2 API URL ending in `/api/v1`.
2. Set `VITE_SOCKET_URL` to the EC2 backend origin.
3. Deploy the `Frontend` application.

## Security Notes

- Keep JWT, MongoDB, Cloudinary, SMTP, and OpenAI credentials server-side.
- Use HTTPS in production and rotate any exposed secret immediately.
- Restrict CORS to trusted frontend origins.
- Inactive employee accounts remain archived; their historical HR data is preserved.
- AI answers are advisory and cannot directly change HRM records.

## Author

Chandan Kumar — MERN Stack Developer
