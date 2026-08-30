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

  useEffect(() => {
    loadStudents();
  }, []);

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

  const loadStudents = async () => {
    try {
      const response = await api.get("students/");
      const data = response.data?.results || response.data || [];
      setStudents(data);

      if (id) {
        const found = data.find((student) => String(student.id) === String(id));
        if (found) setSelectedStudentData(found);
      }
    } catch (err) {
      console.error("❌ Failed to load students:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentResults = async (studentId) => {
    if (!studentId) {
      setResults([]);
      return;
    }

    setLoadingResults(true);
    setError("");

    try {
      const studentResponse = await api.get(`students/${studentId}/`);
      const studentData = studentResponse.data;
      setSelectedStudentData(studentData);
      const sid = Number(studentId);

      // ✅ WORKING ENDPOINT — returns ALL results
      const resultsResponse = await api.get("results/student-results/");
      console.log("📥 RESULTS RESPONSE:", resultsResponse.data);

      const resultData = resultsResponse.data?.results || resultsResponse.data || [];

      // ✅ Filter by student ID
      let filteredResults = Array.isArray(resultData)
        ? resultData.filter((r) => Number(r.student) === sid)
        : [];

      // ✅ REMOVE DUPLICATES: keep only latest per subject
      const uniqueSubjects = {};
      filteredResults.forEach((r) => {
        const key = `${r.subject_name}-${r.term}-${r.academic_year}`;
        if (!uniqueSubjects[key] || new Date(r.updated_at) > new Date(uniqueSubjects[key].updated_at)) {
          uniqueSubjects[key] = r;
        }
      });
      filteredResults = Object.values(uniqueSubjects);

      console.log("✅ FINAL UNIQUE RESULTS:", filteredResults.length, filteredResults);
      setResults(filteredResults);

    } catch (err) {
      console.error("❌ FAILED:", err.response?.status, err.response?.data);
      setError("Failed to load results.");
      setResults([]);
    } finally {
      setLoadingResults(false);
    }
  };

  const handleStudentChange = (e) => {
    const studentId = e.target.value;
    if (!studentId) {
      setSelectedStudent("");
      setSelectedStudentData(null);
      setResults([]);
      setError("");
      navigate("/academic-coordinator/student-results");
      return;
    }
    setSelectedStudent(studentId);
    navigate(`/academic-coordinator/student-results/${studentId}`);
    loadStudentResults(studentId);
  };

  // ✅ HELPERS — EXACT FIELD NAMES FROM YOUR CONSOLE
  const getSubjectName = (r) => r.subject_name || "—";
  const getTermYear = (r) => r.term && r.academic_year ? `${r.term} • ${r.academic_year}` : (r.term || r.academic_year || "—");
  const getScore = (r) => r.total_score || r.average_score || "—";
  const getGrade = (r) => r.grade_name || r.cbc_code || "—";
  const getRemark = (r) => r.grade_description || r.teacher_comment || r.cbc_description || "—";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-green-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-500">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-[clamp(1.5rem,3vw,2.2rem)] font-bold text-gray-800">Student Results</h1>
          <p className="text-gray-500 mt-2">View individual student assessment and examination results</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/academic-coordinator/students")}
          className="milk-btn w-fit"
        >
          ← Back to Students
        </button>
      </div>

      {/* STUDENT SELECTOR */}
      <div className="card">
        <label className="form-label">Select Student</label>
        <select
          className="milk-input max-w-md"
          value={selectedStudent}
          onChange={handleStudentChange}
        >
          <option value="">-- Choose a student --</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.first_name} {s.last_name} ({s.admission_number})
            </option>
          ))}
        </select>
      </div>

      {/* STUDENT INFO */}
      {selectedStudentData && (
        <div className="stat-card py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <p className="text-gray-500 text-sm">Viewing Results For</p>
              <h2 className="text-xl font-semibold text-gray-800 mt-1">
                {selectedStudentData.first_name} {selectedStudentData.last_name}
              </h2>
              <p className="text-gray-500 mt-1">
                Admission No: <span className="font-medium">{selectedStudentData.admission_number || "—"}</span>
              </p>
              <p className="text-gray-500 mt-1">
                Class: <span className="font-medium">{selectedStudentData.classroom_name || "Unassigned"}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/academic-coordinator/student-details/${selectedStudentData.id}`)}
              className="milk-btn w-fit"
            >
              View Student Profile
            </button>
          </div>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* RESULTS TABLE */}
      <div className="card overflow-x-auto">
        {!selectedStudent ? (
          <div className="text-center text-gray-500 py-12">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-lg">Select a student above to view their results.</p>
          </div>
        ) : loadingResults ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading student results...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <div className="text-5xl mb-4">📚</div>
            <p className="text-lg font-medium text-gray-600">No results recorded yet</p>
            <p className="text-sm text-gray-400 mt-2">No results found for this student.</p>
          </div>
        ) : (
          <>
            {/* SUMMARY STATS */}
            <div className="bg-green-50 p-4 rounded-lg mb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-500">Subjects</p>
                <p className="text-xl font-bold text-gray-800">{results.length}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Average Score</p>
                <p className="text-xl font-bold text-green-600">
                  {Math.round(results.reduce((s, r) => s + (Number(r.total_score) || 0), 0) / results.length)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Highest Score</p>
                <p className="text-xl font-bold text-blue-600">
                  {Math.max(...results.map((r) => Number(r.total_score) || 0))}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Term / Year</p>
                <p className="text-lg font-semibold">
                  {results[0]?.term} • {results[0]?.academic_year}
                </p>
              </div>
            </div>

            {/* TABLE */}
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-green-200">
                  <th className="py-3 px-3 text-green-700 font-semibold">Subject</th>
                  <th className="py-3 px-3 text-green-700 font-semibold">Term / Year</th>
                  <th className="py-3 px-3 text-green-700 font-semibold text-center">Score</th>
                  <th className="py-3 px-3 text-green-700 font-semibold text-center">Grade</th>
                  <th className="py-3 px-3 text-green-700 font-semibold">Remark</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={r.id || i} className="border-b border-gray-100 hover:bg-green-50">
                    <td className="py-3 px-3 font-medium">{getSubjectName(r)}</td>
                    <td className="py-3 px-3 text-sm">{getTermYear(r)}</td>
                    <td className="py-3 px-3 text-center font-bold text-green-700">{getScore(r)}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                        {getGrade(r)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-sm text-gray-600">{getRemark(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentResults;