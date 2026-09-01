import { useEffect, useState } from "react";
import api from "../api/api";

const toArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
};

const Spinner = () => (
  <div className="flex items-center justify-center h-96">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-600 mx-auto mb-4"></div>
      <p className="text-gray-500">Loading...</p>
    </div>
  </div>
);

const ResultSubmissions = () => {
  const [results, setResults] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterExam, setFilterExam] = useState("all");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [resRes, examRes] = await Promise.all([
        api.get("results/result-submissions/"),
        api.get("exams/")
      ]);
      setResults(toArray(resRes.data));
      setExams(toArray(examRes.data));
    } catch (err) {
      console.error("Failed to load result submissions:", err);
      setError("Could not load result submissions. Please try again.");
      setResults([]);
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const approveResult = async (id) => {
    try {
      await api.patch(`results/result-submissions/${id}/approve/`);
      loadData();
    } catch (err) {
      console.error("Approval failed:", err.response?.data || err);
      alert("Could not approve this result!");
    }
  };

  const rejectResult = async (id) => {
    const reason = prompt("Enter reason for rejection:");
    if (!reason) return;
    try {
      await api.patch(`results/result-submissions/${id}/reject/`, { rejection_reason: reason });
      loadData();
    } catch (err) {
      console.error("Rejection failed:", err.response?.data || err);
      alert("Could not reject this result!");
    }
  };

  const filteredResults = results.filter((r) => {
    const matchSearch =
      String(r.student_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(r.subject_name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchExam = filterExam === "all" || String(r.exam_id) === filterExam;
    return matchSearch && matchExam;
  });

  const getStatusBadge = (status) => {
    const s = String(status).toLowerCase();
    if (s === "approved") return "bg-green-100 text-green-700";
    if (s === "pending") return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  };

  if (loading) return <Spinner />;

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* HEADER — Responsive */}
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Result Submissions</h1>
        <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">
          Review submitted marks, verify accuracy & approve or reject
        </p>
      </div>

      {error && (
        <div className="p-3 sm:p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Search & Filter — Responsive */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Student / Subject</label>
            <input
              type="text"
              placeholder="Search by student or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Exam</label>
            <select
              value={filterExam}
              onChange={(e) => setFilterExam(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Exams</option>
              {exams.map(ex => (
                <option key={ex.id} value={String(ex.id)}>
                  {ex.name || ex.title || `Exam ${ex.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats — Responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 border-l-4 border-amber-500">
          <p className="text-sm text-gray-500">Pending Review</p>
          <p className="text-2xl sm:text-3xl font-bold text-amber-600 mt-1">
            {results.filter(r => String(r.status).toLowerCase() === "pending").length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Approved</p>
          <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1">
            {results.filter(r => String(r.status).toLowerCase() === "approved").length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 border-l-4 border-red-500">
          <p className="text-sm text-gray-500">Rejected</p>
          <p className="text-2xl sm:text-3xl font-bold text-red-600 mt-1">
            {results.filter(r => String(r.status).toLowerCase() === "rejected").length}
          </p>
        </div>
      </div>

      {/* RESULTS VIEW — Desktop Table / Mobile Cards */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredResults.length === 0 ? (
          <div className="text-center py-10 sm:py-16 text-gray-500">
            <p className="text-base sm:text-lg">No result submissions match your filters.</p>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE (md+) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead className="bg-green-50 border-b-2 border-green-200">
                  <tr>
                    <th className="py-3 px-4 text-green-700 font-semibold">Student</th>
                    <th className="py-3 px-4 text-green-700 font-semibold">Subject</th>
                    <th className="py-3 px-4 text-green-700 font-semibold">Exam</th>
                    <th className="py-3 px-4 text-green-700 font-semibold">Score</th>
                    <th className="py-3 px-4 text-green-700 font-semibold">Status</th>
                    <th className="py-3 px-4 text-center text-green-700 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((res) => (
                    <tr key={res.id} className="border-b border-gray-100 hover:bg-green-50/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-800 whitespace-nowrap">
                        {res.student_name || "—"}
                      </td>
                      <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                        {res.subject_name || "—"}
                      </td>
                      <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                        {res.exam_name || "—"}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-800 whitespace-nowrap">
                        {res.score ?? "—"} / {res.total_score ?? "—"}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(res.status)}`}>
                          {String(res.status || "").toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {String(res.status).toLowerCase() === "pending" ? (
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => approveResult(res.id)}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => rejectResult(res.id)}
                              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No action</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS (< md) */}
            <div className="md:hidden space-y-3 p-3 sm:p-4">
              {filteredResults.map((res) => (
                <div key={res.id} className="border border-gray-200 rounded-lg p-4 hover:bg-green-50/50 transition-colors">
                  {/* Header: Student + Status */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-lg text-gray-800">{res.student_name || "Unknown Student"}</h4>
                      <p className="text-sm text-gray-500">
                        {res.subject_name || "—"} • {res.exam_name || "—"}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(res.status)}`}>
                      {String(res.status || "").toUpperCase()}
                    </span>
                  </div>

                  {/* Score */}
                  <div className="mb-3">
                    <span className="text-sm text-gray-500">Score:</span>
                    <span className="ml-2 font-bold text-lg text-gray-800">
                      {res.score ?? "—"} / {res.total_score ?? "—"}
                    </span>
                  </div>

                  {/* Actions */}
                  {String(res.status).toLowerCase() === "pending" && (
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => approveResult(res.id)}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => rejectResult(res.id)}
                        className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResultSubmissions;