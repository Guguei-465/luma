import { useEffect, useState, useCallback } from "react";
import api from "../api/api";

// ─── SPINNER ───
const Spinner = () => (
  <div className="flex justify-center items-center h-80">
    <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-green-600"></div>
  </div>
);

const AcademicCoordinatorWorkload = () => {
  const [workloadData, setWorkloadData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchWorkload = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // ✅ This endpoint works for Academic Coordinator
      const { data } = await api.get("reports/teachers/workload/");
      console.log("✅ Workload data:", data);

      setWorkloadData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Workload error:", err.response?.data || err.message);
      setError("Failed to load workload summary.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkload();
  }, [fetchWorkload]);

  if (loading) return <Spinner />;

  if (error)
    return (
      <div className="p-4 md:p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          {error}
        </div>
      </div>
    );

  // ✅ Group by teacher name to combine duplicates
  const grouped = workloadData.reduce((acc, item) => {
    if (!item.teacher) return acc;
    if (!acc[item.teacher]) {
      acc[item.teacher] = { teacher: item.teacher, total_assignments: 0, total_classes: 0, total_subjects: 0 };
    }
    acc[item.teacher].total_assignments += item.total_assignments || 0;
    acc[item.teacher].total_classes += item.total_classes || 0;
    acc[item.teacher].total_subjects += item.total_subjects || 0;
    return acc;
  }, {});

  const uniqueTeachers = Object.values(grouped);

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="card">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Teacher Workload Summary</h1>
        <p className="text-gray-500 mt-1 text-sm">Overview of all teachers' assignments</p>
      </div>

      {uniqueTeachers.length === 0 ? (
        <div className="card text-center py-10 text-gray-500">No workload data available.</div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600">Teacher Name</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 text-center">Assignments</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 text-center">Classes</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 text-center">Subjects</th>
                </tr>
              </thead>
              <tbody>
                {uniqueTeachers.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-800">{row.teacher}</td>
                    <td className="py-3 px-4 text-sm text-gray-700 text-center">{row.total_assignments}</td>
                    <td className="py-3 px-4 text-sm text-gray-700 text-center">{row.total_classes}</td>
                    <td className="py-3 px-4 text-sm text-gray-700 text-center">{row.total_subjects}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicCoordinatorWorkload;