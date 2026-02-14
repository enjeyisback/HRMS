# HR Management System (HRMS)

This is a Next.js 14 application for Human Resource Management.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI (compatible) & Lucide React
- **Database & Auth**: Supabase

## Getting Started

1.  **Clone the repository** (if applicable)

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Copy `.env.example` to `.env.local` and add your Supabase credentials:
    ```bash
    cp .env.example .env.local
    ```
    Update `.env.local`:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your-project-url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
    ```

4.  **Run the development server**:
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `/app`: Application routes and layouts.
- `/components`: Reusable UI components.
- `/lib`: Utilities and Supabase clients.
- `/types`: TypeScript type definitions.

## Key Features

- **Authentication**: Supabase Auth (Email/Password).
- **Dashboard**: Responsive sidebar layout.
- **Theming**: Tailwind CSS v4 with CSS variables for dark mode support.
