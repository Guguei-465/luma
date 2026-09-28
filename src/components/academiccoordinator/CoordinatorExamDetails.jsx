import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

const Spinner = () => (
  <div className="flex items-center justify-center h-96">
    <p className="text-lg text-gray-500">Loading exam details...</p>
  </div>
);

const CoordinatorExamDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadExam = async () => {
      try {
        setLoading(true);
        const res = await api.get(`exams/${id}/`);
        setExam(res.data);
      } catch (err) {
        console.error("Failed to load exam:", err.response?.data || err);
        setExam(null);
      } finally {
        setLoading(false);
      }
    };
    loadExam();
  }, [id]);

  if (loading) return <Spinner />;

  if (!exam) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-10 border border-gray-100 text-center">
        <p className="text-red-500 text-lg">Exam not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          ← Back to Exams
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{exam.exam_type}</h1>
          <p className="text-gray-500 mt-2">
            {exam.subject_name || "Subject"} • {exam.classroom_name || "Class"} • {exam.term}
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
        >
          ← Back to Exams
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border-t-4 border-green-500">
          <p className="text-sm text-gray-500">Exam Type</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{exam.exam_type}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-t-4 border-blue-500">
          <p className="text-sm text-gray-500">Term</p>
          <p className="text-2xl font-bold mt-1">{exam.term}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-t-4 border-amber-500">
          <p className="text-sm text-gray-500">Academic Year</p>
          <p className="text-2xl font-bold mt-1">{exam.academic_year}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-t-4 border-purple-500">
          <p className="text-sm text-gray-500">Total Marks</p>
          <p className="text-2xl font-bold mt-1">{exam.total_marks}</p>
        </div>
      </div>

      {/* Exam Info */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Exam Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { label: "Subject", value: exam.subject_name },
            { label: "Classroom", value: exam.classroom_name },
            { label: "Exam Type", value: exam.exam_type },
            { label: "Term", value: exam.term },
            { label: "Academic Year", value: exam.academic_year },
            { label: "Exam Date", value: exam.exam_date },
            { label: "Total Marks", value: exam.total_marks },
            { label: "Exam ID", value: `#${exam.id}` },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="font-semibold text-gray-800 mt-1">{value || "—"}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="font-semibold text-lg mb-3">Results</h3>
          <p className="text-gray-500 mb-4">View and manage student results for this examination.</p>
          <button
            onClick={() => navigate(`/academic-coordinator/results?exam=${exam.id}`)}
            className="w-full px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            View Exam Results
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="font-semibold text-lg mb-3">Exam Management</h3>
          <p className="text-gray-500 mb-4">Return to the exam list to manage other examinations.</p>
          <button
            onClick={() => navigate("/academic-coordinator/exams")}
            className="w-full px-5 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Manage Exams
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorExamDetails;