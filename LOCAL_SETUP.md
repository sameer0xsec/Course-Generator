# Local Development Setup Guide

This guide walks through configuring and running the AI Course Generator on Linux, macOS, and Windows.

---

## Prerequisites

- **Node.js**: v18.17+ or v20+ or v22+
- **npm**: v9+ or v10+
- **PostgreSQL**: A cloud database like Neon.tech or a local PostgreSQL instance

---

## 1. Environment Configuration

Create or update `.env.local` in the project root:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Neon Database
DATABASE_URL=postgresql://...

# YouTube Data API
NEXT_PUBLIC_YOUTUBE_API_KEY=AIzaSy...
```

---

## 2. Installation & Running

### Linux / macOS
```bash
npm install
npm run test:ai   # Verify Gemini
npm run db:push   # Sync database schema
npm run dev       # Start Turbopack dev server
```

### Windows (PowerShell or Command Prompt)
```powershell
npm install
npm run test:ai
npm run db:push
npm run dev
```

---

## 3. Production Build
```bash
npm run build
npm start
```
