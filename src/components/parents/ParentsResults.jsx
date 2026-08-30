import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import UserAvatar from "../UseAvata";
import api from "../api/api";


// =====================================================
// SPINNER
// =====================================================
const Spinner = () => (
  <div className="flex justify-center items-center py-12">
    <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-green-600"></div>
  </div>
);


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
// PARENT RESULTS
// =====================================================
const ParentResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // ===================================================
  // GET CHILD ID
  // ===================================================
  const getStudentId = (child) => {
    return child?.student_id || child?.student?.id || child?.id;
  };

  // ===================================================
  // FETCH RESULTS
  // ===================================================
  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);

      // -----------------------------------------------
      // STEP 1 — Get children belonging to logged-in parent
      // -----------------------------------------------
      const response = await api.get("dashboard/parent/children/");
      console.log("📥 Parent children response:", response.data);

      let childList = [];
      if (Array.isArray(response.data)) {
        childList = response.data;
      } else if (response.data && Array.isArray(response.data.children)) {
        childList = response.data.children;
      }
      console.log("✅ Children list:", childList);

      if (childList.length === 0) {
        setResults([]);
        return;
      }

      // -----------------------------------------------
      // STEP 2 — Fetch ALL results once, then filter
      // ✅ MORE EFFICIENT: Loads once, not per child
      // -----------------------------------------------
      const { data: allResults } = await api.get("results/student-results/");
      const marksList = getArray(allResults);
      console.log("📥 All results loaded:", marksList.length);

      // Attach results to each child
      const childrenWithResults = childList.map((child) => {
        const studentId = Number(getStudentId(child));

        if (!studentId) {
          return {
            ...child,
            average_score: null,
            cbc_grade: "—",
            has_results: false,
            results: [],
          };
        }

        // ✅ Filter results for THIS student
        let studentResults = marksList.filter((m) => Number(m.student) === studentId);

        // ✅ Remove duplicates — keep latest per subject+term
        const uniqueMap = {};
        studentResults.forEach((m) => {
          const key = `${m.subject_name}-${m.term}-${m.academic_year}`;
          if (!uniqueMap[key] || new Date(m.updated_at) > new Date(uniqueMap[key].updated_at)) {
            uniqueMap[key] = m;
          }
        });
        studentResults = Object.values(uniqueMap);

        // ✅ Calculate average score from actual results
        let averageScore = null;
        let cbcGrade = "—";
        if (studentResults.length > 0) {
          const total = studentResults.reduce((sum, m) => sum + (Number(m.total_score) || 0), 0);
          averageScore = total / studentResults.length;

          // Use latest result's grade as overall CBC grade
          const latest = studentResults.sort(
            (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
          )[0];
          cbcGrade = latest?.grade_name || latest?.cbc_code || "—";
        }

        return {
          ...child,
          student_id: studentId,
          average_score: averageScore,
          cbc_grade: cbcGrade,
          has_results: studentResults.length > 0,
          results: studentResults,
        };
      });

      console.log("✅ Final results:", childrenWithResults);
      setResults(childrenWithResults);

    } catch (err) {
      console.error("❌ Failed to load:", err.response?.status, err.response?.data || err.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // ===================================================
  // INITIAL LOAD
  // ===================================================
  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  if (loading) return <Spinner />;

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <p className="font-medium">Failed to load results.</p>
          <p className="text-sm mt-1">Please try again later.</p>
          <button
            onClick={fetchResults}
            className="mt-3 bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* HEADER */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800">CBC Results</h3>
        <p className="text-sm text-gray-500 mt-1">Latest performance for all your children.</p>
      </div>

      {/* RESULTS CONTAINER */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* DESKTOP TABLE */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Class</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Average</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">CBC Grade</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {results.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-gray-500">No children found.</td>
                </tr>
              ) : (
                results.map((student) => {
                  const studentId = student.student_id || student.id;
                  const hasResults = student.has_results;
                  return (
                    <tr key={studentId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            user={{
                              username: student.first_name,
                              profile_picture: student.photo,
                            }}
                            size={40}
                          />
                          <div>
                            <p className="font-medium text-gray-900">
                              {student.first_name} {student.last_name}
                            </p>
                            <p className="text-xs text-gray-500">Adm: {student.admission_number || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        {student.classroom_name || `${student.grade || ""} ${student.stream || ""}` || "—"}
                      </td>
                      <td className="px-4 py-4">
                        {student.average_score !== null ? (
                          <span className="font-semibold text-gray-800">
                            {Number(student.average_score).toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {hasResults ? (
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            {student.cbc_grade}
                          </span>
                        ) : (
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                            No Results
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          to={`/parent/student/${studentId}/results`}
                          className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                        >
                          View Results
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS */}
        <div className="md:hidden divide-y divide-gray-100">
          {results.length === 0 ? (
            <div className="text-center py-10 text-gray-500">No children found.</div>
          ) : (
            results.map((student) => {
              const studentId = student.student_id || student.id;
              const hasResults = student.has_results;
              return (
                <div key={studentId} className="p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      user={{
                        username: student.first_name,
                        profile_picture: student.photo,
                      }}
                      size={42}
                    />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {student.first_name} {student.last_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {student.classroom_name || `${student.grade || ""} ${student.stream || ""}` || "—"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">Adm: {student.admission_number || "—"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <span className="text-gray-500">Average:</span>
                    <span className="text-right font-medium">
                      {student.average_score !== null
                        ? `${Number(student.average_score).toFixed(2)}%`
                        : "—"}
                    </span>
                    <span className="text-gray-500">CBC Grade:</span>
                    <span className="text-right">
                      {hasResults ? (
                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          {student.cbc_grade}
                        </span>
                      ) : (
                        <span className="text-gray-400">No Results</span>
                      )}
                    </span>
                  </div>

                  <Link
                    to={`/parent/student/${studentId}/results`}
                    className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                  >
                    View Results
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentResults;