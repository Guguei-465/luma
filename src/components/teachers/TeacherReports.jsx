import { useEffect, useState, useCallback } from "react";
import api from "../api/api";

const Spinner = () => (
  <div className="flex justify-center items-center h-80">
    <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-green-600"></div>
  </div>
);

const TeacherReports = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("reports/teachers/summary/");
      setSummary(data || {});
    } catch (err) {
      console.error("Report error:", err);
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

      {error && (
        <div className="card bg-red-50 border border-red-200 text-red-700 p-4">{error}</div>
      )}

      {!summary ? (
        <div className="card text-center py-10 text-gray-500">No report data available.</div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="stat-card py-6">
              <p className="text-sm text-gray-600 uppercase tracking-wider">Classes Handled</p>
              <p className="stat-value mt-2">{summary.classes_count ?? 0}</p>
            </div>

            <div className="stat-card py-6">
              <p className="text-sm text-gray-600 uppercase tracking-wider">Subjects Taught</p>
              <p className="stat-value mt-2">{summary.subjects_count ?? 0}</p>
            </div>

            <div className="stat-card py-6">
              <p className="text-sm text-gray-600 uppercase tracking-wider">Total Students</p>
              <p className="stat-value mt-2">{summary.total_students ?? 0}</p>
            </div>

            <div className="stat-card py-6">
              <p className="text-sm text-gray-600 uppercase tracking-wider">Assessments Set</p>
              <p className="stat-value mt-2">{summary.assessments_count ?? 0}</p>
            </div>

            <div className="stat-card py-6">
              <p className="text-sm text-gray-600 uppercase tracking-wider">Marks Entered</p>
              <p className="stat-value mt-2">{summary.marks_entered ?? 0}</p>
            </div>

            <div className="stat-card py-6">
              <p className="text-sm text-gray-600 uppercase tracking-wider">Attendance Marked</p>
              <p className="stat-value mt-2">{summary.attendance_days ?? 0}</p>
            </div>
          </div>

          {/* Quick Report Links */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">View Detailed Reports</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <button className="milk-btn">By Class</button>
              <button className="milk-btn">By Subject</button>
              <button className="milk-btn">Workload Summary</button>
              <button className="milk-btn">Performance Overview</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TeacherReports;