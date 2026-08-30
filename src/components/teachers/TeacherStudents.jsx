import { useEffect, useState, useCallback } from "react";
import api from "../api/api";


// =====================================================
// SPINNER
// =====================================================
const Spinner = () => (
  <div className="flex justify-center items-center h-80">
    <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-green-600"></div>
  </div>
);


// =====================================================
// HELPERS
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
  return firstValue(classroom.name, classroom.class_name, classroom.classroom_name) || `Class ${classroom.id || ""}`;
};


// =====================================================
// STUDENT DETAILS MODAL
// =====================================================
const StudentDetailsModal = ({ student, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDetails = async () => {
      if (!student?.id) return;
      try {
        setLoading(true);
        setError("");
        const { data: studentData } = await api.get(`students/${student.id}/`);
        setDetails(studentData);
        console.log("✅ Student loaded:", studentData);
      } catch (err) {
        console.error("❌ Student details error:", err.response?.data || err.message);
        setError("Could not load student details.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [student?.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Student Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : error ? (
            <p className="text-red-600 text-center py-4">{error}</p>
          ) : details ? (
            <div className="space-y-4">
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">👨‍🎓 Student</h3>
                <p className="text-sm"><strong>Name:</strong> {details.first_name} {details.last_name}</p>
                <p className="text-sm mt-1"><strong>Adm No:</strong> {details.admission_number}</p>
                <p className="text-sm mt-1"><strong>Class:</strong> {details.classroom_name || "—"}</p>
                <p className="text-sm mt-1"><strong>Status:</strong> {details.status || "Active"}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">👨‍👩‍👧 Parent / Guardian</h3>
                <p className="text-sm">
                  <strong>Name:</strong> {details.parent_name || "Not Assigned"}
                </p>
              </div>
            </div>
          ) : <p className="text-gray-500 text-center">No details available.</p>}
        </div>
        <div className="border-t border-gray-100 px-5 py-3 bg-gray-50">
          <button onClick={onClose} className="w-full py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Close</button>
        </div>
      </div>
    </div>
  );
};


// =====================================================
// ✅ STUDENT RESULTS MODAL — USING THE WORKING ENDPOINT
// =====================================================
const StudentResultsModal = ({ student, onClose }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResults = async () => {
      if (!student?.id) return;

      const CURRENT_STUDENT_ID = Number(student.id);
      console.log("========================================");
      console.log("🎯 LOADING RESULTS FOR:", student.name, "| ID:", CURRENT_STUDENT_ID);
      console.log("========================================");

      try {
        setLoading(true);
        setError("");

        // ✅ METHOD 1: USE THE PROVEN WORKING ENDPOINT
        try {
          const { data: allResults } = await api.get("results/student-results/");
          const marksList = getArray(allResults);
          console.log("📥 Total results loaded:", marksList.length);

          // ✅ Filter to ONLY this student
          let filteredMarks = marksList.filter(
            (m) => Number(m.student) === CURRENT_STUDENT_ID
          );
          console.log("✅ Matched results for this student:", filteredMarks.length);

          // ✅ Remove duplicates — keep latest per subject+term+year
          const uniqueMap = {};
          filteredMarks.forEach((m) => {
            const key = `${m.subject_name}-${m.term}-${m.academic_year}`;
            if (!uniqueMap[key] || new Date(m.updated_at) > new Date(uniqueMap[key].updated_at)) {
              uniqueMap[key] = m;
            }
          });
          filteredMarks = Object.values(uniqueMap);
          console.log("✅ After dedup:", filteredMarks.length);

          // ✅ Format using YOUR ACTUAL FIELD NAMES
          const formatted = filteredMarks.map((m) => ({
            id: m.id,
            subject_name: m.subject_name || "Subject",
            marks: m.total_score || m.average_score || "—",
            grade: m.grade_name || m.cbc_code || "—",
            remarks: m.grade_description || m.teacher_comment || m.cbc_description || "—",
            term: m.term || "",
            academic_year: m.academic_year || "",
            assessment_name: m.term && m.academic_year
              ? `${m.term} • ${m.academic_year}`
              : "Assessment",
          }));

          setResults(formatted);
          return; // ✅ Done — don't try fallback
        } catch (err) {
          console.log("📌 student-results endpoint issue:", err.response?.status);
        }

        // ✅ METHOD 2: FALLBACK — submissions approach
        const { data: subData } = await api.get("results/result-submissions/");
        const allSubmissions = getArray(subData);
        console.log("📥 Fallback — submissions loaded:", allSubmissions.length);

        const extracted = [];
        allSubmissions.forEach((sub) => {
          if (!Array.isArray(sub.students)) return;
          const studentMark = sub.students.find(
            (sm) => Number(sm.student || sm.student_id) === CURRENT_STUDENT_ID
          );
          if (studentMark) {
            extracted.push({
              id: sub.id,
              subject_name: sub.subject_name || "Subject",
              assessment_name: [sub.term, sub.academic_year].filter(Boolean).join(" • ") || "Assessment",
              marks: studentMark.marks || studentMark.score || "—",
              grade: studentMark.grade || "—",
              remarks: studentMark.remarks || "",
              term: sub.term || "",
              academic_year: sub.academic_year || "",
            });
          }
        });

        console.log("✅ Fallback results:", extracted.length);
        setResults(extracted);

      } catch (err) {
        console.error("❌ Failed to load results:", err.response?.data || err.message);
        setError("Could not load results.");
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [student?.id, student.name]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">📊 Student Results</h2>
            <p className="text-sm text-gray-500">
              {student.name || student.admission_number} • Latest Results
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : error ? (
            <p className="text-red-600 text-center py-4">{error}</p>
          ) : results.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-3">📭</div>
              <p className="text-gray-500">No results found for this student.</p>
              <p className="text-sm text-gray-400 mt-2">Results appear once recorded.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((r, i) => (
                <div key={`${r.id}-${i}`} className="border border-gray-100 rounded-lg p-4 hover:bg-green-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">{r.subject_name || "Subject"}</p>
                      <p className="text-sm text-gray-500">{r.assessment_name}</p>
                      {r.remarks && r.remarks !== "—" && (
                        <p className="text-sm text-gray-600 mt-1 italic">"{r.remarks}"</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-700">{r.marks}</p>
                      {r.grade && r.grade !== "—" && (
                        <p className="text-sm font-medium text-green-600 mt-1">{r.grade}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="border-t border-gray-100 px-5 py-3 bg-gray-50">
          <button onClick={onClose} className="w-full py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Close</button>
        </div>
      </div>
    </div>
  );
};


// =====================================================
// MAIN COMPONENT
// =====================================================
const TeacherStudents = () => {
  const [assignments, setAssignments] = useState([]);
  const [classTeacherAssignments, setClassTeacherAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [students, setStudents] = useState([]);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [viewingResultsStudent, setViewingResultsStudent] = useState(null);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState("");

  const fetchMyAssignments = useCallback(async () => {
    try {
      setLoadingAssignments(true);
      setError("");
      const { data } = await api.get("assignments/");
      const activeAssignments = getArray(data).filter(
        (a) => a && a.id && a.is_active !== false && !(a.is_active === "false" || a.is_active === 0)
      );
      setAssignments(activeAssignments);
      const classTeachers = activeAssignments.filter((a) => isTrue(a.is_class_teacher));
      setClassTeacherAssignments(classTeachers);
      if (classTeachers.length > 0) setSelectedAssignment(classTeachers[0]);
    } catch (err) {
      console.error("Fetch assignments error:", err.response?.data || err.message);
      setError("Failed to load your assigned classes.");
    } finally {
      setLoadingAssignments(false);
    }
  }, []);

  const fetchStudents = useCallback(async (assignment) => {
    if (!assignment?.id) { setStudents([]); return; }
    try {
      setLoadingStudents(true);
      setError("");
      let studentList = [];
      let primarySuccess = false;

      try {
        const { data: markData } = await api.get(`attendance/mark/?assignment=${assignment.id}`);
        const rawStudents = getArray(markData.students);
        if (rawStudents.length > 0) {
          primarySuccess = true;
          studentList = rawStudents.map((s) => ({
            id: s.student || s.id,
            admission_number: s.admission_number || s.admission_no || "—",
            name: firstValue(s.name, `${s.first_name||""} ${s.last_name||""}`.trim()) || "—",
          }));
        }
      } catch {
        console.log("Attendance endpoint failed, using fallback...");
      }

      if (!primarySuccess) {
        const classroomId = assignment.classroom?.id || assignment.classroom_id;
        if (!classroomId) throw new Error("No classroom ID available");
        const { data: dashData } = await api.get(`dashboard/teacher/students/?class_id=${classroomId}`);
        const rawStudents = Array.isArray(dashData) ? dashData : getArray(dashData);
        studentList = rawStudents.map((s) => ({
          id: s.id,
          admission_number: s.admission_number || s.admission_no || "—",
          name: firstValue(s.name, `${s.first_name||""} ${s.last_name||""}`.trim()) || "—",
        }));
      }
      setStudents(studentList);
    } catch (err) {
      console.error("❌ Students error:", err.response?.data || err.message);
      setError("Failed to load students.");
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  useEffect(() => { fetchMyAssignments(); }, [fetchMyAssignments]);
  useEffect(() => {
    selectedAssignment ? fetchStudents(selectedAssignment) : setStudents([]);
  }, [selectedAssignment, fetchStudents]);

  const handleAssignmentChange = (e) => {
    const aid = e.target.value;
    setError("");
    setStudents([]);
    if (!aid) { setSelectedAssignment(null); return; }
    setSelectedAssignment(classTeacherAssignments.find((a) => String(a.id) === String(aid)) || null);
  };

  if (loadingAssignments) return <Spinner />;

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
      {viewingStudent && <StudentDetailsModal student={viewingStudent} onClose={() => setViewingStudent(null)} />}
      {viewingResultsStudent && <StudentResultsModal student={viewingResultsStudent} onClose={() => setViewingResultsStudent(null)} />}

      <div className="card">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">My Students</h1>
        <p className="text-gray-500 mt-1 text-sm">View students in your assigned classes.</p>
      </div>

      {error && <div className="card bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">{error}</div>}

      {classTeacherAssignments.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-gray-400 text-4xl mb-3">👩‍🏫</div>
          <h2 className="text-lg font-semibold text-gray-700">No Class-Teacher Assignment</h2>
          <p className="text-gray-500 mt-1">You are not assigned as a Class Teacher for any class yet.</p>
        </div>
      ) : (
        <>
          <div className="card">
            <label className="form-label block text-sm font-medium text-gray-700 mb-2">Select Class</label>
            <select
              className="milk-input w-full"
              value={selectedAssignment?.id || ""}
              onChange={handleAssignmentChange}
              disabled={loadingStudents}
            >
              <option value="">-- Choose your class --</option>
              {classTeacherAssignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.classroom_name || getClassName(a.classroom)} — {a.subject_name || "Subject"}
                </option>
              ))}
            </select>
          </div>

          {selectedAssignment && (
            <div className="card bg-green-50 border border-green-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {selectedAssignment.classroom_name || getClassName(selectedAssignment.classroom)}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Students in this class</p>
                </div>
                <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-semibold">
                  {loadingStudents ? "Loading..." : `${students.length} Student${students.length === 1 ? "" : "s"}`}
                </div>
              </div>
            </div>
          )}

          {selectedAssignment ? (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Students</h2>
              {loadingStudents ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-green-600"></div>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <div className="text-3xl mb-3">👨‍🎓</div>
                  <p>No students found in this class.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-600 w-36">Adm No.</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Full Name</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-600 w-44">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, index) => {
                        const fullName = student.name || [student.first_name, student.last_name].filter(Boolean).join(" ") || "—";
                        return (
                          <tr key={student.id ?? `student-${index}`} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-gray-700 font-mono text-sm">{student.admission_number}</td>
                            <td className="py-3 px-4 text-gray-800 font-medium">{fullName}</td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => setViewingStudent(student)}
                                  className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => setViewingResultsStudent(student)}
                                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                                >
                                  Results
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="card text-center py-10 text-gray-500">
              <p>Please select a class to view students.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TeacherStudents;