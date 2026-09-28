import { useEffect, useState, useCallback } from "react";
import api from "../api/api";

// =====================================================
// SPINNER
// =====================================================

const Spinner = () => (
  <div className="flex min-h-[20rem] items-center justify-center px-4">
    <div className="text-center">
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />
      <p className="mt-3 text-sm text-gray-500">
        Loading dashboard...
      </p>
    </div>
  </div>
);

// =====================================================
// STAT CARD
// =====================================================

const StatCard = ({
  title,
  value,
  icon,
  iconBg = "bg-green-50",
  iconColor = "text-green-600",
}) => (
  <div className="group rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5">
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-gray-400">
          {title}
        </p>

        <p className="mt-2 text-2xl font-bold text-gray-800 sm:text-3xl">
          {value}
        </p>
      </div>

      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconColor} transition group-hover:scale-105`}
      >
        {icon}
      </div>
    </div>
  </div>
);

// =====================================================
// TEACHER DASHBOARD
// =====================================================

const TeacherDashboard = () => {
  const [dashboard, setDashboard] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ===================================================
  // FETCH TEACHER DASHBOARD
  // ===================================================

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get("dashboard/teacher/");

      setDashboard(data || {});
    } catch (err) {
      console.error("Teacher Dashboard error:", err);
      console.error("Backend response:", err.response?.data);

      setError("Failed to load teacher dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return <Spinner />;
  }

  // ===================================================
  // ERROR
  // ===================================================

  if (error) {
    return (
      <div className="min-h-full bg-gray-50 p-4 sm:p-5 lg:p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl border border-red-100 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                !
              </div>

              <div>
                <h2 className="text-sm font-semibold text-red-700">
                  Unable to load dashboard
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  {error}
                </p>

                <button
                  onClick={fetchDashboard}
                  className="mt-3 rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-green-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===================================================
  // DASHBOARD DATA
  // ===================================================

  const d = dashboard || {};

  const teacher_name = d.teacher_name || "Teacher";

  const assigned_classes = Number(
    d.assigned_classes ?? 0
  );

  const assigned_subjects = Number(
    d.assigned_subjects ?? 0
  );

  const total_students = Number(
    d.total_students ?? 0
  );

  const pending_results = Number(
    d.pending_results ?? 0
  );

  const is_class_teacher = Boolean(
    d.is_class_teacher
  );

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="min-h-full bg-gray-50 px-3 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
      <div className="mx-auto max-w-7xl space-y-5">

        {/* =================================================
            WELCOME HEADER
        ================================================= */}

        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="relative px-4 py-5 sm:px-6 sm:py-6">

            {/* Decorative background */}
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-green-50" />
            <div className="pointer-events-none absolute -bottom-10 right-20 h-20 w-20 rounded-full bg-green-50/60" />

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              {/* Welcome */}
              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-xl">
                  👨‍🏫
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-green-600">
                    Teacher Dashboard
                  </p>

                  <h1 className="mt-0.5 truncate text-lg font-bold text-gray-800 sm:text-xl">
                    Welcome, {teacher_name}
                  </h1>

                  <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                    Manage your classes, subjects and student results.
                  </p>
                </div>

              </div>

              {/* Class Teacher Badge */}
              <div className="flex items-center">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    is_class_teacher
                      ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200"
                      : "bg-gray-50 text-gray-500 ring-1 ring-inset ring-gray-200"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      is_class_teacher
                        ? "bg-green-500"
                        : "bg-gray-400"
                    }`}
                  />

                  {is_class_teacher
                    ? "Class Teacher"
                    : "Subject Teacher"}
                </span>
              </div>

            </div>
          </div>
        </div>

        {/* =================================================
            STATISTICS
        ================================================= */}

        <div>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-800">
                Overview
              </h2>

              <p className="mt-0.5 text-xs text-gray-400">
                Your teaching summary
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">

            {/* Assigned Classes */}
            <StatCard
              title="Assigned Classes"
              value={assigned_classes}
              icon={
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M9 7h6m-6 4h6m-6 4h4"
                  />
                </svg>
              }
              iconBg="bg-green-50"
              iconColor="text-green-600"
            />

            {/* Assigned Subjects */}
            <StatCard
              title="Assigned Subjects"
              value={assigned_subjects}
              icon={
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              }
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
            />

            {/* Total Students */}
            <StatCard
              title="Total Students"
              value={total_students}
              icon={
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              }
              iconBg="bg-purple-50"
              iconColor="text-purple-600"
            />

            {/* Pending Results */}
            <StatCard
              title="Pending Results"
              value={pending_results}
              icon={
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
              iconBg="bg-yellow-50"
              iconColor="text-yellow-600"
            />

            {/* Class Teacher */}
            <StatCard
              title="Class Teacher"
              value={is_class_teacher ? "YES" : "NO"}
              icon={
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622C17.176 19.29 21 14.591 21 9c0-.673-.056-1.332-.164-1.976z"
                  />
                </svg>
              }
              iconBg={
                is_class_teacher
                  ? "bg-green-50"
                  : "bg-gray-50"
              }
              iconColor={
                is_class_teacher
                  ? "text-green-600"
                  : "text-gray-500"
              }
            />

          </div>
        </div>

        {/* =================================================
            QUICK STATUS
        ================================================= */}

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">

          <div className="mb-4">
            <h2 className="text-sm font-bold text-gray-800">
              Teaching Status
            </h2>

            <p className="mt-0.5 text-xs text-gray-400">
              Current overview of your responsibilities
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

            {/* Class Teacher Status */}
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm shadow-sm">
                  👨‍🏫
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-700">
                    Class Teacher
                  </p>

                  <p className="text-[11px] text-gray-400">
                    Classroom responsibility
                  </p>
                </div>
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                  is_class_teacher
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {is_class_teacher ? "ACTIVE" : "NO"}
              </span>
            </div>

            {/* Results Status */}
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm shadow-sm">
                  📝
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-700">
                    Pending Results
                  </p>

                  <p className="text-[11px] text-gray-400">
                    Results requiring attention
                  </p>
                </div>
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                  pending_results > 0
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {pending_results > 0
                  ? `${pending_results} PENDING`
                  : "UP TO DATE"}
              </span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default TeacherDashboard;