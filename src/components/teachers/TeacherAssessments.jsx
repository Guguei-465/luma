import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";

// =====================================================
// HELPERS — same as used in attendance/students
// =====================================================
const getArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.assignments)) return data.assignments;
  return [];
};

const firstValue = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
};

const isTrue = (value) => {
  return (
    value === true || value === 1 || value === "1" ||
    value === "true" || value === "True" || value === "TRUE"
  );
};

const getClassName = (classroom) => {
  if (!classroom) return "Class";
  if (classroom.grade && classroom.stream) return `${classroom.grade} ${classroom.stream}`;
  if (classroom.grade) return classroom.grade;
  return (
    firstValue(classroom.name, classroom.class_name, classroom.classroom_name) ||
    `Class ${classroom.id || ""}`
  );
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
const TeacherAssessments = () => {
  const [assignments, setAssignments] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);

  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  const [assessments, setAssessments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    assessment_type: "",
    max_score: 50,
  });

  // =====================================================
  // FETCH TEACHER ASSIGNMENTS (classes + subjects)
  // =====================================================
  const fetchAssignments = useCallback(async () => {
    try {
      setLoadingAssignments(true);
      setError("");

      const { data } = await api.get("assignments/");
      const allAssignments = getArray(data).filter(
        (a) => a && a.id && a.is_active !== false && a.is_active !== "false" && a.is_active !== 0
      );

      setAssignments(allAssignments);

      // Extract unique classes
      const uniqueClasses = [];
      const seenClassIds = new Set();
      allAssignments.forEach((a) => {
        const cId = a.classroom?.id || a.classroom_id;
        if (cId && !seenClassIds.has(String(cId))) {
          seenClassIds.add(String(cId));
          uniqueClasses.push({
            id: cId,
            name: a.classroom_name || getClassName(a.classroom),
            classroom: a.classroom,
          });
        }
      });
      setClassOptions(uniqueClasses);

      // Extract unique subjects
      const uniqueSubjects = [];
      const seenSubjectIds = new Set();
      allAssignments.forEach((a) => {
        const sId = a.subject?.id || a.subject_id;
        if (sId && !seenSubjectIds.has(String(sId))) {
          seenSubjectIds.add(String(sId));
          uniqueSubjects.push({
            id: sId,
            name: a.subject_name || a.subject?.name || `Subject ${sId}`,
          });
        }
      });
      setSubjectOptions(uniqueSubjects);
    } catch (err) {
      console.error("❌ Assignments error:", err.response?.data || err.message);
      setError("Failed to load your classes and subjects.");
    } finally {
      setLoadingAssignments(false);
    }
  }, []);

  // =====================================================
  // FETCH ASSESSMENTS
  // =====================================================
  const fetchAssessments = useCallback(async () => {
    if (!selectedClassId || !selectedSubjectId) {
      setAssessments([]);
      return;
    }

    try {
      setLoadingAssessments(true);
      setError("");

      const { data } = await api.get(
        `results/assessments/?class_id=${selectedClassId}&subject_id=${selectedSubjectId}`
      );

      setAssessments(getArray(data));
    } catch (err) {
      console.error("❌ Assessments error:", err.response?.data || err.message);
      setError("Failed to load assessments.");
      setAssessments([]);
    } finally {
      setLoadingAssessments(false);
    }
  }, [selectedClassId, selectedSubjectId]);

  // =====================================================
  // CREATE ASSESSMENT
  // =====================================================
  const createAssessment = async (e) => {
    e.preventDefault();
    if (!selectedClassId || !selectedSubjectId || !formData.name.trim()) return;

    try {
      setSaving(true);
      setError("");

      await api.post("results/assessments/", {
        class_id: selectedClassId,
        subject_id: selectedSubjectId,
        name: formData.name.trim(),
        assessment_type: formData.assessment_type,
        max_score: Number(formData.max_score) || 50,
      });

      setFormData({ name: "", assessment_type: "", max_score: 50 });
      setShowForm(false);
      fetchAssessments(); // Refresh list
    } catch (err) {
      console.error("❌ Create assessment error:", err.response?.data || err.message);
      setError("Failed to create assessment. Check your input.");
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // EFFECTS
  // =====================================================
  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  // =====================================================
  // LOADING
  // =====================================================
  if (loadingAssignments) return <Spinner />;

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="card">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Assessments & Marks</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Create assessments and enter student marks for your assigned classes
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="card bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* NO ASSIGNMENTS */}
      {classOptions.length === 0 && (
        <div className="card text-center py-10 text-gray-500">
          No classes assigned to you yet.
        </div>
      )}

      {/* FILTERS */}
      {classOptions.length > 0 && (
        <div className="card grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-lable block mb-1">Select Class</label>
            <select
              className="milk-input w-full"
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedSubjectId(""); // reset subject on class change
                setAssessments([]);
              }}
            >
              <option value="">-- Choose Class --</option>
              {classOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-lable block mb-1">Select Subject</label>
            <select
              className="milk-input w-full"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              disabled={!selectedClassId}
            >
              <option value="">-- Choose Subject --</option>
              {subjectOptions
                .filter((s) => {
                  // Only show subjects taught in selected class
                  if (!selectedClassId) return true;
                  return assignments.some(
                    (a) =>
                      String(a.classroom?.id || a.classroom_id) === String(selectedClassId) &&
                      String(a.subject?.id || a.subject_id) === String(s.id)
                  );
                })
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      )}

      {/* CREATE FORM */}
      {selectedClassId && selectedSubjectId && (
        <div className="card">
          {!showForm ? (
            <button className="milk-btn" onClick={() => setShowForm(true)}>
              + Create New Assessment
            </button>
          ) : (
            <form onSubmit={createAssessment} className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">New Assessment</h3>
              <div>
                <label className="form-lable block mb-1">Assessment Name *</label>
                <input
                  type="text"
                  className="milk-input w-full"
                  placeholder="e.g. End of Term Exam"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label className="form-lable block mb-1">Type</label>
                <select
                  className="milk-input w-full"
                  value={formData.assessment_type}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, assessment_type: e.target.value }))
                  }
                >
                  <option value="">-- Select Type --</option>
                  <option value="exam">Exam</option>
                  <option value="test">Test</option>
                  <option value="assignment">Assignment</option>
                </select>
              </div>
              <div>
                <label className="form-lable block mb-1">Maximum Score</label>
                <input
                  type="number"
                  className="milk-input w-full"
                  value={formData.max_score}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, max_score: e.target.value }))
                  }
                  min="1"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="bg-gray-200 text-gray-800 px-4 py-3 rounded-lg font-medium hover:bg-gray-300"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="milk-btn" disabled={saving}>
                  {saving && <ButtonSpinner />} Save
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ASSESSMENT LIST */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Assessments</h2>

        {!selectedClassId || !selectedSubjectId ? (
          <p className="text-gray-500 text-center py-8">
            Select class and subject to view assessments.
          </p>
        ) : loadingAssessments ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : assessments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No assessments found. Create one above.
          </p>
        ) : (
          <div className="space-y-3">
            {assessments.map((a) => (
              <div
                key={a.id}
                className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
              >
                <div>
                  <h4 className="font-semibold text-gray-800">
                    {a.name || "Untitled Assessment"}
                  </h4>
                  <p className="text-sm text-gray-500 capitalize">
                    {a.assessment_type || "General"} • Max Score: {a.max_score || "—"}
                  </p>
                </div>
                <Link
                  to={`/teacher/assessments/${a.id}/marks`}
                  className="milk-btn whitespace-nowrap text-center"
                >
                  Enter Marks
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherAssessments;