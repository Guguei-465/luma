import React, { useEffect, useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";

const CoordinatorExams = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);
      const res = await api.get("exams/");
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setExams(data);
    } catch (err) {
      console.error("Failed to load exams:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  const filteredExams = exams.filter((exam) => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;
    return (
      (exam.subject_name?.toLowerCase() || "").includes(search) ||
      (exam.classroom_name?.toLowerCase() || "").includes(search) ||
      (exam.exam_type?.toLowerCase() || "").includes(search) ||
      (exam.term?.toLowerCase() || "").includes(search) ||
      String(exam.academic_year || "").includes(search)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-lg text-gray-500">Loading exams...</p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-6 sm:space-y-8">
      {/* Header — Responsive */}
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Manage Exams</h1>
        <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">View and manage scheduled examinations</p>
      </div>

      {/* Search — Full width on all screens */}
      <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 border border-gray-100">
        <input
          type="text"
          placeholder="Search by subject, class, exam type, term or year..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base"
        />
      </div>

      {/* Stats — Responsive grid */}
      <div className="grid gap-3 sm:gap-5 grid-cols-1 sm:grid-cols-3">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Total Exams</p>
          <p className="text-xl sm:text-2xl font-bold mt-1">{exams.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">Total Subjects</p>
          <p className="text-xl sm:text-2xl font-bold mt-1">
            {new Set(exams.map((e) => e.subject)).size}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 border-l-4 border-amber-500">
          <p className="text-sm text-gray-500">Total Classes</p>
          <p className="text-xl sm:text-2xl font-bold mt-1">
            {new Set(exams.map((e) => e.classroom)).size}
          </p>
        </div>
      </div>

      {/* Exam Cards — Responsive grid */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredExams.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-6 sm:p-10 border border-gray-100 text-center text-gray-500 col-span-full">
            No exams found.
          </div>
        ) : (
          filteredExams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
                {exam.exam_type}
              </h3>
              <div className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-5 text-gray-600 text-sm sm:text-base">
                <p><span className="font-medium">Subject:</span> {exam.subject_name || "—"}</p>
                <p><span className="font-medium">Class:</span> {exam.classroom_name || "—"}</p>
                <p><span className="font-medium">Term:</span> {exam.term || "—"}</p>
                <p><span className="font-medium">Academic Year:</span> {exam.academic_year || "—"}</p>
                <p><span className="font-medium">Exam Date:</span> {exam.exam_date || "—"}</p>
                <p><span className="font-medium">Total Marks:</span> {exam.total_marks || "—"}</p>
              </div>
              <button
                onClick={() => navigate(`/academic-coordinator/exams/${exam.id}`)}
                className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                View Exam Details
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CoordinatorExams;