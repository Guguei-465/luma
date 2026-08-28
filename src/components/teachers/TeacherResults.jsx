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

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr.slice(0, 16);
  }
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
// STATUS BADGE
// =====================================================
const StatusBadge = ({ status }) => {
  const normalized = String(status || "Submitted").toLowerCase();

  let classes = "bg-gray-100 text-gray-700";
  if (normalized === "final" || normalized === "approved") {
    classes = "bg-green-100 text-green-700";
  } else if (normalized === "draft" || normalized === "pending") {
    classes = "bg-amber-100 text-amber-700";
  } else if (normalized === "rejected") {
    classes = "bg-red-100 text-red-700";
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${classes}`}>
      {status || "Submitted"}
    </span>
  );
};


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
      console.log("✅ Results loaded:", getArray(data).length);
    } catch (err) {
      console.error("❌ Results error:", err.response?.data || err.message);
      setError("Failed to load results. Please try again.");
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
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Submitted Results</h1>
        <p className="text-gray-500 mt-1 text-sm">
          View all marks/results you have submitted
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* RESULTS LIST */}
      {results.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200 text-center text-gray-500">
          <h3 className="text-lg font-medium text-gray-600 mb-2">No Results Yet</h3>
          <p>You have not submitted any marks/results yet.</p>
          <p className="text-sm mt-2">Go to Assessments → Enter Marks to submit results.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((res) => (
            <div
              key={res.id}
              className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:bg-gray-50"
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3 mb-2">
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">
                    {res.assessment_name || res.name || res.title || "Untitled Assessment"}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    <span className="font-medium">{res.class_name || res.classroom_name || "—"}</span>
                    {" • "}
                    {res.subject_name || res.subject || "—"}
                    {res.assessment_type && ` • ${res.assessment_type}`}
                    {res.term && ` • ${res.term}`}
                    {res.academic_year && ` / ${res.academic_year}`}
                  </p>
                </div>
                <StatusBadge status={res.status || res.submission_status} />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-500 pt-2 border-t border-gray-100 mt-2">
                <span>📅 Submitted: {formatDate(res.submitted_at || res.created_at || res.date)}</span>
                {res.total_marks && (
                  <span className="sm:ml-auto">📊 Total Marks: {res.total_marks}</span>
                )}
                {res.submitted_by_name && (
                  <span>👤 By: {res.submitted_by_name}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


export default TeacherResults;