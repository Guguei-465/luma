import React, { useEffect, useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";

const CoordinatorExams = () => {
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // =====================================================
  // LOAD EXAMS
  // =====================================================

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);

      const res = await api.get("exams/");

      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.results || [];

      setExams(data);
    } catch (err) {
      console.error(
        "Failed to load exams:",
        err.response?.data || err
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FILTER
  // =====================================================

  const filteredExams = exams.filter((exam) => {
    const search =
      searchTerm.toLowerCase().trim();

    if (!search) return true;

    return (
      exam.subject_name
        ?.toLowerCase()
        .includes(search) ||

      exam.classroom_name
        ?.toLowerCase()
        .includes(search) ||

      exam.exam_type
        ?.toLowerCase()
        .includes(search) ||

      exam.term
        ?.toLowerCase()
        .includes(search) ||

      String(
        exam.academic_year || ""
      ).includes(search)
    );
  });

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-lg text-gray-500">
          Loading exams...
        </p>
      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-[clamp(1.5rem,3vw,2.2rem)] font-bold text-gray-800">
          Manage Exams
        </h1>

        <p className="text-gray-500 mt-2">
          View and manage scheduled examinations
        </p>
      </div>

      {/* SEARCH */}
      <div className="card">

        <input
          type="text"
          placeholder="Search by subject, class, exam type, term or year..."
          className="milk-input max-w-md"
          value={searchTerm}
          onChange={(e) =>
            setSearchTerm(e.target.value)
          }
        />

      </div>

      {/* STATS */}
      <div className="grid gap-5 sm:grid-cols-3">

        <div className="stat-card py-5">
          <p className="text-gray-700 font-medium">
            Total Exams
          </p>

          <p className="stat-value">
            {exams.length}
          </p>
        </div>

        <div className="stat-card py-5">
          <p className="text-gray-700 font-medium">
            Total Subjects
          </p>

          <p className="stat-value">
            {
              new Set(
                exams.map((exam) =>
                  exam.subject
                )
              ).size
            }
          </p>
        </div>

        <div className="stat-card py-5">
          <p className="text-gray-700 font-medium">
            Total Classes
          </p>

          <p className="stat-value">
            {
              new Set(
                exams.map((exam) =>
                  exam.classroom
                )
              ).size
            }
          </p>
        </div>

      </div>

      {/* EXAMS */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

        {filteredExams.length === 0 ? (
          <div className="card col-span-full text-center text-gray-500 py-10">
            No exams found.
          </div>
        ) : (
          filteredExams.map((exam) => (

            <div
              key={exam.id}
              className="card hover:shadow-lg transition-shadow"
            >

              {/* EXAM TYPE */}
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                {exam.exam_type}
              </h3>

              <div className="space-y-2 mb-5 text-gray-600">

                <p>
                  <span className="font-medium">
                    Subject:
                  </span>{" "}
                  {exam.subject_name || "-"}
                </p>

                <p>
                  <span className="font-medium">
                    Class:
                  </span>{" "}
                  {exam.classroom_name || "-"}
                </p>

                <p>
                  <span className="font-medium">
                    Term:
                  </span>{" "}
                  {exam.term || "-"}
                </p>

                <p>
                  <span className="font-medium">
                    Academic Year:
                  </span>{" "}
                  {exam.academic_year || "-"}
                </p>

                <p>
                  <span className="font-medium">
                    Exam Date:
                  </span>{" "}
                  {exam.exam_date || "-"}
                </p>

                <p>
                  <span className="font-medium">
                    Total Marks:
                  </span>{" "}
                  {exam.total_marks || "-"}
                </p>

              </div>

              <button
                onClick={() =>
                  navigate(
                    `/academic-coordinator/exams/${exam.id}`
                  )
                }
                className="milk-btn w-full"
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