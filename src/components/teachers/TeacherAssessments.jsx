import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
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


// =====================================================
// SPINNER
// =====================================================
const Spinner = () => (
  <div className="flex justify-center items-center h-80">
    <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-green-600"></div>
  </div>
);


// =====================================================
// MAIN COMPONENT — BUTTON ALWAYS CLICKABLE
// =====================================================
const TeacherAssessments = () => {
  const [classOptions, setClassOptions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]);
  const [classStudentCounts, setClassStudentCounts] = useState({});

  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  const [assessments, setAssessments] = useState([]);
  const [filteredAssessments, setFilteredAssessments] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState("");


  // =====================================================
  // LOAD STUDENT COUNT FOR SELECTED CLASS
  // =====================================================
  const loadStudentCountForClass = useCallback(async (classId) => {
    if (!classId) return;
    if (classStudentCounts[classId] !== undefined) return;

    try {
      setLoadingStudents(true);
      const { data } = await api.get(`students/?classroom=${classId}`);
      const list = getArray(data);
      const count = list.length;
      setClassStudentCounts((prev) => ({ ...prev, [classId]: count }));
      console.log(`📊 Class ${classId} has ${count} student(s)`);
    } catch (err) {
      console.error("❌ Failed to load student count:", err.message);
      setClassStudentCounts((prev) => ({ ...prev, [classId]: -1 }));
    } finally {
      setLoadingStudents(false);
    }
  }, [classStudentCounts]);


  // =====================================================
  // LOAD ASSIGNMENTS → BUILD CLASSES & SUBJECTS
  // =====================================================
  const fetchDashboard = useCallback(async () => {
    try {
      setLoadingDashboard(true);
      setError("");

      let assignments = [];
      try {
        console.log("📌 Trying dedicated assignments endpoint...");
        const { data: listData } = await api.get("assignments/");
        assignments = getArray(listData);
        console.log("✅ From assignments list:", assignments);
      } catch (listErr) {
        console.log("⚠️ Assignments list failed, trying dashboard...");
        const { data: dashboardData } = await api.get("dashboard/teacher/");
        assignments = getArray(dashboardData.assignments || dashboardData.assigned_assignments || []);
      }

      setAllAssignments(assignments);
      console.log("✅ Final assignments list:", assignments);

      // Build unique classes
      const uniqueClasses = [];
      const seenClassIds = new Set();
      assignments.forEach((a) => {
        const cId = a.classroom || a.classroom_id;
        if (cId && !seenClassIds.has(String(cId))) {
          seenClassIds.add(String(cId));
          uniqueClasses.push({
            id: String(cId),
            name: a.classroom_name || a.class_name || `Class ${cId}`,
          });
        }
      });
      setClassOptions(uniqueClasses);
      console.log("✅ Unique classes:", uniqueClasses);

      // Build unique subjects
      const uniqueSubjects = [];
      const seenSubjectIds = new Set();
      assignments.forEach((a) => {
        const sId = a.subject || a.subject_id;
        if (sId && !seenSubjectIds.has(String(sId))) {
          seenSubjectIds.add(String(sId));
          uniqueSubjects.push({
            id: String(sId),
            name: a.subject_name || a.subject || `Subject ${sId}`,
          });
        }
      });
      setSubjectOptions(uniqueSubjects);
      console.log("✅ Unique subjects:", uniqueSubjects);
    } catch (err) {
      console.error("❌ Dashboard error:", err.response?.data || err.message);
      setError("Failed to load your classes and subjects.");
    } finally {
      setLoadingDashboard(false);
    }
  }, []);


  // =====================================================
  // FETCH + FRONTEND-FILTER ASSESSMENTS
  // =====================================================
  const fetchAssessments = useCallback(async () => {
    if (!selectedClassId || !selectedSubjectId) {
      setAssessments([]);
      setFilteredAssessments([]);
      return;
    }

    try {
      setLoadingAssessments(true);
      setError("");

      let url = `results/assessments/?classroom=${selectedClassId}&subject=${selectedSubjectId}`;
      console.log("📤 Fetching assessments:", url);

      let response;
      try {
        response = await api.get(url);
      } catch {
        url = `results/assessments/?classroom_id=${selectedClassId}&subject_id=${selectedSubjectId}`;
        console.log("📤 Retrying with:", url);
        response = await api.get(url);
      }

      const list = getArray(response.data);
      console.log("📥 Backend returned:", list.length, "assessments");

      const filtered = list.filter((a) => {
        const aClass = String(a.classroom || a.classroom_id || "");
        const aSubject = String(a.subject || a.subject_id || "");
        return aClass === selectedClassId && aSubject === selectedSubjectId;
      });

      setAssessments(list);
      setFilteredAssessments(filtered);
      console.log("✅ After filtering:", filtered.length, "assessments match your selection");
    } catch (err) {
      console.error("❌ Assessments error:", err.response?.data || err.message);
      setError("Failed to load assessments.");
      setAssessments([]);
      setFilteredAssessments([]);
    } finally {
      setLoadingAssessments(false);
    }
  }, [selectedClassId, selectedSubjectId]);


  // =====================================================
  // EFFECTS
  // =====================================================
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    fetchAssessments();
  }, [selectedClassId, selectedSubjectId, fetchAssessments]);

  useEffect(() => {
    if (selectedClassId) {
      loadStudentCountForClass(selectedClassId);
    }
  }, [selectedClassId, loadStudentCountForClass]);


  // =====================================================
  // LOADING
  // =====================================================
  if (loadingDashboard) return <Spinner />;


  // =====================================================
  // RENDER
  // =====================================================
  const studentCount = selectedClassId ? (classStudentCounts[selectedClassId] ?? null) : null;
  const hasStudents = studentCount !== null && studentCount > 0;

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Assessments & Marks</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Select your class and subject to view assessments and enter marks
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* NO CLASSES */}
      {classOptions.length === 0 && !error && (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
          No classes assigned to you yet.
        </div>
      )}

      {/* FILTERS */}
      {classOptions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium text-gray-700">Select Class</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedSubjectId("");
                setFilteredAssessments([]);
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
            <label className="block mb-1 font-medium text-gray-700">Select Subject</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              disabled={!selectedClassId}
            >
              <option value="">-- Choose Subject --</option>
              {subjectOptions
                .filter((s) => {
                  if (!selectedClassId) return true;
                  const assignment = allAssignments.find(
                    (a) =>
                      String(a.classroom || a.classroom_id) === selectedClassId &&
                      String(a.subject || a.subject_id) === s.id
                  );
                  return !!assignment;
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

      {/* ⚠️ STUDENT COUNT WARNING — INFO ONLY, BUTTON STILL CLICKS */}
      {selectedClassId && studentCount !== null && !loadingStudents && (
        <div className={`p-3 rounded-lg text-sm ${hasStudents ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-800 border border-amber-200"}`}>
          {hasStudents
            ? `✅ This class has ${studentCount} student(s). Ready to enter marks!`
            : `⚠️ This class has NO enrolled students yet. You may still click Enter Marks to verify.`}
        </div>
      )}

      {/* ASSESSMENT LIST */}
      {classOptions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Assessments {filteredAssessments.length > 0 && `(${filteredAssessments.length})`}
          </h2>

          {!selectedClassId || !selectedSubjectId ? (
            <p className="text-gray-500 text-center py-8">
              Select class and subject above to view assessments.
            </p>
          ) : loadingAssessments ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : filteredAssessments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No assessments found. They are created by Academic Coordinator.
            </p>
          ) : (
            <div className="space-y-3">
              {filteredAssessments.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {a.name || "Untitled Assessment"}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {a.assessment_type || "General"}
                      {a.total_marks ? ` • Max: ${a.total_marks}` : ""}
                      {a.term && ` • ${a.term}`}
                      {a.academic_year && ` / ${a.academic_year}`}
                    </p>
                  </div>

                  {/* ✅ BUTTON ALWAYS CLICKABLE — GREEN FOR ALL! */}
                  <Link
                    to={`/teacher/assessments/${a.id}/marks`}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap text-center ${
                      hasStudents
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-amber-500 text-white hover:bg-amber-600"
                    }`}
                  >
                    Enter Marks
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherAssessments;