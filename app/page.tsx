import Link from "next/link"

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-50">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold text-slate-900">
          Welcome to <span className="text-blue-600">HRMS</span>
        </h1>

        <p className="mt-3 text-2xl text-gray-600">
          Modern Human Resource Management System
        </p>

        <div className="flex flex-wrap items-center justify-around max-w-4xl mt-6 sm:w-full">
          <Link
            href="/login"
            className="px-8 py-3 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
          >
            Log In
          </Link>
          <Link
            href="/dashboard"
            className="px-8 py-3 text-lg font-semibold text-blue-600 bg-white border border-blue-600 rounded-lg hover:bg-blue-50 transition ml-4"
          >
            Go to Dashboard
          </Link>
        </div>
      </main>
    </div>
  )
}
