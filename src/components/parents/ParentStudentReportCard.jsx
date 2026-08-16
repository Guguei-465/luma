import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/api";

// =====================================================
// SPINNER
// =====================================================

const Spinner = () => (
  <div className="flex justify-center items-center py-16">
    <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-blue-600"></div>
  </div>
);

// =====================================================
// PARENT STUDENT REPORT CARD
// =====================================================

const ParentStudentReportCard = () => {
  const {
    studentId,
    academicYear,
    term,
  } = useParams();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ===================================================
  // FETCH REPORT CARD
  // ===================================================

  const fetchReportCard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `results/report-card/${studentId}/${academicYear}/${encodeURIComponent(
          term
        )}/`
      );

      console.log(
        "Student report card:",
        response.data
      );

      setReport(response.data);

    } catch (error) {
      console.error(
        "Failed to load report card:",
        error.response?.status,
        error.response?.data || error.message
      );

      setError(
        error.response?.data?.detail ||
        "Failed to load this student's report card."
      );

    } finally {
      setLoading(false);
    }
  }, [studentId, academicYear, term]);

  // ===================================================
  // LOAD
  // ===================================================

  useEffect(() => {
    fetchReportCard();
  }, [fetchReportCard]);

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

        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-5">

          <h3 className="font-semibold">
            Unable to load report card
          </h3>

          <p className="text-sm mt-1">
            {error}
          </p>

          <button
            onClick={fetchReportCard}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            Try Again
          </button>

        </div>

      </div>
    );
  }

  if (!report || !report.student) {
    return (
      <div className="p-4 md:p-6">

        <div className="bg-white border rounded-xl p-10 text-center">

          <h3 className="font-semibold text-gray-700">
            Report card not found
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            No report card information is available for this
            student.
          </p>

        </div>

      </div>
    );
  }

  // ===================================================
  // DATA
  // ===================================================

  const student = report.student;

  const subjects = Array.isArray(report.subjects)
    ? report.subjects
    : [];

  const summary = report.summary;

  // ===================================================
  // PAGE
  // ===================================================

  return (
    <div className="p-4 md:p-6">

      {/* ==============================================
          BACK
      ============================================== */}

      <div className="mb-5">

        <Link
          to="/parent-dashboard/report-cards"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
        >
          <i className="bi bi-arrow-left"></i>
          Back to Report Cards
        </Link>

      </div>

      {/* ==============================================
          REPORT HEADER
      ============================================== */}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

        <div className="bg-gray-50 border-b px-5 py-5">

          <h2 className="text-xl font-bold text-gray-800">
            Student Report Card
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            {academicYear} — {term}
          </p>

        </div>

        {/* ============================================
            STUDENT INFORMATION
        ============================================ */}

        <div className="p-5">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            <div className="bg-gray-50 rounded-lg p-4">

              <p className="text-xs text-gray-500 uppercase">
                Student
              </p>

              <p className="font-semibold text-gray-800 mt-1">
                {student.name}
              </p>

            </div>

            <div className="bg-gray-50 rounded-lg p-4">

              <p className="text-xs text-gray-500 uppercase">
                Admission Number
              </p>

              <p className="font-semibold text-gray-800 mt-1">
                {student.admission_number || "—"}
              </p>

            </div>

            <div className="bg-gray-50 rounded-lg p-4">

              <p className="text-xs text-gray-500 uppercase">
                Assessment Number
              </p>

              <p className="font-semibold text-gray-800 mt-1">
                {student.assessment_number || "—"}
              </p>

            </div>

            <div className="bg-gray-50 rounded-lg p-4">

              <p className="text-xs text-gray-500 uppercase">
                Classroom
              </p>

              <p className="font-semibold text-gray-800 mt-1">
                {student.classroom || "—"}
              </p>

            </div>

          </div>

        </div>

        {/* ============================================
            SUBJECT RESULTS
        ============================================ */}

        <div className="border-t">

          <div className="px-5 py-4">

            <h3 className="font-semibold text-gray-800">
              Subject Results
            </h3>

          </div>

          {subjects.length === 0 ? (

            <div className="px-5 pb-8">

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">

                <div className="text-yellow-600 text-3xl mb-2">
                  <i className="bi bi-info-circle"></i>
                </div>

                <h4 className="font-semibold text-gray-800">
                  No subject results available yet
                </h4>

                <p className="text-sm text-gray-600 mt-1">
                  Results for this student have not been
                  entered or published for {term}.
                </p>

              </div>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead className="bg-gray-50">

                  <tr>

                    <th className="px-5 py-3 text-left">
                      Subject
                    </th>

                    <th className="px-5 py-3 text-left">
                      Score
                    </th>

                    <th className="px-5 py-3 text-left">
                      Grade
                    </th>

                    <th className="px-5 py-3 text-left">
                      Remarks
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y">

                  {subjects.map((subject, index) => (

                    <tr key={index}>

                      <td className="px-5 py-4 font-medium">
                        {subject.subject_name ||
                          subject.subject ||
                          "—"}
                      </td>

                      <td className="px-5 py-4">
                        {subject.score ??
                          subject.total_score ??
                          subject.average_score ??
                          "—"}
                      </td>

                      <td className="px-5 py-4">

                        {subject.grade ||
                        subject.grade_letter ? (

                          <span className="inline-flex px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">

                            {subject.grade ||
                              subject.grade_letter}

                          </span>

                        ) : (
                          "—"
                        )}

                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {subject.remarks ||
                          subject.teacher_comment ||
                          "—"}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

        {/* ============================================
            SUMMARY
        ============================================ */}

        <div className="border-t">

          <div className="px-5 py-4">

            <h3 className="font-semibold text-gray-800">
              Overall Summary
            </h3>

          </div>

          {!summary ? (

            <div className="px-5 pb-8">

              <div className="bg-gray-50 border rounded-xl p-6 text-center">

                <p className="text-gray-500 text-sm">
                  Overall summary is not available yet.
                </p>

              </div>

            </div>

          ) : (

            <div className="px-5 pb-6">

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                <div className="bg-gray-50 rounded-lg p-4">

                  <p className="text-xs text-gray-500">
                    Average
                  </p>

                  <p className="text-xl font-bold mt-1">
                    {summary.average_score ??
                      summary.average_marks ??
                      summary.average ??
                      "—"}
                  </p>

                </div>

                <div className="bg-gray-50 rounded-lg p-4">

                  <p className="text-xs text-gray-500">
                    Grade
                  </p>

                  <p className="text-xl font-bold mt-1">
                    {summary.grade ??
                      summary.grade_letter ??
                      summary.overall_grade ??
                      "—"}
                  </p>

                </div>

                <div className="bg-gray-50 rounded-lg p-4">

                  <p className="text-xs text-gray-500">
                    Position
                  </p>

                  <p className="text-xl font-bold mt-1">
                    {summary.position ?? "—"}
                  </p>

                </div>

                <div className="bg-gray-50 rounded-lg p-4">

                  <p className="text-xs text-gray-500">
                    Subjects
                  </p>

                  <p className="text-xl font-bold mt-1">
                    {summary.total_subjects ??
                      subjects.length}
                  </p>

                </div>

              </div>

            </div>

          )}

        </div>

      </div>

    </div>
  );
};

export default ParentStudentReportCard;