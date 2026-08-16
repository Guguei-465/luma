import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

const CoordinatorExamDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);

  // =====================================================
  // LOAD EXAM
  // =====================================================

  useEffect(() => {
    const loadExam = async () => {
      try {
        setLoading(true);

        const res = await api.get(
          `exams/${id}/`
        );

        setExam(res.data);
      } catch (err) {
        console.error(
          "Failed to load exam:",
          err.response?.data || err
        );

        setExam(null);
      } finally {
        setLoading(false);
      }
    };

    loadExam();
  }, [id]);

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-lg text-gray-500">
          Loading exam details...
        </p>
      </div>
    );
  }

  // =====================================================
  // NOT FOUND
  // =====================================================

  if (!exam) {
    return (
      <div className="card text-center py-10">

        <p className="text-red-500 text-lg">
          Exam not found.
        </p>

        <button
          onClick={() => navigate(-1)}
          className="milk-btn mt-4"
        >
          ← Back to Exams
        </button>

      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>

          <h1 className="text-[clamp(1.5rem,3vw,2.2rem)] font-bold text-gray-800">
            {exam.exam_type}
          </h1>

          <p className="text-gray-500 mt-2">
            {exam.subject_name || "Subject"}{" "}
            •{" "}
            {exam.classroom_name || "Class"}{" "}
            •{" "}
            {exam.term}
          </p>

        </div>

        <button
          onClick={() => navigate(-1)}
          className="milk-btn w-fit"
        >
          ← Back to Exams
        </button>

      </div>

      {/* EXAM OVERVIEW */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

        <div className="stat-card py-5">

          <p className="text-gray-700 font-medium">
            Exam Type
          </p>

          <p className="stat-value mt-1 text-green-600">
            {exam.exam_type}
          </p>

        </div>

        <div className="stat-card py-5">

          <p className="text-gray-700 font-medium">
            Term
          </p>

          <p className="stat-value mt-1">
            {exam.term}
          </p>

        </div>

        <div className="stat-card py-5">

          <p className="text-gray-700 font-medium">
            Academic Year
          </p>

          <p className="stat-value mt-1">
            {exam.academic_year}
          </p>

        </div>

        <div className="stat-card py-5">

          <p className="text-gray-700 font-medium">
            Total Marks
          </p>

          <p className="stat-value mt-1">
            {exam.total_marks}
          </p>

        </div>

      </div>

      {/* EXAM INFORMATION */}
      <div className="card">

        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          Exam Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* SUBJECT */}
          <div>
            <p className="text-sm text-gray-500">
              Subject
            </p>

            <p className="font-semibold text-gray-800 mt-1">
              {exam.subject_name || "-"}
            </p>
          </div>

          {/* CLASS */}
          <div>
            <p className="text-sm text-gray-500">
              Classroom
            </p>

            <p className="font-semibold text-gray-800 mt-1">
              {exam.classroom_name || "-"}
            </p>
          </div>

          {/* EXAM TYPE */}
          <div>
            <p className="text-sm text-gray-500">
              Exam Type
            </p>

            <p className="font-semibold text-gray-800 mt-1">
              {exam.exam_type || "-"}
            </p>
          </div>

          {/* TERM */}
          <div>
            <p className="text-sm text-gray-500">
              Term
            </p>

            <p className="font-semibold text-gray-800 mt-1">
              {exam.term || "-"}
            </p>
          </div>

          {/* YEAR */}
          <div>
            <p className="text-sm text-gray-500">
              Academic Year
            </p>

            <p className="font-semibold text-gray-800 mt-1">
              {exam.academic_year || "-"}
            </p>
          </div>

          {/* DATE */}
          <div>
            <p className="text-sm text-gray-500">
              Exam Date
            </p>

            <p className="font-semibold text-gray-800 mt-1">
              {exam.exam_date || "-"}
            </p>
          </div>

          {/* TOTAL */}
          <div>
            <p className="text-sm text-gray-500">
              Total Marks
            </p>

            <p className="font-semibold text-gray-800 mt-1">
              {exam.total_marks || "-"}
            </p>
          </div>

          {/* ID */}
          <div>
            <p className="text-sm text-gray-500">
              Exam ID
            </p>

            <p className="font-semibold text-gray-800 mt-1">
              #{exam.id}
            </p>
          </div>

        </div>

      </div>

      {/* QUICK ACTIONS */}
      <div className="grid md:grid-cols-2 gap-6">

        <div className="card">

          <h3 className="font-semibold text-lg mb-3">
            Results
          </h3>

          <p className="text-gray-500 mb-4">
            View and manage student results for
            this examination.
          </p>

          <button
            onClick={() =>
              navigate(
                `/academic-coordinator/results?exam=${exam.id}`
              )
            }
            className="milk-btn w-full"
          >
            View Exam Results
          </button>

        </div>

        <div className="card">

          <h3 className="font-semibold text-lg mb-3">
            Exam Management
          </h3>

          <p className="text-gray-500 mb-4">
            Return to the exam list to manage
            other examinations.
          </p>

          <button
            onClick={() =>
              navigate(
                "/academic-coordinator/exams"
              )
            }
            className="milk-btn w-full"
          >
            Manage Exams
          </button>

        </div>

      </div>

    </div>
  );
};

export default CoordinatorExamDetails;