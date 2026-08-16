import { useEffect, useState, useCallback } from "react";
import api from "../api/api";

// =====================================================
// HELPERS
// =====================================================
const getArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

// =====================================================
// SPINNER
// =====================================================
const Spinner = () => (
  <div className="flex justify-center items-center h-80">
    <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-green-600"></div>
  </div>
);

// =====================================================
// MAIN COMPONENT
// =====================================================
const TeacherResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get("results/result-submissions/");
      setResults(getArray(data));
    } catch (err) {
      console.error("❌ Results error:", err.response?.data || err.message);
      setError("Failed to load results.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  if (loading) return <Spinner />;

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="card">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Submitted Results</h1>
        <p className="text-gray-500 mt-1 text-sm">
          View all results you have submitted
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="card bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* RESULTS LIST */}
      {results.length === 0 ? (
        <div className="card text-center py-10 text-gray-500">
          No results submitted yet.
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((res) => (
            <div key={res.id} className="card">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {res.assessment_name || res.title || "Untitled Assessment"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {res.class_name || "—"} • {res.subject_name || "—"}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  {res.status || "Submitted"}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Submitted: {res.submitted_at || res.date || "—"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherResults;