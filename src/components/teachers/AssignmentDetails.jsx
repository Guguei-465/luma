import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import api from "../api/api";

const Spinner = () => (
  <div className="flex justify-center items-center py-16">
    <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-green-600"></div>
  </div>
);

const AssignmentDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // ✅ FIRST: Use data passed from the list page (if available)
    if (location.state?.assignment) {
      console.log("✅ Using data from list:", location.state.assignment);
      setAssignment(location.state.assignment);
      setLoading(false);
      return;
    }

    // ✅ FALLBACK: Fetch from list and find matching ID
    const findAssignment = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get("assignments/");
        const found = res.data?.find(a => String(a.id) === String(id));
        if (found) {
          console.log("✅ Found assignment from list:", found);
          setAssignment(found);
        } else {
          setError("Assignment not found.");
        }
      } catch (err) {
        console.error("❌ Error:", err.response?.data || err.message);
        setError("Could not load assignment.");
      } finally {
        setLoading(false);
      }
    };

    findAssignment();
  }, [id, location.state]);

  if (loading) return <Spinner />;

  if (error || !assignment) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          {error || "Assignment not found."}
        </div>
      </div>
    );
  }

  // ✅ Use EXACT field names from your API response
  const subjectName = assignment.subject_name || "—";
  const className = assignment.classroom_name || "—";
  const streamName = assignment.stream;
  const teacherName = assignment.teacher_name || `${assignment.teacher_first_name || ""} ${assignment.teacher_last_name || ""}`.trim();
  const isClassTeacher = assignment.is_class_teacher;
  const term = assignment.term || "—";
  const academicYear = assignment.academic_year || "—";

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="font-bold text-xl text-gray-800">{subjectName}</h2>
          <p className="text-gray-500 text-sm mt-1">
            {className}
            {streamName && ` • ${streamName}`}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            {teacherName} • {term} • {academicYear}
          </p>
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${
              isClassTeacher
                ? "bg-green-100 text-green-800"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {isClassTeacher ? "Class Teacher" : "Subject Teacher"}
          </span>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <i className="bi bi-person-badge text-blue-600 text-2xl"></i>
          <h3 className="font-bold text-lg mt-2">{teacherName}</h3>
          <span className="text-xs text-gray-500">Assigned Teacher</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <i className="bi bi-calendar-event text-green-600 text-2xl"></i>
          <h3 className="font-bold text-lg mt-2">{term}</h3>
          <span className="text-xs text-gray-500">Current Term</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <i className="bi bi-book-half text-yellow-600 text-2xl"></i>
          <h3 className="font-bold text-lg mt-2">{academicYear}</h3>
          <span className="text-xs text-gray-500">Academic Year</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <i className="bi bi-calendar-check text-blue-500 text-2xl"></i>
          <h5 className="font-bold text-lg mt-2">
            {assignment.assigned_date || "—"}
          </h5>
          <span className="text-xs text-gray-500">Assigned Date</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <i className="bi bi-people text-blue-600 text-3xl"></i>
          <h5 className="mt-2 font-bold text-sm">Students</h5>
          <p className="text-gray-500 text-xs mt-1">View class list</p>
          <Link
            to={`/teacher/students`}
            className="block mt-3 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-blue-700 transition"
          >
            Open
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <i className="bi bi-journal-plus text-green-600 text-3xl"></i>
          <h5 className="mt-2 font-bold text-sm">Assessments</h5>
          <p className="text-gray-500 text-xs mt-1">Create & manage</p>
          <Link
            to="/teacher/assessments"
            className="block mt-3 bg-green-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-green-700 transition"
          >
            Open
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
          <i className="bi bi-bar-chart-line text-blue-400 text-3xl"></i>
          <h5 className="mt-2 font-bold text-sm">Results</h5>
          <p className="text-gray-500 text-xs mt-1">Submit marks</p>
          <Link
            to="/teacher/results"
            className="block mt-3 bg-blue-400 text-white rounded-lg px-4 py-2 text-sm hover:bg-blue-500 transition"
          >
            Open
          </Link>
        </div>

        {isClassTeacher && (
          <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
            <i className="bi bi-calendar-check text-yellow-500 text-3xl"></i>
            <h5 className="mt-2 font-bold text-sm">Attendance</h5>
            <p className="text-gray-500 text-xs mt-1">Record attendance</p>
            <Link
              to="/teacher/attendance"
              className="block mt-3 bg-yellow-500 text-white rounded-lg px-4 py-2 text-sm hover:bg-yellow-600 transition"
            >
              Open
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentDetails;