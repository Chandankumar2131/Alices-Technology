# Alice's Tech HRM

A secure workforce management platform built for Alice's Tech Solutions.

## Overview

Alice's Tech HRM provides a unified workspace for employees, administrators, recruitment teams, lead-generation teams, and sales teams. Access to pages and data is controlled by authenticated roles and departments.

## Core Capabilities

- Role- and department-based access
- Employee onboarding and account lifecycle management
- Attendance, breaks, corrections, and monthly calendars
- Leave balances, requests, approvals, and holidays
- Salary structures, payroll, and payslips
- Resignation, withdrawal, handover, and offboarding workflows
- Candidate management and interviews
- Lead-generation and sales workflows
- Real-time direct and group communication
- Reports and workforce analytics
- Optional role-scoped AI assistance

## Technology

The application uses a React frontend, a Node.js API, MongoDB persistence, and real-time communication. Production services and credentials are configured outside the repository.

## Development

Install project dependencies before starting the development environment:

```bash
npm install
npm run dev
```

Frontend quality checks:

```bash
cd Frontend
npm run lint
npm run build
```

Production configuration, infrastructure procedures, privileged account setup, internal routes, and operational runbooks are intentionally maintained outside this repository.

## Security

- Never commit credentials, environment files, tokens, private keys, or production data.
- Keep all service credentials on trusted backend infrastructure.
- Rotate any secret immediately if it is exposed.
- Use least-privilege access for infrastructure, databases, and external services.
- Report suspected vulnerabilities privately to the project owner; do not disclose them publicly.

## Ownership

Private project of Alice's Tech Solutions.
