import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

const CoordinatorStudentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // LOAD STUDENT
  // =====================================================

  useEffect(() => {
    if (!id) {
      setError("Student ID is missing.");
      setLoading(false);
      return;
    }

    loadStudent();
  }, [id]);

  const loadStudent = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(`students/${id}/`);

      console.log("STUDENT DETAILS:", response.data);

      setStudent(response.data);
    } catch (err) {
      console.error("Failed to load student:", err);

      if (err?.response?.status === 404) {
        setError("Student record was not found.");
      } else {
        setError(
          err?.response?.data?.detail ||
            "Failed to load student profile."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // HELPERS
  // =====================================================

  const getStudentName = () => {
    if (!student) return "Student";

    return `${student.first_name || ""} ${
      student.last_name || ""
    }`.trim() || "Unnamed Student";
  };

  const getClassName = () => {
    if (!student?.classroom) {
      return "Unassigned";
    }

    return student.classroom_name || "Unassigned";
  };

  const formatDate = (value) => {
    if (!value) return "—";

    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return value;
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">

          <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-green-600 mx-auto mb-4"></div>

          <p className="text-lg text-gray-500">
            Loading student profile...
          </p>

        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error || !student) {
    return (
      <div className="card text-center py-12">

        <div className="text-red-500 text-5xl mb-4">
          ⚠️
        </div>

        <p className="text-red-600 text-lg font-medium">
          {error || "Student record not found."}
        </p>

        <div className="flex justify-center gap-3 mt-6">

          <button
            type="button"
            onClick={() =>
              navigate("/academic-coordinator/students")
            }
            className="milk-btn"
          >
            ← Back to Students
          </button>

          <button
            type="button"
            onClick={loadStudent}
            className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Try Again
          </button>

        </div>

      </div>
    );
  }

  const studentName = getStudentName();

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="space-y-8">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

        <div>

          <h1 className="text-[clamp(1.5rem,3vw,2.2rem)] font-bold text-gray-800">
            {studentName}
          </h1>

          <p className="text-gray-500 mt-2">
            Admission No:{" "}
            <span className="font-medium text-gray-700">
              {student.admission_number || "Not Assigned"}
            </span>
          </p>

        </div>

        <div className="flex gap-3">

          <button
            type="button"
            onClick={loadStudent}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            🔄 Refresh
          </button>

          <button
            type="button"
            onClick={() =>
              navigate("/academic-coordinator/students")
            }
            className="milk-btn"
          >
            ← Back to Students
          </button>

        </div>

      </div>


      {/* =================================================
          STUDENT OVERVIEW
      ================================================= */}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

        {/* CURRENT CLASS */}

        <div className="stat-card py-5">

          <p className="text-gray-700 font-medium">
            Current Class
          </p>

          <p className="stat-value text-lg mt-2">
            {getClassName()}
          </p>

        </div>


        {/* ASSESSMENT NUMBER */}

        <div className="stat-card py-5">

          <p className="text-gray-700 font-medium">
            Assessment No.
          </p>

          <p className="stat-value text-lg mt-2">
            {student.assessment_number || "—"}
          </p>

        </div>


        {/* STATUS */}

        <div className="stat-card py-5">

          <p className="text-gray-700 font-medium">
            Status
          </p>

          <p
            className={`stat-value text-lg mt-2 ${
              student.status === "Active"
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {student.status || "—"}
          </p>

        </div>


        {/* GENDER */}

        <div className="stat-card py-5">

          <p className="text-gray-700 font-medium">
            Gender
          </p>

          <p className="stat-value text-lg mt-2">
            {student.gender || "—"}
          </p>

        </div>

      </div>


      {/* =================================================
          PERSONAL INFORMATION
      ================================================= */}

      <div className="card">

        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          Personal Information
        </h2>

        <div className="grid md:grid-cols-2 gap-8">

          {/* LEFT */}

          <div className="space-y-4">

            <p>
              <span className="font-medium text-gray-600">
                Full Name:
              </span>{" "}
              {studentName}
            </p>

            <p>
              <span className="font-medium text-gray-600">
                Admission Number:
              </span>{" "}
              {student.admission_number || "—"}
            </p>

            <p>
              <span className="font-medium text-gray-600">
                Assessment Number:
              </span>{" "}
              {student.assessment_number || "—"}
            </p>

            <p>
              <span className="font-medium text-gray-600">
                Gender:
              </span>{" "}
              {student.gender || "—"}
            </p>

            <p>
              <span className="font-medium text-gray-600">
                Date of Birth:
              </span>{" "}
              {formatDate(student.date_of_birth)}
            </p>

          </div>


          {/* RIGHT */}

          <div className="space-y-4">

            <p>
              <span className="font-medium text-gray-600">
                Parent / Guardian:
              </span>{" "}
              {student.parent_name || "—"}
            </p>

            <p>
              <span className="font-medium text-gray-600">
                Current Class:
              </span>{" "}
              {student.classroom_name || "Unassigned"}
            </p>

            <p>
              <span className="font-medium text-gray-600">
                Class Teacher:
              </span>{" "}
              {student.class_teacher || "Not Assigned"}
            </p>

            <p>
              <span className="font-medium text-gray-600">
                Enrollment Date:
              </span>{" "}
              {formatDate(student.date_admitted)}
            </p>

            <p>
              <span className="font-medium text-gray-600">
                Date Left:
              </span>{" "}
              {formatDate(student.date_left)}
            </p>

          </div>

        </div>

      </div>


      {/* =================================================
          ACADEMIC RESULTS
      ================================================= */}

      <div className="card">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

          <div>

            <h2 className="text-xl font-semibold text-gray-800">
              Academic Results
            </h2>

            <p className="text-gray-500 text-sm mt-1">
              Academic results and assessment records for{" "}
              {studentName}.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              navigate(
                `/academic-coordinator/student-results/${id}`
              )
            }
            className="milk-btn w-fit"
          >
            View All Results
          </button>

        </div>

        <div className="bg-gray-50 rounded-lg p-6 text-center">

          <p className="text-gray-500">
            View this student's complete academic
            assessments and results.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                `/academic-coordinator/student-results/${id}`
              )
            }
            className="milk-btn mt-4"
          >
            Open Academic Results
          </button>

        </div>

      </div>


      {/* =================================================
          QUICK ACADEMIC ACTIONS
      ================================================= */}

      <div>

        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Student Academic Actions
        </h2>

        <div className="grid md:grid-cols-3 gap-6">


          {/* RESULTS */}

          <div className="card">

            <div className="flex items-center gap-3 mb-3">

              <div className="w-11 h-11 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">
                <i className="bi bi-journal-check text-xl"></i>
              </div>

              <h3 className="font-semibold text-lg">
                Academic Results
              </h3>

            </div>

            <p className="text-gray-500 mb-4">
              View assessments, examinations,
              scores and grades.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  `/academic-coordinator/student-results/${id}`
                )
              }
              className="milk-btn w-full"
            >
              View Results
            </button>

          </div>


          {/* ATTENDANCE */}

          <div className="card">

            <div className="flex items-center gap-3 mb-3">

              <div className="w-11 h-11 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <i className="bi bi-calendar-check text-xl"></i>
              </div>

              <h3 className="font-semibold text-lg">
                Attendance
              </h3>

            </div>

            <p className="text-gray-500 mb-4">
              Review this student's attendance
              records.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  `/academic-coordinator/attendance/student/${id}`
                )
              }
              className="milk-btn w-full"
            >
              View Attendance
            </button>

          </div>


          {/* REPORT */}

          <div className="card">

            <div className="flex items-center gap-3 mb-3">

              <div className="w-11 h-11 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <i className="bi bi-file-earmark-pdf text-xl"></i>
              </div>

              <h3 className="font-semibold text-lg">
                Academic Report
              </h3>

            </div>

            <p className="text-gray-500 mb-4">
              Generate a complete academic progress
              report for this student.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  `/academic-coordinator/reports/student-progress/${id}`
                )
              }
              className="milk-btn w-full"
            >
              Generate Report
            </button>

          </div>

        </div>

      </div>


      {/* =================================================
          BOTTOM NAVIGATION
      ================================================= */}

      <div className="flex flex-wrap gap-3">

        <button
          type="button"
          onClick={() =>
            navigate(
              "/academic-coordinator/students"
            )
          }
          className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          ← Back to Students
        </button>

        <button
          type="button"
          onClick={() =>
            navigate(
              "/academic-coordinator/dashboard"
            )
          }
          className="px-5 py-2 border border-green-300 rounded-lg text-green-700 hover:bg-green-50"
        >
          Dashboard
        </button>

      </div>

    </div>
  );
};

export default CoordinatorStudentDetails;