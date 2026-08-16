import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";

const StudentResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(id || "");
  const [selectedStudentData, setSelectedStudentData] = useState(null);

  const [results, setResults] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // LOAD STUDENTS
  // =====================================================

  useEffect(() => {
    loadStudents();
  }, []);

  // =====================================================
  // LOAD RESULTS WHEN URL ID CHANGES
  // =====================================================

  useEffect(() => {
    if (id) {
      setSelectedStudent(String(id));
      loadStudentResults(id);
    } else {
      setSelectedStudent("");
      setSelectedStudentData(null);
      setResults([]);
    }
  }, [id]);

  // =====================================================
  // LOAD ALL STUDENTS
  // =====================================================

  const loadStudents = async () => {
    try {
      const response = await api.get("students/");

      const data =
        response.data?.results ||
        response.data ||
        [];

      setStudents(data);

      // Find selected student
      if (id) {
        const found = data.find(
          (student) =>
            String(student.id) === String(id)
        );

        if (found) {
          setSelectedStudentData(found);
        }
      }
    } catch (error) {
      console.error(
        "Failed to load students:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD STUDENT RESULTS
  // =====================================================

  const loadStudentResults = async (studentId) => {
    if (!studentId) {
      setResults([]);
      return;
    }

    setLoadingResults(true);
    setError("");

    try {
      // -------------------------------------------------
      // GET STUDENT INFORMATION
      // -------------------------------------------------

      const studentResponse = await api.get(
        `students/${studentId}/`
      );

      const studentData = studentResponse.data;

      setSelectedStudentData(studentData);

      // -------------------------------------------------
      // GET ACTUAL RESULTS
      // -------------------------------------------------
      //
      // Correct endpoint from results/urls.py:
      //
      // /api/results/student-results/
      //
      // Filter by student ID.
      // -------------------------------------------------

      const resultsResponse = await api.get(
        "results/student-results/",
        {
          params: {
            student: studentId,
          },
        }
      );

      console.log(
        "STUDENT RESULTS RESPONSE:",
        resultsResponse.data
      );

      const resultData =
        resultsResponse.data?.results ||
        resultsResponse.data ||
        [];

      setResults(
        Array.isArray(resultData)
          ? resultData
          : []
      );

    } catch (error) {
      console.error(
        "Failed to load student results:",
        error
      );

      console.error(
        "RESULT ERROR RESPONSE:",
        error?.response?.data
      );

      setResults([]);

      if (error?.response?.status === 404) {
        setError(
          "The student results endpoint was not found."
        );
      } else if (error?.response?.status === 400) {
        setError(
          "The student results filter was rejected by the server."
        );
      } else {
        setError(
          "Failed to load student results."
        );
      }
    } finally {
      setLoadingResults(false);
    }
  };

  // =====================================================
  // CHANGE STUDENT
  // =====================================================

  const handleStudentChange = (e) => {
    const studentId = e.target.value;

    if (!studentId) {
      setSelectedStudent("");
      setSelectedStudentData(null);
      setResults([]);
      setError("");

      navigate(
        "/academic-coordinator/student-results"
      );

      return;
    }

    setSelectedStudent(studentId);

    navigate(
      `/academic-coordinator/student-results/${studentId}`
    );

    loadStudentResults(studentId);
  };

  // =====================================================
  // HELPERS
  // =====================================================

  const getSubjectName = (result) => {
    if (!result) return "—";

    if (typeof result.subject === "string") {
      return result.subject;
    }

    if (result.subject?.name) {
      return result.subject.name;
    }

    return (
      result.subject_name ||
      result.subject_display ||
      "—"
    );
  };

  const getAssessmentName = (result) => {
    if (!result) return "—";

    if (
      typeof result.assessment === "string"
    ) {
      return result.assessment;
    }

    if (result.assessment?.name) {
      return result.assessment.name;
    }

    return (
      result.assessment_name ||
      result.exam_name ||
      result.assessment_display ||
      "—"
    );
  };

  const getScore = (result) => {
    if (!result) return "—";

    if (result.score !== undefined && result.score !== null) {
      return result.score;
    }

    if (result.marks !== undefined && result.marks !== null) {
      return result.marks;
    }

    if (
      result.mark !== undefined &&
      result.mark !== null
    ) {
      return result.mark;
    }

    return "—";
  };

  const getTotal = (result) => {
    if (!result) return null;

    if (
      result.total !== undefined &&
      result.total !== null
    ) {
      return result.total;
    }

    if (
      result.total_marks !== undefined &&
      result.total_marks !== null
    ) {
      return result.total_marks;
    }

    if (
      result.max_score !== undefined &&
      result.max_score !== null
    ) {
      return result.max_score;
    }

    return null;
  };

  const getGrade = (result) => {
    if (!result) return "—";

    if (typeof result.grade === "string") {
      return result.grade;
    }

    if (result.grade?.grade) {
      return result.grade.grade;
    }

    if (result.grade?.name) {
      return result.grade.name;
    }

    return (
      result.grade_name ||
      result.grade_display ||
      "—"
    );
  };

  const isApproved = (result) => {
    if (!result) return false;

    if (
      result.approved !== undefined
    ) {
      return Boolean(result.approved);
    }

    if (
      result.is_approved !== undefined
    ) {
      return Boolean(result.is_approved);
    }

    if (
      result.status
    ) {
      return (
        String(result.status).toLowerCase() ===
        "approved"
      );
    }

    return false;
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
            Loading students...
          </p>

        </div>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="space-y-8">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>

          <h1 className="text-[clamp(1.5rem,3vw,2.2rem)] font-bold text-gray-800">
            Student Results
          </h1>

          <p className="text-gray-500 mt-2">
            View individual student assessment
            and examination results
          </p>

        </div>

        <button
          type="button"
          onClick={() =>
            navigate(
              "/academic-coordinator/students"
            )
          }
          className="milk-btn w-fit"
        >
          ← Back to Students
        </button>

      </div>


      {/* =================================================
          STUDENT SELECTOR
      ================================================= */}

      <div className="card">

        <label className="form-label">
          Select Student
        </label>

        <select
          className="milk-input max-w-md"
          value={selectedStudent}
          onChange={handleStudentChange}
        >

          <option value="">
            -- Choose a student --
          </option>

          {students.map((student) => (

            <option
              key={student.id}
              value={student.id}
            >
              {student.first_name}{" "}
              {student.last_name}

              {student.admission_number
                ? ` (${student.admission_number})`
                : ""}
            </option>

          ))}

        </select>

      </div>


      {/* =================================================
          SELECTED STUDENT
      ================================================= */}

      {selectedStudentData && (

        <div className="stat-card py-5">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

            <div>

              <p className="text-gray-500 text-sm">
                Viewing Results For
              </p>

              <h2 className="text-xl font-semibold text-gray-800 mt-1">
                {selectedStudentData.first_name}{" "}
                {selectedStudentData.last_name}
              </h2>

              <p className="text-gray-500 mt-1">
                Admission No:{" "}
                <span className="font-medium text-gray-700">
                  {selectedStudentData.admission_number ||
                    "—"}
                </span>
              </p>

              <p className="text-gray-500 mt-1">
                Class:{" "}
                <span className="font-medium text-gray-700">
                  {selectedStudentData.classroom_name ||
                    "Unassigned"}
                </span>
              </p>

              {selectedStudentData.assessment_number && (
                <p className="text-gray-500 mt-1">
                  Assessment No:{" "}
                  <span className="font-medium text-gray-700">
                    {selectedStudentData.assessment_number}
                  </span>
                </p>
              )}

            </div>


            {/* VIEW PROFILE */}

            <button
              type="button"
              onClick={() =>
                navigate(
                  `/academic-coordinator/student-details/${selectedStudentData.id}`
                )
              }
              className="milk-btn w-fit"
            >
              View Student Profile
            </button>

          </div>

        </div>

      )}


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">

          <p className="text-red-700 font-medium">
            {error}
          </p>

        </div>

      )}


      {/* =================================================
          RESULTS
      ================================================= */}

      <div className="card overflow-x-auto">

        {!selectedStudent ? (

          <div className="text-center text-gray-500 py-12">

            <div className="text-4xl mb-3">
              📊
            </div>

            <p className="text-lg">
              Select a student above to view
              their results.
            </p>

          </div>

        ) : loadingResults ? (

          <div className="text-center py-12">

            <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-green-600 mx-auto mb-4"></div>

            <p className="text-gray-500">
              Loading student results...
            </p>

          </div>

        ) : results.length === 0 ? (

          <div className="text-center text-gray-500 py-12">

            <div className="text-5xl mb-4">
              📚
            </div>

            <p className="text-lg font-medium text-gray-600">
              No results recorded yet
            </p>

            <p className="text-sm text-gray-400 mt-2">
              No results were returned for this
              student.
            </p>

          </div>

        ) : (

          <table className="w-full text-left">

            <thead>

              <tr className="border-b-2 border-green-200">

                <th className="py-3 px-3 text-green-700 font-semibold">
                  Subject
                </th>

                <th className="py-3 px-3 text-green-700 font-semibold">
                  Assessment / Exam
                </th>

                <th className="py-3 px-3 text-green-700 font-semibold">
                  Score
                </th>

                <th className="py-3 px-3 text-green-700 font-semibold">
                  Grade
                </th>

                <th className="py-3 px-3 text-green-700 font-semibold">
                  Status
                </th>

              </tr>

            </thead>

            <tbody>

              {results.map((result, index) => {

                const score = getScore(result);
                const total = getTotal(result);
                const grade = getGrade(result);
                const approved = isApproved(result);

                return (
                  <tr
                    key={result.id || index}
                    className="border-b border-gray-100 hover:bg-green-50"
                  >

                    {/* SUBJECT */}

                    <td className="py-3 px-3 font-medium">
                      {getSubjectName(result)}
                    </td>


                    {/* ASSESSMENT */}

                    <td className="py-3 px-3">
                      {getAssessmentName(result)}
                    </td>


                    {/* SCORE */}

                    <td className="py-3 px-3 font-semibold">

                      {score}

                      {total !== null
                        ? `/${total}`
                        : ""}

                    </td>


                    {/* GRADE */}

                    <td className="py-3 px-3 font-medium">
                      {grade}
                    </td>


                    {/* STATUS */}

                    <td className="py-3 px-3">

                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          approved
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {approved
                          ? "Approved"
                          : "Pending"}
                      </span>

                    </td>

                  </tr>
                );
              })}

            </tbody>

          </table>

        )}

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

        {selectedStudentData && (

          <button
            type="button"
            onClick={() =>
              navigate(
                `/academic-coordinator/student-details/${selectedStudentData.id}`
              )
            }
            className="px-5 py-2 border border-green-300 rounded-lg text-green-700 hover:bg-green-50"
          >
            View Student Profile
          </button>

        )}

      </div>

    </div>
  );
};

export default StudentResults;