import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

const Spinner = () => (
  <div className="flex justify-center items-center h-80">
    <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-green-600"></div>
  </div>
);

const TeacherReports = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("dashboard/teacher/");
      setSummary({
        classes_count: data.assigned_classes ?? 0,
        subjects_count: data.assigned_subjects ?? 0,
        total_students: data.total_students ?? 0,
        pending_results: data.pending_results ?? 0,
        today_lessons: data.today_lessons ?? 0,
      });
    } catch (err) {
      console.error("❌ Report error:", err.response?.data || err.message);
      setError("Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (loading) return <Spinner />;

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="card">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">My Reports</h1>
        <p className="text-gray-500 mt-1 text-sm">Performance and workload summary</p>
      </div>

      {error && <div className="card bg-red-50 border border-red-200 text-red-700 p-4">{error}</div>}

      {!summary ? (
        <div className="card text-center py-10 text-gray-500">No report data available.</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="stat-card py-6">
              <p className="text-sm text-gray-600 uppercase tracking-wider">Classes Handled</p>
              <p className="stat-value mt-2">{summary.classes_count}</p>
            </div>
            <div className="stat-card py-6">
              <p className="text-sm text-gray-600 uppercase tracking-wider">Subjects Taught</p>
              <p className="stat-value mt-2">{summary.subjects_count}</p>
            </div>
            <div className="stat-card py-6">
              <p className="text-sm text-gray-600 uppercase tracking-wider">Total Students</p>
              <p className="stat-value mt-2">{summary.total_students}</p>
            </div>
            <div className="stat-card py-6">
              <p className="text-sm text-gray-600 uppercase tracking-wider">Pending Results</p>
              <p className="stat-value mt-2">{summary.pending_results}</p>
            </div>
            <div className="stat-card py-6">
              <p className="text-sm text-gray-600 uppercase tracking-wider">Today's Lessons</p>
              <p className="stat-value mt-2">{summary.today_lessons}</p>
            </div>
            <div className="stat-card py-6">
              <p className="text-sm text-gray-600 uppercase tracking-wider">Attendance Marked</p>
              <p className="stat-value mt-2 text-gray-500 text-sm">View Attendance Page</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TeacherReports;