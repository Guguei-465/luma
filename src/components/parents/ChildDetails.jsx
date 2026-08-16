import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
// CHILD DETAILS
// =====================================================

const ChildDetails = () => {
  const params = useParams();
  const navigate = useNavigate();

  // Supports :id, :studentId or :pk
  const studentId =
    params.studentId ||
    params.id ||
    params.pk;

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // FETCH CHILD
  // =====================================================

  const fetchStudent = useCallback(async () => {
    if (!studentId) {
      console.error(
        "Student ID is missing from URL:",
        params
      );

      setError("Student ID is missing from the URL.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      console.log("Fetching child:", studentId);

      const { data } = await api.get(
        `dashboard/parent/children/${studentId}/`
      );

      console.log("Child details:", data);

      setStudent(data);
    } catch (err) {
      console.error("Failed to load student:", err);

      if (err.response?.status === 404) {
        setError(
          "Student not found or this student is not linked to your parent account."
        );
      } else if (err.response?.status === 401) {
        setError(
          "Your session has expired. Please login again."
        );
      } else {
        setError("Failed to load student details.");
      }

      setStudent(null);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  // =====================================================
  // LOAD CHILD
  // =====================================================

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return <Spinner />;
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">

          <div className="text-red-500 text-4xl mb-3">
          </div>

          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Unable to Load Child
          </h3>

          <p className="text-red-600 mb-5">
            {error}
          </p>

          <div className="flex justify-center gap-3">

            <button
              onClick={fetchStudent}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Try Again
            </button>

            <button
              onClick={() =>
                navigate("/parent-dashboard/my-children")
              }
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Back to My Children
            </button>

          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // NO STUDENT
  // =====================================================

  if (!student) {
    return (
      <div className="text-center py-10">

        <p className="text-gray-500 mb-4">
          Student not found.
        </p>

      </div>
    );
  }

  // =====================================================
  // VALUES
  // =====================================================

  const fullName = `
    ${student.first_name || ""}
    ${student.last_name || ""}
  `.trim();

  const classroom = [
    student.grade,
    student.stream,
  ]
    .filter(Boolean)
    .join(" ");

  

  return (
    <div className="p-4 md:p-6">

      {/* =================================================
          BACK BUTTON
      ================================================= */}

      <div className="mb-5">

        <button
          onClick={() =>
            navigate("/parent-dashboard/my-children")
          }
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition shadow-sm"
        >
          <span>
            Back to My Children
          </span>
        </button>

      </div>

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          {/* CHILD INFORMATION */}

          <div className="flex items-center gap-4">

            <UserAvatar
              user={{
                username: fullName,
                profile_picture: student.photo,
              }}
              size={60}
            />

            <div>

              <h3 className="text-xl font-bold text-gray-800">
                {fullName}
              </h3>

              <p className="text-gray-500 text-sm">
                {classroom || "Class not assigned"}
              </p>

              <p className="text-gray-500 text-sm">
                Admission No:{" "}
                <span className="font-medium text-gray-700">
                  {student.admission_number || "-"}
                </span>
              </p>

            </div>

          </div>

          {/* STATUS */}

          <span
            className={`inline-flex w-fit px-3 py-1 rounded-full text-xs font-semibold ${
              student.status === "Active"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {student.status || "Unknown"}
          </span>

        </div>

        {/* =================================================
            NAVIGATION BUTTONS
        ================================================= */}

        <div className="flex flex-wrap gap-2 border-b border-gray-200 mt-6 pb-2">

          {/* OVERVIEW */}

          
        </div>

      </div>

      {/* =================================================
          OVERVIEW
      ================================================= */}

      <div className="space-y-6">

        {/* =================================================
            SUMMARY CARDS
        ================================================= */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* ATTENDANCE */}

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">

            <p className="text-sm text-gray-500">
              Attendance
            </p>

            <p className="text-2xl font-bold text-green-600 mt-1">
              {student.attendance_percentage ?? 0}%
            </p>

            

          </div>

          {/* FEES */}

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">

            <p className="text-sm text-gray-500">
              Fee Balance
            </p>

            <p className="text-2xl font-bold text-red-600 mt-1">
              KES{" "}
              {Number(
                student.fee_balance || 0
              ).toLocaleString()}
            </p>

           
           

          </div>

          {/* GRADE */}

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">

            <p className="text-sm text-gray-500">
              Latest Grade
            </p>

            <p className="text-2xl font-bold text-blue-600 mt-1">
              {student.latest_grade || "-"}
            </p>

           
           

          </div>

          {/* TEACHER */}

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">

            <p className="text-sm text-gray-500">
              Class Teacher
            </p>

            <p className="font-semibold text-gray-800 mt-1">
              {student.class_teacher || "Not assigned"}
            </p>

            {student.teacher_phone && (
              <p className="text-xs text-gray-500 mt-1">
                {student.teacher_phone}
              </p>
            )}

          </div>

        </div>

        {/* =================================================
            STUDENT INFORMATION
        ================================================= */}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">

          <h3 className="text-lg font-semibold text-gray-800 mb-5">
            Student Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div>
              <p className="text-xs text-gray-500 uppercase">
                First Name
              </p>
              <p className="font-medium">
                {student.first_name || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase">
                Last Name
              </p>
              <p className="font-medium">
                {student.last_name || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase">
                Gender
              </p>
              <p className="font-medium">
                {student.gender || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase">
                Date of Birth
              </p>
              <p className="font-medium">
                {student.date_of_birth || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase">
                Admission Number
              </p>
              <p className="font-medium">
                {student.admission_number || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase">
                Assessment Number
              </p>
              <p className="font-medium">
                {student.assessment_number || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase">
                Grade
              </p>
              <p className="font-medium">
                {student.grade || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase">
                Stream
              </p>
              <p className="font-medium">
                {student.stream || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase">
                Date Admitted
              </p>
              <p className="font-medium">
                {student.date_admitted || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase">
                Parent Relationship
              </p>
              <p className="font-medium">
                {student.relationship || "-"}
              </p>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};

export default ChildDetails;