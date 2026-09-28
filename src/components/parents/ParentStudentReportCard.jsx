import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/api";


const Spinner = () => (
  <div className="flex justify-center items-center py-16">
    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-600"></div>
  </div>
);


const getGradeStyle = (grade) => {
  if (!grade) return "bg-gray-100 text-gray-600";
  const g = String(grade).toUpperCase().trim();
  if (g.startsWith("A") || g.includes("EXCEEDS")) return "bg-green-100 text-green-800";
  if (g.startsWith("B") || g.includes("MEETS") || g === "ME1" || g === "ME2") return "bg-blue-100 text-blue-800";
  if (g.startsWith("C") || g.includes("APPROACHING")) return "bg-yellow-100 text-yellow-800";
  if (g.startsWith("D") || g.startsWith("E") || g.includes("BELOW")) return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-700";
};


const ParentStudentReportCard = () => {
  const { studentId, academicYear, term } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  const fetchReportCard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get(
        `results/report-card/${studentId}/${academicYear}/${encodeURIComponent(term)}/`
      );
      console.log("📄 Report card loaded:", res.data);
      setReport(res.data);
    } catch (err) {
      console.error("❌ Failed:", err.response?.status, err.response?.data || err.message);
      setError(err.response?.data?.detail || "Failed to load report card.");
    } finally {
      setLoading(false);
    }
  }, [studentId, academicYear, term]);


  useEffect(() => { fetchReportCard(); }, [fetchReportCard]);


  if (loading) return <Spinner />;


  if (error) {
    return (
      <div className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 md:p-6">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <i className="bi bi-exclamation-triangle-fill"></i>
            Unable to load Report Card
          </h3>
          <p className="text-sm mt-2">{error}</p>
          <button
            onClick={fetchReportCard}
            className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <i className="bi bi-arrow-clockwise"></i>
            Try Again
          </button>
        </div>
      </div>
    );
  }


  if (!report || !report.student) {
    return (
      <div className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto">
        <div className="bg-white border rounded-xl p-6 sm:p-10 text-center">
          <i className="bi bi-file-earmark-x text-4xl text-gray-400 mb-3"></i>
          <h3 className="font-semibold text-gray-700 text-lg">Report Card Not Found</h3>
          <p className="text-sm text-gray-500 mt-2">No report card available for this student.</p>
          <Link
            to="/parent-dashboard/report-cards/"
            className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors mx-auto"
          >
            <i className="bi bi-arrow-left"></i>
            Back to Report Cards
          </Link>
        </div>
      </div>
    );
  }


  const student = report.student;
  const subjects = Array.isArray(report.subjects) ? report.subjects : [];
  const summary = report.summary || {};


  const totalStudentsInClass = subjects.length > 0 && subjects[0].learners_assessed
    ? subjects[0].learners_assessed
    : null;


  const positionRaw = summary.position;
  let positionDisplay = "—";
  if (positionRaw && totalStudentsInClass) {
    positionDisplay = `${positionRaw}/${totalStudentsInClass}`;
  } else if (positionRaw) {
    positionDisplay = `${positionRaw}`;
  }


  const overallGrade = summary.cbc_code ?? summary.overall_grade ?? summary.grade_name ?? "—";


  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto bg-gray-100 min-h-screen">
      {/* Back Link — Styled Button with Icon */}
      <div className="mb-4">
        <Link
          to="/parent-dashboard/report-cards/"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <i className="bi bi-arrow-left-circle"></i>
          Back to Results
        </Link>
      </div>


      {/* Report Card */}
      <div className="bg-white rounded-2xl shadow-xl border-2 border-green-600 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-700 via-green-600 to-green-700 text-white text-center py-4 md:py-6 px-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-wide flex items-center justify-center gap-2">
            <i className="bi bi-mortarboard"></i>
            LUMA 2000 ACADEMY
          </h1>
          <p className="text-green-100 text-sm md:text-base mt-1">Excellence in CBC Education</p>
          <div className="mt-3 inline-block bg-white/20 rounded-full px-4 md:px-6 py-2 backdrop-blur-sm">
            <span className="font-semibold text-sm flex items-center gap-2 justify-center">
              <i className="bi bi-calendar3"></i>
              {term} • Academic Year {academicYear}
            </span>
          </div>
          <h2 className="text-lg md:text-xl font-bold mt-3 text-yellow-300 flex items-center justify-center gap-2">
            <i className="bi bi-file-earmark-text"></i>
            STUDENT REPORT CARD
          </h2>
        </div>


        {/* Student Info */}
        <div className="p-4 md:p-7 bg-green-50 border-b border-green-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div className="bg-white rounded-lg p-3 shadow-sm border border-green-100">
              <p className="text-xs text-green-600 font-semibold uppercase tracking-wider flex items-center gap-1">
                <i className="bi bi-person"></i>
                Student Name
              </p>
              <p className="font-bold text-gray-800 mt-1">
                {student.name || `${student.first_name || ""} ${student.last_name || ""}`}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-green-100">
              <p className="text-xs text-green-600 font-semibold uppercase tracking-wider flex items-center gap-1">
                <i className="bi bi-card-list"></i>
                Admission No.
              </p>
              <p className="font-bold text-gray-800 mt-1">{student.admission_number || "—"}</p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-green-100">
              <p className="text-xs text-green-600 font-semibold uppercase tracking-wider flex items-center gap-1">
                <i className="bi bi-clipboard-data"></i>
                Assessment No.
              </p>
              <p className="font-bold text-gray-800 mt-1">{student.assessment_number || "—"}</p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-green-100">
              <p className="text-xs text-green-600 font-semibold uppercase tracking-wider flex items-center gap-1">
                <i className="bi bi-building"></i>
                Class / Stream
              </p>
              <p className="font-bold text-gray-800 mt-1">
                {student.classroom_name || student.classroom || `${student.grade || ""} ${student.stream || ""}` || "—"}
              </p>
            </div>
          </div>
        </div>


        {/* Subjects Table */}
        <div className="p-4 md:p-7">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <i className="bi bi-journal-text text-green-600"></i>
            Subject Performance
          </h3>


          {subjects.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 md:p-8 text-center">
              <i className="bi bi-inbox text-yellow-500 text-3xl md:text-4xl mb-3"></i>
              <h4 className="font-semibold text-gray-800">No Results Yet</h4>
              <p className="text-sm text-gray-500 mt-1">
                Results have not been entered or published for {term}.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-green-600 text-white">
                    <th className="text-left py-2 md:py-3 px-2 md:px-3 font-semibold text-xs md:text-sm">#</th>
                    <th className="text-left py-2 md:py-3 px-2 md:px-3 font-semibold text-xs md:text-sm">
                      <i className="bi bi-book me-1"></i> Subject
                    </th>
                    <th className="text-center py-2 md:py-3 px-2 md:px-3 font-semibold text-xs md:text-sm">
                      <i className="bi bi-graph-up me-1"></i> Score
                    </th>
                    <th className="text-center py-2 md:py-3 px-2 md:px-3 font-semibold text-xs md:text-sm">
                      <i className="bi bi-award me-1"></i> Grade
                    </th>
                    <th className="text-left py-2 md:py-3 px-2 md:px-3 font-semibold text-xs md:text-sm hidden sm:table-cell">
                      <i className="bi bi-chat-left-text me-1"></i> Remarks
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {subjects.map((sub, i) => {
                    const score = sub.total_score ?? sub.average_score ?? sub.score ?? "—";
                    const grade = sub.cbc_code ?? sub.grade ?? "—";
                    const remarks = sub.cbc_description ?? sub.teacher_comment ?? sub.remarks ?? "—";
                    return (
                      <tr key={i} className="hover:bg-green-50 transition-colors">
                        <td className="py-2 md:py-3 px-2 md:px-3 font-medium text-gray-500">{i + 1}</td>
                        <td className="py-2 md:py-3 px-2 md:px-3 font-semibold text-gray-800 text-sm">
                          {sub.subject || "—"}
                        </td>
                        <td className="py-2 md:py-3 px-2 md:px-3 text-center font-bold text-gray-800">
                          {score}{score !== "—" ? "%" : ""}
                        </td>
                        <td className="py-2 md:py-3 px-2 md:px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${getGradeStyle(grade)}`}>
                            {grade}
                          </span>
                        </td>
                        <td className="py-2 md:py-3 px-2 md:px-3 text-gray-600 text-xs hidden sm:table-cell">
                          {remarks}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>


        {/* Summary */}
        <div className="p-4 md:p-7 bg-gradient-to-r from-green-50 to-blue-50 border-t border-green-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <i className="bi bi-bar-chart text-blue-600"></i>
            Overall Performance Summary
          </h3>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="bg-white rounded-xl p-3 md:p-4 text-center shadow-sm border border-green-100">
              <p className="text-xs text-green-600 font-semibold uppercase flex items-center justify-center gap-1">
                <i className="bi bi-calculator"></i>
                Average Score
              </p>
              <p className="text-xl md:text-2xl font-extrabold text-gray-800 mt-1">
                {summary.average_marks ?? summary.average_score ?? "—"}%
              </p>
            </div>
            <div className="bg-white rounded-xl p-3 md:p-4 text-center shadow-sm border border-blue-100">
              <p className="text-xs text-blue-600 font-semibold uppercase flex items-center justify-center gap-1">
                <i className="bi bi-star"></i>
                Overall Grade
              </p>
              <p className="text-xl md:text-2xl font-extrabold text-blue-700 mt-1">
                {overallGrade}
              </p>
            </div>
            <div className="bg-white rounded-xl p-3 md:p-4 text-center shadow-sm border border-yellow-100">
              <p className="text-xs text-yellow-600 font-semibold uppercase flex items-center justify-center gap-1">
                <i className="bi bi-trophy"></i>
                Position
              </p>
              <p className="text-xl md:text-2xl font-extrabold text-yellow-700 mt-1">
                {positionDisplay}
              </p>
            </div>
            <div className="bg-white rounded-xl p-3 md:p-4 text-center shadow-sm border border-gray-200">
              <p className="text-xs text-gray-600 font-semibold uppercase flex items-center justify-center gap-1">
                <i className="bi bi-bookmarks"></i>
                Subjects
              </p>
              <p className="text-xl md:text-2xl font-extrabold text-gray-700 mt-1">
                {summary.total_subjects ?? subjects.length}
              </p>
            </div>
          </div>
        </div>


        {/* Signatures */}
        <div className="p-4 md:p-7 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-3 md:gap-4 text-center">
            <div>
              <div className="border-b-2 border-dashed border-gray-300 h-10 md:h-12 mb-2"></div>
              <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                <i className="bi bi-person-badge"></i>
                Class Teacher
              </p>
            </div>
            <div>
              <div className="border-b-2 border-dashed border-gray-300 h-10 md:h-12 mb-2"></div>
              <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                <i className="bi bi-person-check"></i>
                Academic Coordinator
              </p>
            </div>
            <div>
              <div className="border-b-2 border-dashed border-gray-300 h-10 md:h-12 mb-2"></div>
              <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                <i className="bi bi-person-star"></i>
                Head Teacher
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center mt-4 md:mt-6 italic flex items-center justify-center gap-1">
            <i className="bi bi-shield-check"></i>
            Report generated by Luma 2000 Academy • CBC System
          </p>
        </div>
      </div>
    </div>
  );
};


export default ParentStudentReportCard;