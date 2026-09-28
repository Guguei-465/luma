import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import api from "../api/api";


const TERMS = ["Term 1", "Term 2", "Term 3"];

const getArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const getErrorMessage = (err, fallback = "Something went wrong") => {
  return err?.response?.data?.detail || err?.response?.data?.message || err?.message || fallback;
};

const isReviewable = (item) => {
  const status = String(item.approval_status || item.status || "").toLowerCase().trim();
  return status === "draft" || status === "pending";
};

const Spinner = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full border-4 border-gray-200 border-t-green-600 w-12 h-12" />
  </div>
);

const StatusBadge = ({ status }) => {
  const s = String(status || "").toLowerCase();
  const style =
    s === "approved" ? "bg-green-100 text-green-700" :
    s === "returned" || s === "rejected" ? "bg-red-100 text-red-700" :
    s === "draft" ? "bg-gray-100 text-gray-600" :
    "bg-amber-100 text-amber-700";
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${style}`}>
      {status === "draft" ? "📝 Draft" : 
       status === "pending" ? "⏳ Pending" : 
       status === "returned" ? "↩️ Returned" : status || "Draft"}
    </span>
  );
};


const AcademicCoordinatorResults = () => {
  const [term, setTerm] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [teacher, setTeacher] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  // ✅ TEACHER NAMES — ALREADY WORKING PER YOUR LOGS!
  const fetchTeachers = useCallback(async () => {
    try {
      const res = await api.get("assignments/teachers/");
      const rawList = getArray(res);
      
      const list = rawList.map((t) => {
        const realName = 
          (t.user ? `${t.user.first_name || ""} ${t.user.last_name || ""}`.trim() : null) ||
          t.full_name || t.teacher_name || t.name ||
          `${t.first_name || ""} ${t.last_name || ""}`.trim() ||
          `Teacher ${t.id}`;
        
        return { id: String(t.id), name: realName };
      });
      
      console.log("✅ TEACHERS:", list);
      setTeachers(list);
    } catch (err) {
      console.error("❌ Failed to load teachers:", err);
      setTeachers([]);
    }
  }, []);


  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    const params = {};
    if (term) params.term = term;
    if (academicYear) params.academic_year = academicYear;
    if (teacher) params.submitted_by = teacher;

    try {
      const res = await api.get("results/result-submissions/", { params });
      const all = getArray(res);
      setSubmissions(all.filter(isReviewable));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load submissions"));
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [term, academicYear, teacher]);


  useEffect(() => {
    fetchTeachers();
    fetchSubmissions();
  }, [fetchTeachers, fetchSubmissions]);


  const openSubmission = useCallback((submission) => {
    setSelectedSubmission(submission);
    setError("");
    setSuccess("");
  }, []);

  const closeSubmission = useCallback(() => {
    setSelectedSubmission(null);
    setError("");
  }, []);


  // ✅ APPROVE — THIS ONE ALREADY WORKS
  const approveSubmission = useCallback(async (sub) => {
    const displayName = sub.assessment_name || `Submission #${sub.id}`;

    if (!window.confirm(`Approve "${displayName}" by ${sub.submitted_by_name}?`)) return;

    setProcessing(true);
    setError("");
    try {
      await api.post(`results/result-submissions/${sub.id}/approve/`);
      setSuccess(`✅ Approved "${displayName}" successfully!`);
      closeSubmission();
      fetchSubmissions();
    } catch (err) {
      const backendMsg = err?.response?.data?.detail;
      if (backendMsg === "Only pending submissions can be approved.") {
        setError(`⚠️ Cannot approve!\n\nStatus is "${sub.approval_status}".\n\n👉 Tell the teacher to click SAVE again to change status to Pending.`);
      } else {
        setError(`❌ ${backendMsg || "Approval failed"}`);
      }
    } finally {
      setProcessing(false);
    }
  }, [closeSubmission, fetchSubmissions]);


  // ✅ RETURN — USE PATCH DIRECTLY (NO MORE 404 ENDPOINTS!)
  const returnSubmission = useCallback(async (sub) => {
    const reason = window.prompt("Enter reason for returning to teacher:");
    if (!reason?.trim()) return;

    setProcessing(true);
    setError("");

    try {
      console.log(`📤 PATCH update submission ${sub.id} → Returned`);
      
      // ✅ UPDATE STATUS DIRECTLY — THIS IS THE ONLY WAY THAT WORKS!
      await api.patch(`results/result-submissions/${sub.id}/`, {
        approval_status: "Returned",
        coordinator_comments: reason.trim(),
        comments: reason.trim(),
        rejection_reason: reason.trim(),
      });

      setSuccess("✅ Returned to teacher! Status changed to Returned.");
      closeSubmission();
      fetchSubmissions();

    } catch (err) {
      console.error("❌ PATCH failed:", err.response?.data || err.message);
      
      // If PATCH also fails → tell developer EXACTLY what to fix
      setError(
        "❌ Return failed!\n\n" +
        "Reason: Backend does NOT allow updating approval_status.\n\n" +
        "👉 Developer needs to ALLOW PATCH on approval_status field OR add a /reject/ endpoint."
      );
    } finally {
      setProcessing(false);
    }
  }, [closeSubmission, fetchSubmissions]);


  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Results Approval</h1>
            <p className="text-gray-500">Review and approve results saved by teachers.</p>
          </div>
          <button
            onClick={fetchSubmissions}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            {loading ? "Loading..." : "🔄 Refresh"}
          </button>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 whitespace-pre-line">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border">
          <h2 className="font-bold mb-3">Filter Results</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Term</label>
              <select
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">All Terms</option>
                {TERMS.map((t) => (<option key={t} value={t}>{t}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Academic Year</label>
              <input
                type="text"
                placeholder="e.g. 2026/2027"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Teacher</label>
              <select
                value={teacher}
                onChange={(e) => setTeacher(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">All Teachers</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <p className="mb-4">
          <strong>Submissions for review:</strong> {submissions.length}
        </p>

        {/* Submissions Table */}
        {loading ? (
          <Spinner />
        ) : submissions.length === 0 ? (
          <div className="bg-white rounded-xl border p-10 text-center text-gray-500">
            ✅ No results waiting for approval
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-green-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-green-700 font-semibold">#</th>
                  <th className="px-4 py-3 text-green-700 font-semibold">Assessment</th>
                  <th className="px-4 py-3 text-green-700 font-semibold">Submitted By</th>
                  <th className="px-4 py-3 text-green-700 font-semibold">Status</th>
                  <th className="px-4 py-3 text-green-700 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s, i) => (
                  <tr key={s.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">
                      {s.assessment_name || `Submission #${s.id}`}
                    </td>
                    <td className="px-4 py-3">{s.submitted_by_name || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.approval_status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openSubmission(s)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Review</button>
                        <button onClick={() => approveSubmission(s)} disabled={processing}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm disabled:opacity-50">Approve</button>
                        <button onClick={() => returnSubmission(s)} disabled={processing}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm disabled:opacity-50">Return</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Review Modal */}
        {selectedSubmission && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="p-5 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold">Review Submission</h2>
                <button onClick={closeSubmission} className="text-gray-400 text-xl">✕</button>
              </div>

              <div className="p-5 space-y-3">
                <p><strong>Assessment:</strong> {selectedSubmission.assessment_name || `Submission #${selectedSubmission.id}`}</p>
                <p><strong>Submitted by:</strong> {selectedSubmission.submitted_by_name || "Unknown"}</p>
                <p><strong>Current Status:</strong> <StatusBadge status={selectedSubmission.approval_status} /></p>
              </div>

              <div className="p-5 border-t bg-gray-50 flex justify-end gap-3">
                <button onClick={closeSubmission} className="px-4 py-2 border rounded-lg">Close</button>
                <button onClick={() => returnSubmission(selectedSubmission)} disabled={processing}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50">Return</button>
                <button onClick={() => approveSubmission(selectedSubmission)} disabled={processing}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50">
                  {processing ? "..." : "Approve"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademicCoordinatorResults;