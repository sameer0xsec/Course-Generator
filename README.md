# 🎓 AI Course Generator

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-SDK%20v0.1-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle%20ORM-0.34-C5F74F?style=for-the-badge&logo=drizzle)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/Neon%20Postgres-Serverless-00E599?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Clerk](https://img.shields.io/badge/Clerk-Authentication-6C47FF?style=for-the-badge&logo=clerk)](https://clerk.com/)

A modern, full-stack AI-powered learning platform that automatically architects custom curriculum outlines, generates in-depth chapter content with explanations and code examples, and embeds relevant YouTube educational videos.

---

## 🌟 Features

- **Automated Curriculum Generation**: Input any topic, select difficulty level (Beginner / Intermediate / Advanced), duration, and whether to include video materials.
- **Powered by Google Gemini AI**: Uses the official `@google/genai` SDK with smart automatic model fallbacks (`gemini-flash-lite-latest`, `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`, `gemini-3.8-flash`).
- **Comprehensive Chapter Tutorials**: Generates structured, markdown-formatted study guides, code snippets, and key takeaways for each chapter.
- **YouTube Video Integration**: Automatically searches and embeds relevant educational video tutorials for each course chapter using the YouTube Data API v3.
- **Serverless PostgreSQL Database**: Managed with **Drizzle ORM** on **Neon Tech** serverless PostgreSQL.
- **Secure Authentication**: User sign-in and account management powered by **Clerk**.
- **100% Cross-Platform Ready**: Fully tested and optimized for **Linux**, **Windows**, and **macOS**.

---

## 📋 Prerequisites

Before running the application, make sure you have:

1. **Node.js**: `v18.17+`, `v20+`, or `v22+` ([Download Node.js](https://nodejs.org/))
2. **Git**: Installed on your system ([Download Git](https://git-scm.com/))
3. **API Keys / Service Accounts**:
   - [Google AI Studio](https://aistudio.google.com/app/apikey) (Free Gemini API key)
   - [Clerk Dashboard](https://dashboard.clerk.com/) (Publishable key & Secret key)
   - [Neon Console](https://neon.tech) (PostgreSQL connection string)
   - [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (YouTube Data API v3 key)

---

## 🚀 First-Time Setup (Step-by-Step)

Follow these exact steps when cloning and setting up the project for the very first time.

### 1. Clone the Repository

#### Linux / macOS:
```bash
git clone https://github.com/sameer0xsec/Course-Generator.git
cd Course-Generator
```

#### Windows (PowerShell or CMD):
```powershell
git clone https://github.com/sameer0xsec/Course-Generator.git
cd "Course-Generator"
```

---

### 2. Configure Environment Variables

Create your local `.env.local` file from the provided template:

#### Linux / macOS:
```bash
cp .env.local.example .env.local
```

#### Windows (PowerShell):
```powershell
Copy-Item .env.local.example .env.local
```

#### Windows (Command Prompt):
```cmd
copy .env.local.example .env.local
```

Open `.env.local` in your editor (e.g. VS Code, Nano, Notepad) and enter your credentials:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/

# Google Gemini AI
GEMINI_API_KEY=your_actual_gemini_api_key
NEXT_PUBLIC_GEMINI_API_KEY=your_actual_gemini_api_key

# Neon Serverless PostgreSQL Database
DATABASE_URL=postgresql://user:password@host/neondb?sslmode=require

# YouTube Data API v3
NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key

# App Host URL
NEXT_PUBLIC_HOST_NAME=http://localhost:3000/
```

> **Security Note:** Never commit `.env.local` to Git. It is already included in `.gitignore`.

---

### 3. Install Dependencies

Install project packages (native bindings for both Linux and Windows are already configured in `package.json`):

```bash
npm install
```

---

### 4. Push Schema to Database

Synchronize Drizzle ORM schemas (`configs/schema.jsx`) with your Neon PostgreSQL database:

```bash
npm run db:push
```

You should see:
```text
[✓] Changes applied successfully!
```

---

### 5. Verify Google Gemini AI Connection

Run our built-in test script to verify that your Gemini API key and model connectivity work:

```bash
npm run test:ai
```

You should see:
```text
✅ SUCCESS: Successfully connected to Gemini!
```

---

### 6. Launch the Development Server

Start the Next.js development server with Turbopack:

```bash
npm run dev
```

Open your browser and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

Sign up / Sign in and start generating AI courses!

---

## ⚡ Everyday Usage (Rest of the Time)

Once first-time setup is completed, everyday running is simple and quick:

### 1. Daily Development Run
Whenever you return to the project to work on it or use it locally:

```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)**. That's it!

---

### 2. Pulling New Changes from GitHub
If you or a collaborator updated the repository:

```bash
git pull origin main
npm install        # Only needed if dependencies were added
npm run db:push    # Only needed if database schemas changed
npm run dev
```

---

### 3. Running in Production Mode (Optimized Build)
To test or host the compiled, production-grade build locally:

```bash
npm run build
npm start
```
This runs the high-performance Next.js production server on port 3000.

---

## 💻 Cross-Platform Guide (Linux vs Windows)

| Action | Linux / macOS | Windows (PowerShell / CMD) |
|---|---|---|
| **Copy Env File** | `cp .env.local.example .env.local` | `Copy-Item .env.local.example .env.local` |
| **Install Packages** | `npm install` | `npm install` |
| **Verify AI** | `npm run test:ai` | `npm run test:ai` |
| **Sync Database** | `npm run db:push` | `npm run db:push` |
| **Start Dev** | `npm run dev` | `npm run dev` |
| **Build Project** | `npm run build` | `npm run build` |
| **Start Production** | `npm run start` | `npm run start` |

> **Cross-Platform Native Binaries:**  
> The project includes cross-platform optional dependencies (`@next/swc-linux-x64-gnu`, `@next/swc-win32-x64-msvc`, `@esbuild/linux-x64`, `@esbuild/win32-x64`, `lightningcss`, and `@tailwindcss/oxide`) so builds execute seamlessly on both native Windows and Linux/WSL environments without binary compilation errors.

---

## 🗂️ Project Structure

```text
Course-Generator/
├── app/
│   ├── (auth)/                  # Clerk Sign-in and Sign-up authentication routes
│   ├── api/
│   │   ├── ai/generate/         # Server-side Gemini AI generation endpoint
│   │   ├── courses/             # Course fetching and management APIs
│   │   └── user-courses/        # User-specific course metrics
│   ├── create-course/           # Course creation wizard and chapter editor
│   ├── course/                  # Public and student course viewer
│   └── dashboard/               # User analytics, created courses, upgrades
├── configs/
│   ├── AiModel.jsx              # Google Gemini AI client and prompts
│   ├── db.jsx                   # Drizzle ORM Neon database connection
│   └── schema.jsx               # Database tables (CourseList, Chapters)
├── drizzle/                     # Migration snapshots and SQL statements
├── scripts/
│   └── test-gemini.mjs          # Standalone verification script for Gemini API
├── .env.local.example           # Sanitized environment template
├── drizzle.config.js            # Drizzle ORM configuration
├── next.config.mjs              # Next.js 15 configuration
├── package.json                 # Project dependencies and npm scripts
└── README.md                    # Project documentation
```

---

## 🔧 Useful Scripts Reference

| Command | Description |
|---|---|
| `npm run dev` | Launches local development server with Turbopack at `localhost:3000` |
| `npm run build` | Compiles optimized production Next.js build |
| `npm run start` | Starts production server from `.next` build |
| `npm run db:push` | Applies schema changes directly to Neon PostgreSQL |
| `npm run test:ai` | Verifies Gemini AI model access and prompt responses |
| `npm run lint` | Runs ESLint checks on codebase |

---

## ❓ Troubleshooting & FAQs

### 1. "AI Model Quota / Rate Limit"
The project uses the Google Gemini API with built-in model fallback chains. If `gemini-flash-lite-latest` hits a temporary rate limit, the API route automatically attempts fallbacks (`gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`, `gemini-3.8-flash`). Ensure your `GEMINI_API_KEY` is active at [Google AI Studio](https://aistudio.google.com/).

### 2. "Database connection timed out or rejected"
Ensure your Neon PostgreSQL connection string in `DATABASE_URL` ends with `?sslmode=require`. If using a connection pooler, verify the pooler host domain.

### 3. "Clerk Authentication Redirect Issue"
Ensure `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up` match your Clerk dashboard settings under **Configure > Paths**.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
