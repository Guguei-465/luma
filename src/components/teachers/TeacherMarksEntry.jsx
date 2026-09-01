import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
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
  const prevAssessmentId = useRef(null);

  const [assessment, setAssessment] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");


  // =====================================================
  // LOAD ASSESSMENT + STUDENTS
  // =====================================================
  const fetchAssessment = useCallback(async () => {
    if (prevAssessmentId.current === assessment_id) return;

    prevAssessmentId.current = assessment_id;
    setAssessment(null);
    setStudents([]);
    setError("");
    setLoading(true);

    try {
      console.log("📌 Loading assessment ID:", assessment_id);

      const { data: assessmentData } = await api.get(
        `results/assessments/${assessment_id}/`
      );
      setAssessment(assessmentData);
      console.log("✅ Assessment loaded:", assessmentData);

      const classId = assessmentData.classroom;
      console.log("📌 Class ID:", classId);

      const { data: s1 } = await api.get(`students/?classroom=${classId}`);
      const list1 = getArray(s1);
      console.log("📥 Students loaded:", list1.length);

      if (list1.length === 0) {
        setError(`⚠️ No students found in Class ID ${classId}. Enroll students first.`);
        return;
      }

      const studentList = list1.map((s) => ({
        id: s.id,
        admission_number: firstValue(s.admission_number, s.adm_no),
        name: firstValue(
          s.name,
          `${s.first_name || ""} ${s.last_name || ""}`.trim()
        ),
        mark: "",
        isAbsent: false,
      }));

      setStudents(studentList);

    } catch (err) {
      console.error("❌ Load error:", err.response?.data || err.message);
      setError("Failed to load assessment.");
    } finally {
      setLoading(false);
    }
  }, [assessment_id]);


  useEffect(() => {
    if (assessment_id) fetchAssessment();
  }, [assessment_id, fetchAssessment]);


  // =====================================================
  // UPDATE MARK
  // =====================================================
  const updateMark = (studentId, value) => {
    if (!assessment) return;
    const maxScore = Number(assessment.total_marks || assessment.max_score || 0);
    const num = Number(value);
    if (value !== "" && (isNaN(num) || num < 0 || num > maxScore)) return;
    setStudents((prev) =>
      prev.map((s) =>
        String(s.id) === String(studentId)
          ? { ...s, mark: value, isAbsent: false }
          : s
      )
    );
  };


  // =====================================================
  // TOGGLE ABSENT
  // =====================================================
  const toggleAbsent = (studentId) => {
    setStudents((prev) =>
      prev.map((s) =>
        String(s.id) === String(studentId)
          ? { ...s, isAbsent: !s.isAbsent, mark: "" }
          : s
      )
    );
  };


  // =====================================================
  // CHECK IF ALL STUDENTS HAVE MARK OR ARE ABSENT
  // =====================================================
  const allStudentsComplete = students.every(
    (s) => s.mark !== "" || s.isAbsent
  );


  // =====================================================
  // SAVE MARKS → PENDING
  // =====================================================
  const saveMarks = async () => {
    if (!assessment_id || students.length === 0) return;

    if (!allStudentsComplete) {
      setError("⚠️ Please enter a mark for every student OR mark them as Absent.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      console.log("📤 Creating submission...");

      const subRes = await api.post(`results/result-submissions/`, {
        assessment: Number(assessment_id),
        approval_status: "Pending",
        status: "Pending",
        is_submitted: true,
        submitted: true,
      });
      const submissionId = subRes.data.id;
      console.log("✅ Submission created, ID:", submissionId);

      const marksToSave = students.map((s) => ({
        student: s.id,
        submission: submissionId,
        marks: s.isAbsent ? null : Number(s.mark),
        status: s.isAbsent ? "Absent" : "Present",
        remarks: s.isAbsent ? "Absent" : "",
      }));

      console.log("📤 Saving marks...", marksToSave);
      let savedCount = 0;
      for (const mark of marksToSave) {
        await api.post(`results/results/`, mark);
        savedCount++;
      }

      console.log(`✅ Saved ${savedCount} mark(s)`);
      alert(`✅ Successfully saved ${savedCount} mark(s)!`);

    } catch (err) {
      console.error("❌ Save error:", err.response?.data || err.message);
      setError("Failed to save marks.");
    } finally {
      setSaving(false);
    }
  };


  // =====================================================
  // RENDER
  // =====================================================
  if (loading) return <Spinner />;

  if (error)
    return (
      <div className="p-4 md:p-6">
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg">
          {error}
          <div className="mt-4">
            <Link to="/teacher/assessments" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
              ← Back to Assessments
            </Link>
          </div>
        </div>
      </div>
    );

  if (!assessment) return null;

  const maxScore = Number(assessment.total_marks || assessment.max_score || 0);


  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <Link to="/teacher/assessments" className="inline-flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors mb-3">
          ← Back to Assessments
        </Link>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Enter Marks</h1>
        <p className="text-gray-600 mt-2">
          <strong>{assessment.name || "Assessment"}</strong>
          <br />
          <span className="text-sm text-gray-500">
            Class ID {assessment.classroom}
            {assessment.term && ` • ${assessment.term}`}
            {assessment.academic_year && ` / ${assessment.academic_year}`}
            {" • "}Max Score: {maxScore}
          </span>
        </p>
      </div>


      {/* Marks Entry — Responsive */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Students ({students.length})
        </h2>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-600 w-12">#</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 w-36">Adm No.</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Student Name</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600 w-36">
                  Mark / {maxScore}
                </th>
                <th className="text-center py-3 px-4 font-medium text-gray-600 w-32">
                  Absent
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, idx) => (
                <tr key={student.id || idx} className={`border-b border-gray-100 hover:bg-green-50/30 ${student.isAbsent ? "bg-orange-50" : ""}`}>
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
                      max={maxScore}
                      value={student.mark}
                      onChange={(e) => updateMark(student.id, e.target.value)}
                      disabled={student.isAbsent}
                      className="w-24 mx-auto text-center px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:text-gray-400 font-medium"
                      placeholder="0"
                    />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => toggleAbsent(student.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        student.isAbsent
                          ? "bg-orange-500 text-white hover:bg-orange-600"
                          : "bg-gray-200 text-gray-600 hover:bg-orange-100 hover:text-orange-700"
                      }`}
                    >
                      {student.isAbsent ? "✓ Absent" : "Mark Absent"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Layout — NO scrolling */}
        <div className="md:hidden space-y-3">
          {students.map((student, idx) => (
            <div key={student.id || idx} className={`border border-gray-200 rounded-lg p-3 ${student.isAbsent ? "bg-orange-50" : "bg-gray-50"}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">#{idx + 1}</p>
                  <p className="font-mono text-xs text-gray-600">{student.admission_number}</p>
                  <p className="font-medium text-gray-800 text-sm mt-0.5 truncate">
                    {student.name}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div>
                    <input
                      type="number"
                      min="0"
                      max={maxScore}
                      value={student.mark}
                      onChange={(e) => updateMark(student.id, e.target.value)}
                      disabled={student.isAbsent}
                      className="w-20 text-center px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:text-gray-400 font-medium"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-400 text-center mt-1">/{maxScore}</p>
                  </div>
                  <button
                    onClick={() => toggleAbsent(student.id)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      student.isAbsent
                        ? "bg-orange-500 text-white hover:bg-orange-600"
                        : "bg-gray-200 text-gray-600 hover:bg-orange-100 hover:text-orange-700"
                    }`}
                  >
                    {student.isAbsent ? "✓ Absent" : "Absent"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Save Button */}
        <div className="mt-6 text-right">
          <button
            className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold text-lg hover:bg-green-700 disabled:opacity-50 transition-all shadow-sm"
            onClick={saveMarks}
            disabled={saving || !allStudentsComplete}
          >
            {saving && <ButtonSpinner />}
            {saving ? "Saving..." : "Save Marks"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherMarksEntry;