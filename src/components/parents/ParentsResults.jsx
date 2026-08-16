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
      // STEP 1
      // Get children belonging to logged-in parent
      // -----------------------------------------------

      const response = await api.get(
        "dashboard/parent/children/"
      );

      console.log(
        "Parent children response:",
        response.data
      );

      // -----------------------------------------------
      // Support both possible backend formats:
      //
      // 1. [child1, child2]
      //
      // 2. {
      //      children: [child1, child2],
      //      children_count: 2
      //    }
      // -----------------------------------------------

      let childList = [];

      if (Array.isArray(response.data)) {
        childList = response.data;
      } else if (
        response.data &&
        Array.isArray(response.data.children)
      ) {
        childList = response.data.children;
      }

      console.log("Children list:", childList);

      // -----------------------------------------------
      // No children
      // -----------------------------------------------

      if (childList.length === 0) {
        setResults([]);
        return;
      }

      // -----------------------------------------------
      // STEP 2
      // Fetch results for EACH CHILD
      // -----------------------------------------------

      const resultPromises = childList.map(async (child) => {
        const studentId = getStudentId(child);

        // If child has no valid ID, keep the child
        if (!studentId) {
          return {
            ...child,
            average_score: null,
            cbc_grade: "—",
            has_results: false,
          };
        }

        try {
          const resultResponse = await api.get(
            `results/student-results/${studentId}/`
          );

          console.log(
            `Results for student ${studentId}:`,
            resultResponse.data
          );

          const data = resultResponse.data;

          // -------------------------------------------
          // Handle different possible backend fields
          // -------------------------------------------

          const averageScore =
            data?.average_score ??
            data?.average ??
            data?.overall_average ??
            data?.average_marks ??
            null;

          const cbcGrade =
            data?.cbc_grade ??
            data?.overall_grade ??
            data?.grade ??
            "—";

          return {
            ...child,

            student_id: studentId,

            average_score:
              averageScore !== null
                ? Number(averageScore)
                : null,

            cbc_grade: cbcGrade,

            has_results:
              averageScore !== null ||
              cbcGrade !== "—",
          };
        } catch (resultError) {
          console.warn(
            `No results available for student ${studentId}:`,
            resultError.response?.status,
            resultError.response?.data
          );

          // -------------------------------------------
          // IMPORTANT:
          // Do NOT remove the child just because
          // they have no results.
          // -------------------------------------------

          return {
            ...child,

            student_id: studentId,

            average_score: null,

            cbc_grade: "—",

            has_results: false,
          };
        }
      });

      const allResults = await Promise.all(
        resultPromises
      );

      console.log(
        "Final parent results:",
        allResults
      );

      setResults(allResults);
    } catch (err) {
      console.error(
        "Failed to load parent results:",
        err.response?.status,
        err.response?.data || err.message
      );

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
          <p className="font-medium">
            Failed to load results.
          </p>

          <p className="text-sm mt-1">
            Please try again later.
          </p>

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

  // ===================================================
  // PAGE
  // ===================================================

  return (
    <div className="p-4 md:p-6">

      {/* ==============================================
          HEADER
      ============================================== */}

      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800">
          CBC Results
        </h3>

        <p className="text-sm text-gray-500 mt-1">
          Latest performance for all your children.
        </p>
      </div>

      {/* ==============================================
          RESULTS CONTAINER
      ============================================== */}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

        {/* ============================================
            DESKTOP TABLE
        ============================================ */}

        <div className="hidden md:block overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-gray-50">
              <tr>

                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Student
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Class
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Average
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  CBC Grade
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Action
                </th>

              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">

              {results.length === 0 ? (

                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-10 text-gray-500"
                  >
                    No children found.
                  </td>
                </tr>

              ) : (

                results.map((student) => {

                  const studentId =
                    student.student_id ||
                    student.id;

                  const hasResults =
                    student.has_results;

                  return (
                    <tr
                      key={studentId}
                      className="hover:bg-gray-50 transition-colors"
                    >

                      {/* Student */}

                      <td className="px-4 py-4">

                        <div className="flex items-center gap-3">

                          <UserAvatar
                            user={{
                              username:
                                student.first_name,
                              profile_picture:
                                student.photo,
                            }}
                            size={40}
                          />

                          <div>

                            <p className="font-medium text-gray-900">
                              {student.first_name}{" "}
                              {student.last_name}
                            </p>

                            <p className="text-xs text-gray-500">
                              Adm:{" "}
                              {student.admission_number ||
                                "—"}
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* Class */}

                      <td className="px-4 py-4 text-gray-600">

                        {student.grade || "—"}{" "}
                        {student.stream || ""}

                      </td>

                      {/* Average */}

                      <td className="px-4 py-4">

                        {student.average_score !== null &&
                        student.average_score !== undefined ? (
                          <span className="font-semibold text-gray-800">
                            {Number(
                              student.average_score
                            ).toFixed(2)}
                            %
                          </span>
                        ) : (
                          <span className="text-gray-400">
                            —
                          </span>
                        )}

                      </td>

                      {/* CBC Grade */}

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

                      {/* Action */}

                      <td className="px-4 py-4">

                        <Link
                          to={`/parent-dashboard/my-children/${studentId}?tab=results`}
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

        {/* ============================================
            MOBILE CARDS
        ============================================ */}

        <div className="md:hidden divide-y divide-gray-100">

          {results.length === 0 ? (

            <div className="text-center py-10 text-gray-500">
              No children found.
            </div>

          ) : (

            results.map((student) => {

              const studentId =
                student.student_id ||
                student.id;

              const hasResults =
                student.has_results;

              return (
                <div
                  key={studentId}
                  className="p-4 space-y-4"
                >

                  {/* Student */}

                  <div className="flex items-center gap-3">

                    <UserAvatar
                      user={{
                        username:
                          student.first_name,
                        profile_picture:
                          student.photo,
                      }}
                      size={42}
                    />

                    <div>

                      <p className="font-semibold text-gray-900">
                        {student.first_name}{" "}
                        {student.last_name}
                      </p>

                      <p className="text-xs text-gray-500">
                        {student.grade || "—"}{" "}
                        {student.stream || ""}
                      </p>

                      <p className="text-xs text-gray-400 mt-0.5">
                        Adm:{" "}
                        {student.admission_number ||
                          "—"}
                      </p>

                    </div>

                  </div>

                  {/* Results */}

                  <div className="grid grid-cols-2 gap-y-3 text-sm">

                    <span className="text-gray-500">
                      Average:
                    </span>

                    <span className="text-right font-medium">

                      {student.average_score !== null &&
                      student.average_score !== undefined ? (
                        `${Number(
                          student.average_score
                        ).toFixed(2)}%`
                      ) : (
                        "—"
                      )}

                    </span>

                    <span className="text-gray-500">
                      CBC Grade:
                    </span>

                    <span className="text-right">

                      {hasResults ? (

                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          {student.cbc_grade}
                        </span>

                      ) : (

                        <span className="text-gray-400">
                          No Results
                        </span>

                      )}

                    </span>

                  </div>

                  {/* View Results */}

                  <Link
                    to={`/parent-dashboard/my-children/${studentId}?tab=results`}
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