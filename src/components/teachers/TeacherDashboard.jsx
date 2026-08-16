import { useEffect, useState, useCallback } from "react";
import api from "../api/api";

// =====================================================
// SPINNER
// =====================================================

const Spinner = () => (
  <div className="flex justify-center items-center h-80">
    <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-green-600"></div>
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

      const { data } = await api.get(
        "dashboard/teacher/"
      );

      setDashboard(data || {});
    } catch (err) {
      console.error(
        "Teacher Dashboard error:",
        err
      );

      console.error(
        "Backend response:",
        err.response?.data
      );

      setError(
        "Failed to load teacher dashboard."
      );
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
      <div className="p-4 md:p-6">

        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">

          {error}

        </div>

      </div>
    );
  }

  // ===================================================
  // DASHBOARD DATA
  // ===================================================

  const d = dashboard || {};

  const teacher_name =
    d.teacher_name || "Teacher";

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
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* =================================================
          WELCOME HEADER
      ================================================= */}

      <div className="card">

        <h1 className="text-xl md:text-2xl font-bold text-gray-800">
          Good Morning, {teacher_name}
        </h1>

        <p className="text-gray-500 mt-1 text-sm">
          Welcome back to your teaching dashboard.
        </p>

      </div>

      {/* =================================================
          STATISTICS
      ================================================= */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

        {/* =================================================
            ASSIGNED CLASSES
        ================================================= */}

        <div className="stat-card py-6">

          <p className="text-sm text-gray-600 uppercase tracking-wider">
            Assigned Classes
          </p>

          <p className="stat-value mt-2">
            {assigned_classes}
          </p>

        </div>

        {/* =================================================
            ASSIGNED SUBJECTS
        ================================================= */}

        <div className="stat-card py-6">

          <p className="text-sm text-gray-600 uppercase tracking-wider">
            Assigned Subjects
          </p>

          <p className="stat-value mt-2">
            {assigned_subjects}
          </p>

        </div>

        {/* =================================================
            TOTAL STUDENTS
        ================================================= */}

        <div className="stat-card py-6">

          <p className="text-sm text-gray-600 uppercase tracking-wider">
            Total Students
          </p>

          <p className="stat-value mt-2">
            {total_students}
          </p>

        </div>

        {/* =================================================
            PENDING RESULTS
        ================================================= */}

        <div className="stat-card py-6">

          <p className="text-sm text-gray-600 uppercase tracking-wider">
            Pending Results
          </p>

          <p className="stat-value mt-2">
            {pending_results}
          </p>

        </div>

        {/* =================================================
            CLASS TEACHER
        ================================================= */}

        <div className="stat-card py-6">

          <p className="text-sm text-gray-600 uppercase tracking-wider">
            Class Teacher
          </p>

          <p className="stat-value mt-2">
            {is_class_teacher
              ? "YES"
              : "NO"}
          </p>

        </div>

      </div>

    </div>
  );
};

export default TeacherDashboard;