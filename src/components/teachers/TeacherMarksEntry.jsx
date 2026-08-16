import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";

// =====================================================
// HELPERS
// =====================================================
const getArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const firstValue = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return "—";
};

// =====================================================
// SPINNERS
// =====================================================
const Spinner = () => (
  <div className="flex justify-center items-center h-80">
    <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-green-600"></div>
  </div>
);

const ButtonSpinner = () => (
  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
);

// =====================================================
// MAIN COMPONENT
// =====================================================
const TeacherMarksEntry = () => {
  const { assessment_id } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // LOAD ASSESSMENT + STUDENTS
  // =====================================================
  const fetchAssessment = useCallback(async () => {
    if (!assessment_id) return;

    try {
      setLoading(true);
      setError("");

      // 1. Get assessment details
      const { data: assessmentData } = await api.get(
        `results/assessments/${assessment_id}/`
      );
      setAssessment(assessmentData);

      const classId = assessmentData.class_id || assessmentData.classroom?.id;
      if (!classId) {
        throw new Error("Assessment has no class associated");
      }

      // 2. Load students — same endpoint + fallback pattern
      let studentList = [];
      let primaryLoaded = false;

      // Try attendance/mark endpoint first
      try {
        const { data: markData } = await api.get(
          `attendance/mark/?classroom=${classId}`
        );
        const raw = getArray(markData.students);
        if (raw.length > 0) {
          primaryLoaded = true;
          studentList = raw.map((s) => ({
            id: s.student || s.id,
            admission_number: firstValue(s.admission_number, s.admission_no),
            name: firstValue(
              s.name,
              `${s.first_name || ""} ${s.last_name || ""}`.trim()
            ),
            mark: "",
          }));
        }
      } catch (e) {
        console.log("⚠️ Attendance endpoint failed, using fallback");
      }

      // Fallback: dashboard endpoint
      if (!primaryLoaded) {
        const { data: dashData } = await api.get(
          `dashboard/teacher/students/?class_id=${classId}`
        );
        const raw = getArray(dashData);
        studentList = raw.map((s) => ({
          id: s.id,
          admission_number: firstValue(s.admission_number, s.adm_no, s.admission_no),
          name: firstValue(
            s.name,
            `${s.first_name || ""} ${s.last_name || ""}`.trim()
          ),
          mark: "",
        }));
      }

      setStudents(studentList);
    } catch (err) {
      console.error("❌ Load error:", err.response?.data || err.message);
      setError("Failed to load assessment or students.");
    } finally {
      setLoading(false);
    }
  }, [assessment_id]);

  // =====================================================
  // UPDATE MARK
  // =====================================================
  const updateMark = (studentId, value) => {
    if (!assessment) return;
    const num = Number(value);
    if (value !== "" && (isNaN(num) || num < 0 || num > assessment.max_score)) {
      return; // Invalid input — ignore
    }
    setStudents((prev) =>
      prev.map((s) => (String(s.id) === String(studentId) ? { ...s, mark: value } : s))
    );
  };

  // =====================================================
  // SAVE MARKS
  // =====================================================
  const saveMarks = async () => {
    if (!assessment_id || students.length === 0) return;

    try {
      setSaving(true);
      setError("");

      await api.post(
        `dashboard/teacher/assessments/${assessment_id}/save-marks/`,
        {
          marks: students.map((s) => ({
            student_id: s.id,
            score: s.mark !== "" ? Number(s.mark) : 0,
          })),
        }
      );

      alert("✅ Marks saved successfully!");
    } catch (err) {
      console.error("❌ Save error:", err.response?.data || err.message);
      setError("Failed to save marks. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================
  useEffect(() => {
    if (assessment_id) fetchAssessment();
  }, [assessment_id, fetchAssessment]);

  // =====================================================
  // RENDER
  // =====================================================
  if (loading) return <Spinner />;

  if (error)
    return (
      <div className="p-4 md:p-6">
        <div className="card bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );

  if (!assessment)
    return (
      <div className="p-4 md:p-6">
        <div className="card text-center py-10 text-gray-500">Assessment not found.</div>
      </div>
    );

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="card">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Enter Marks</h1>
        <p className="text-gray-600 mt-2">
          <strong>{assessment.name || "Assessment"}</strong> — Max Score:{" "}
          {assessment.max_score || "—"}
        </p>
      </div>

      {/* STUDENT TABLE */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Students ({students.length})
        </h2>

        {students.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No students found for this class.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">#</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 w-36">
                    Adm No.
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">
                    Student Name
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 w-32">
                    Mark / {assessment.max_score}
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => (
                  <tr
                    key={student.id || `s-${idx}`}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-gray-600">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono text-sm text-gray-700">
                      {student.admission_number}
                    </td>
                    <td className="py-3 px-4 text-gray-800 font-medium">
                      {student.name}
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        min="0"
                        max={assessment.max_score}
                        value={student.mark}
                        onChange={(e) => updateMark(student.id, e.target.value)}
                        className="milk-input text-center w-20 mx-auto"
                        placeholder="0"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SAVE BUTTON */}
        {students.length > 0 && (
          <div className="mt-6 text-right">
            <button className="milk-btn" onClick={saveMarks} disabled={saving}>
              {saving && <ButtonSpinner />}
              Save All Marks
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherMarksEntry;