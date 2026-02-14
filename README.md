# 🏢 HRMS — Human Resource Management System

A comprehensive, modern HR management platform built with **Next.js 16**, **Supabase**, and **TypeScript**. Designed for Indian organizations with built-in support for PF, ESIC, and India-specific statutory compliance.

---

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [First-Time Setup](#first-time-setup)
- [Default Credentials](#default-credentials)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)

---

## About

HRMS is a full-featured Human Resource Management System that handles the complete employee lifecycle — from onboarding and attendance tracking to leave management, payroll processing, and reporting. It features a role-based access control (RBAC) system, ensuring that employees, managers, HR administrators, and super admins each see only what they need.

The application uses **Supabase** for authentication, database, and row-level security (RLS), providing enterprise-grade data isolation without a separate backend.

---

## Features

### 🔐 Authentication & Access Control
- **Email/Password authentication** via Supabase Auth
- **First-time system setup wizard** — creates the initial Super Admin account
- **Role-Based Access Control (RBAC)** with 4 default roles:
  - `Super Admin` — Full system access
  - `HR Admin` — Manage HR, payroll, and attendance
  - `Manager` — Team management and approvals
  - `Employee` — Self-service access
- **Granular permissions** (e.g., `employees.view`, `payroll.process`, `leave.approve`)
- **Permission-based UI rendering** — sidebar items and pages are hidden based on user permissions
- **Protected routes** with middleware-level authentication checks

### 👥 Employee Management
- **Add employees** with a multi-tab form (Personal, Employment, Salary & Bank, Documents)
- **Auto-provisioning** — creating an employee automatically creates their Supabase Auth login credentials
- **Auto-generated employee codes** (e.g., `EMP001`, `EMP002`)
- **Auto-generated official email** (e.g., `first.last@company.com`)
- **Employee directory** with search and DataTable
- **Detailed employee profiles** including:
  - Personal info (DOB, gender, blood group, marital status)
  - Emergency contacts
  - Current & permanent addresses
  - Department & designation assignment
  - Reporting manager hierarchy
  - Bank details (account, IFSC, branch)
  - India statutory IDs (PAN, Aadhaar, UAN, ESIC)

### 📅 Attendance
- **Employee attendance calendar** — color-coded grid showing Present, Absent, Leave, and Holiday statuses
- **Clock in/out** functionality
- **Monthly attendance view** with navigation
- **Attendance percentage calculation**
- **Admin attendance dashboard** — view and manage attendance across all employees

### 🏖️ Leave Management
- **Apply for leave** with date range, leave type, and reason
- **Leave balance tracking** per employee
- **Leave request approval workflow**
- **Leave type configuration** (admin) — create custom leave types with annual quotas
- **Leave history** — view past requests and their statuses

### 💰 Payroll
- **Salary Components** — define earnings and deductions (Fixed, % of Basic, % of Gross)
  - Statutory components: PF, ESIC, Professional Tax, TDS
  - Custom components: HRA, Conveyance, Medical, etc.
- **Salary Templates** — group components into reusable templates (e.g., "Standard Package")
- **Salary Assignment** — assign salary structures to individual employees
- **Run Payroll** — process monthly payroll for all employees
- **Payroll History** — view past payroll runs with employee-level breakdowns
- **Employee pay stubs** — employees can view their own payslips

### 📊 Reports
- **Centralized reports dashboard** for admins
- Exportable data via **Excel (XLSX)** and **PDF (jsPDF)**
- Attendance reports, payroll summaries, and more

### ⚙️ Settings
- **Profile management** — employees can update their own profile
- **Email configuration**
- **Export settings**
- **Activity logs**

### 🎨 UI & UX
- **Dark mode support** with CSS variable theming
- **Responsive sidebar navigation**
- **Loading spinners** during data fetching
- **Toast notifications** (via Sonner) for success/error feedback
- **Data tables** with sorting, filtering, and pagination (TanStack Table)
- **Form validation** with Zod schemas and React Hook Form
- **Charts and visualizations** (Recharts)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **UI Components** | [Radix UI](https://www.radix-ui.com/) + [Lucide Icons](https://lucide.dev/) |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL) |
| **Authentication** | Supabase Auth (Email/Password) |
| **Row-Level Security** | Supabase RLS Policies |
| **Forms** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| **Data Tables** | [TanStack Table v8](https://tanstack.com/table) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Date Utilities** | [date-fns](https://date-fns.org/) |
| **PDF Export** | [jsPDF](https://github.com/parallax/jsPDF) |
| **Excel Export** | [SheetJS (xlsx)](https://sheetjs.com/) |
| **Notifications** | [Sonner](https://sonner.emilkowal.dev/) |

---

## Project Structure

```
hrms/
├── app/
│   ├── (auth)/                  # Login & authentication pages
│   │   └── login/
│   ├── (dashboard)/             # Authenticated pages (sidebar layout)
│   │   ├── dashboard/           # Main dashboard (Admin / Employee views)
│   │   ├── employees/           # Employee directory & management
│   │   ├── attendance/          # Personal attendance calendar
│   │   ├── leaves/              # Leave application & history
│   │   ├── payroll/             # Personal payslips
│   │   ├── settings/            # Profile, email, export, logs
│   │   └── admin/               # Admin-only pages
│   │       ├── attendance/      # Attendance management (all employees)
│   │       ├── leaves/types/    # Leave type configuration
│   │       ├── payroll/
│   │       │   ├── components/  # Salary component management
│   │       │   ├── templates/   # Salary template builder
│   │       │   ├── assign/      # Assign salary to employees
│   │       │   ├── run/         # Process monthly payroll
│   │       │   └── history/     # Past payroll runs
│   │       ├── reports/         # Reports dashboard
│   │       └── rbac/            # Role & permission management
│   ├── api/
│   │   ├── employees/           # Employee creation API (with auth provisioning)
│   │   └── setup/               # First-time system setup API
│   ├── setup/                   # Setup wizard page
│   └── unauthorized/            # Access denied page
├── components/
│   ├── ui/                      # Reusable UI primitives (Button, Input, Dialog, etc.)
│   ├── dashboard/               # Dashboard components (Admin & Employee views)
│   ├── employees/               # Employee form, table, dialogs
│   ├── attendance/              # Attendance calendar & tracking
│   ├── leave/                   # Leave application forms
│   ├── payroll/                 # Payroll processing components
│   ├── reports/                 # Report generators & viewers
│   ├── rbac/                    # Permission guards & role management
│   ├── settings/                # Settings page components
│   ├── providers/               # Auth provider (React Context)
│   ├── Sidebar.tsx              # Navigation sidebar
│   └── Header.tsx               # Top header bar
├── lib/
│   ├── supabase/                # Supabase client utilities (client & server)
│   └── utils.ts                 # Shared utilities
├── supabase/
│   └── migrations/              # SQL migration files (17 files)
├── middleware.ts                 # Auth & setup redirect middleware
└── .env.local                   # Environment variables (not committed)
```

---

## Installation

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- A **Supabase** project ([create one free](https://supabase.com/dashboard))

### Steps

**1. Clone the repository**

```bash
git clone https://github.com/enjeyisback/HRMS.git
cd HRMS/hrms
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment variables**

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> You can find these in your Supabase Dashboard → **Project Settings** → **API**.

> ⚠️ **Important:** The `SUPABASE_SERVICE_ROLE_KEY` is used server-side only (API routes and middleware). It is never exposed to the client.

---

## Database Setup

Run the SQL migration files in your Supabase SQL Editor in this order:

| # | Migration File | Purpose |
|---|---------------|---------|
| 1 | `20240214_initial_schema.sql` | Core tables: departments, designations, employees, shifts, attendance, leaves, payroll |
| 2 | `20240214_seed_data.sql` | Default departments, designations, and shifts |
| 3 | `20240214_rbac_schema.sql` | Roles, permissions, and role-based access control |
| 4 | `20240214_employee_details_schema.sql` | Extended employee fields (addresses, emergency contacts, salary snapshot) |
| 5 | `20240214_attendance_schema.sql` | Attendance tracking enhancements |
| 6 | `20240214_leave_module_schema.sql` | Leave types and configurations |
| 7 | `20240214_leave_requests_schema.sql` | Leave request workflow |
| 8 | `20240214_complete_leave_schema_fix.sql` | Leave schema patches and RLS |
| 9 | `20240214_salary_schema.sql` | Salary components, templates, and assignments |
| 10 | `20240214_payroll_run_schema.sql` | Payroll processing tables |
| 11 | `20240214_settings_schema.sql` | App settings and configuration |
| 12 | `20240214_fix_rls.sql` | RLS policy fixes |
| 13 | `20240214_fix_leave_rls.sql` | Leave RLS policy fixes |
| 14 | `20240214_enable_insert_employees.sql` | Employee insert permissions |
| 15 | `20240214_performance_indexes.sql` | Database performance indexes |
| 16 | `20240214_ensure_admin_user.sql` | Ensure admin user setup |
| 17 | `20240214_add_bank_branch.sql` | Add bank_branch column |

> **Tip:** Copy each file's contents and paste into the Supabase SQL Editor → Run.

---

## First-Time Setup

1. **Start the development server:**

   ```bash
   npm run dev
   ```

2. **Navigate to** `http://localhost:3000`

3. If no employees exist in the database, you'll be automatically redirected to the **System Setup** page.

4. Fill in the Super Admin details:
   - Organization name
   - Admin full name, email, and password
   - Department and designation

5. Click **Initialize System** — this creates:
   - The Supabase Auth user
   - The employee record with `Super Admin` role
   - Links them via `user_id`

6. You'll be redirected to the login page. Log in with the email and password you just set.

---

## Default Credentials

After running the setup wizard, use the credentials you provided during setup.

If you ran the `20240214_ensure_admin_user.sql` migration, the default admin is:

| Field | Value |
|-------|-------|
| Email | *(set during setup)* |
| Password | *(set during setup)* |
| Role | Super Admin |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (server-side only) |

---

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Dev Server | `npm run dev` | Start development server with Turbopack |
| Build | `npm run build` | Create production build |
| Start | `npm run start` | Start production server |
| Lint | `npm run lint` | Run ESLint |

---

## License

This project is private and proprietary.

---

Built with ❤️ using Next.js & Supabase
