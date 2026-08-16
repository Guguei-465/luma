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
// PARENT REPORT CARDS
// =====================================================

const ParentReportCard = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // ===================================================
  // CURRENT ACADEMIC YEAR / TERM
  // ===================================================

  const academicYear = "2026";
  const term = "Term 1";

  // ===================================================
  // FETCH REPORT CARDS
  // ===================================================

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);

      // =================================================
      // STEP 1:
      // Get ONLY the logged-in parent's children
      // =================================================

      const childrenResponse = await api.get(
        "parents/children/"
      );

      console.log(
        "Parent children:",
        childrenResponse.data
      );

      let children = [];

      if (Array.isArray(childrenResponse.data)) {
        children = childrenResponse.data;
      } else if (
        childrenResponse.data &&
        Array.isArray(childrenResponse.data.results)
      ) {
        children = childrenResponse.data.results;
      }

      // =================================================
      // STEP 2:
      // Fetch report card for every child
      // =================================================

      const reportRequests = children.map(async (child) => {
        try {
          const studentId = child.id;

          const response = await api.get(
            `results/report-card/${studentId}/${academicYear}/${encodeURIComponent(
              term
            )}/`
          );

          console.log(
            `Report card for student ${studentId}:`,
            response.data
          );

          return {
            child,
            report: response.data,
            hasResults:
              Array.isArray(response.data?.subjects) &&
              response.data.subjects.length > 0,
          };
        } catch (error) {
          console.error(
            `Failed to load report card for student ${child.id}:`,
            error.response?.status,
            error.response?.data || error.message
          );

          return {
            child,
            report: null,
            hasResults: false,
          };
        }
      });

      const results = await Promise.all(reportRequests);

      // =================================================
      // STEP 3:
      // Normalize data
      // =================================================

      const normalizedReports = results.map(
        ({ child, report, hasResults }) => {
          const student =
            report?.student || child;

          const summary =
            report?.summary || {};

          return {
            student_id: child.id,

            first_name:
              child.first_name ||
              student.first_name ||
              "",

            last_name:
              child.last_name ||
              student.last_name ||
              "",

            admission_number:
              child.admission_number ||
              student.admission_number ||
              "—",

            assessment_number:
              child.assessment_number ||
              student.assessment_number ||
              "—",

            photo:
              child.photo ||
              child.profile_picture ||
              null,

            classroom:
              child.classroom_name ||
              student.classroom ||
              "—",

            grade:
              child.grade ||
              student.grade ||
              "",

            stream:
              child.stream ||
              student.stream ||
              "",

            academic_year:
              academicYear,

            term:

              term,

            subjects:
              report?.subjects || [],

            summary:
              report?.summary || null,

            average_score:
              summary?.average_score ??
              summary?.average_marks ??
              summary?.average ??
              null,

            grade_letter:
              summary?.grade ??
              summary?.grade_letter ??
              summary?.overall_grade ??
              "—",

            position:
              summary?.position ?? null,

            hasResults,
          };
        }
      );

      setReports(normalizedReports);

    } catch (error) {
      console.error(
        "Failed to load parent report cards:",
        error.response?.status,
        error.response?.data || error.message
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
    fetchReports();
  }, [fetchReports]);

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
            Failed to load your children's report cards.
          </p>

          <p className="text-sm mt-1">
            Please try again later.
          </p>

          <button
            onClick={fetchReports}
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
          Report Cards
        </h3>

        <p className="text-sm text-gray-500 mt-1">
          View report cards for your children.
        </p>

      </div>

      {/* ==============================================
          NO CHILDREN
      ============================================== */}

      {reports.length === 0 ? (

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">

          <div className="text-gray-400 text-4xl mb-3">
            <i className="bi bi-people"></i>
          </div>

          <h4 className="font-semibold text-gray-700">
            No children found
          </h4>

          <p className="text-sm text-gray-500 mt-1">
            No students are currently linked to your parent
            account.
          </p>

        </div>

      ) : (

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

          {/* ============================================
              DESKTOP TABLE
          ============================================ */}

          <div className="hidden md:block overflow-x-auto">

            <table className="w-full text-sm">

              <thead className="bg-gray-50">

                <tr>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Student
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Academic Year
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Term
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Average
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Grade
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-200">

                {reports.map((report) => {

                  const studentId =
                    report.student_id;

                  return (

                    <tr
                      key={studentId}
                      className="hover:bg-gray-50 transition-colors"
                    >

                      {/* Student */}

                      <td className="px-4 py-4">

                        <div className="flex items-center">

                          <UserAvatar
                            user={{
                              username:
                                report.first_name,
                              profile_picture:
                                report.photo,
                            }}
                            size={45}
                          />

                          <div className="ml-3">

                            <div className="font-semibold text-gray-900">

                              {report.first_name}{" "}
                              {report.last_name}

                            </div>

                            <div className="text-xs text-gray-500">

                              {report.classroom}

                            </div>

                            <div className="text-xs text-gray-400 mt-0.5">

                              Adm:{" "}
                              {report.admission_number}

                            </div>

                          </div>

                        </div>

                      </td>

                      {/* Academic Year */}

                      <td className="px-4 py-4 text-gray-600">

                        {report.academic_year}

                      </td>

                      {/* Term */}

                      <td className="px-4 py-4 text-gray-600">

                        {report.term}

                      </td>

                      {/* Average */}

                      <td className="px-4 py-4">

                        {report.hasResults &&
                        report.average_score !== null &&
                        report.average_score !== undefined ? (

                          <span className="font-semibold text-gray-800">

                            {Number(
                              report.average_score
                            ).toFixed(2)}
                            %

                          </span>

                        ) : (

                          <span className="text-gray-400">
                            No results
                          </span>

                        )}

                      </td>

                      {/* Grade */}

                      <td className="px-4 py-4">

                        {report.hasResults ? (

                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">

                            {report.grade_letter}

                          </span>

                        ) : (

                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">

                            Not available

                          </span>

                        )}

                      </td>

                      {/* Action */}

                      <td className="px-4 py-4">
                         <Link
                            to={`/parent-dashboard/report-card/${studentId}/${report.academic_year}/${encodeURIComponent(
                            report.term
                            )}`}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 text-xs font-medium transition inline-flex items-center gap-1"
                        >
                            <i className="bi bi-eye-fill"></i>
                            View
                        </Link>
                      </td>

                    </tr>

                  );
                })}

              </tbody>

            </table>

          </div>

          {/* ============================================
              MOBILE
          ============================================ */}

          <div className="md:hidden divide-y divide-gray-100">

            {reports.map((report) => {

              const studentId =
                report.student_id;

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
                          report.first_name,
                        profile_picture:
                          report.photo,
                      }}
                      size={45}
                    />

                    <div>

                      <p className="font-semibold text-gray-900">

                        {report.first_name}{" "}
                        {report.last_name}

                      </p>

                      <p className="text-xs text-gray-500">

                        {report.classroom}

                      </p>

                      <p className="text-xs text-gray-400 mt-0.5">

                        Adm:{" "}
                        {report.admission_number}

                      </p>

                    </div>

                  </div>

                  {/* Details */}

                  <div className="grid grid-cols-2 gap-y-3 text-sm">

                    <span className="text-gray-500">
                      Academic Year:
                    </span>

                    <span className="text-right font-medium">
                      {report.academic_year}
                    </span>

                    <span className="text-gray-500">
                      Term:
                    </span>

                    <span className="text-right font-medium">
                      {report.term}
                    </span>

                    <span className="text-gray-500">
                      Average:
                    </span>

                    <span className="text-right font-medium">

                      {report.hasResults &&
                      report.average_score !== null &&
                      report.average_score !== undefined
                        ? `${Number(
                            report.average_score
                          ).toFixed(2)}%`
                        : "No results"}

                    </span>

                    <span className="text-gray-500">
                      Grade:
                    </span>

                    <span className="text-right">

                      {report.hasResults ? (

                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">

                          {report.grade_letter}

                        </span>

                      ) : (

                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">

                          Not available

                        </span>

                      )}

                    </span>

                  </div>

                  {/* View */}

                <Link
                to={`/parent-dashboard/report-card/${studentId}/${report.academic_year}/${encodeURIComponent(
                    report.term
                )}`}
                className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                >
                View Report Card
                </Link>
                </div>

              );
            })}

          </div>

        </div>

      )}

    </div>
  );
};

export default ParentReportCard;