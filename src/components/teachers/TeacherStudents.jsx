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
// HELPERS (from TeacherAttendance)
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
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true" ||
    value === "True" ||
    value === "TRUE"
  );
};

// =====================================================
// GET CLASS NAME
// =====================================================

const getClassName = (classroom) => {
  if (!classroom) return "Class";
  if (classroom.grade && classroom.stream) {
    return `${classroom.grade} ${classroom.stream}`;
  }
  if (classroom.grade) return classroom.grade;
  return (
    firstValue(
      classroom.name,
      classroom.class_name,
      classroom.classroom_name
    ) || `Class ${classroom.id || ""}`
  );
};

// =====================================================
// TEACHER STUDENTS
// =====================================================

const TeacherStudents = () => {
  const [assignments, setAssignments] = useState([]);
  const [classTeacherAssignments, setClassTeacherAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const [students, setStudents] = useState([]);

  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // FETCH TEACHER ASSIGNMENTS
  // =====================================================
  const fetchMyAssignments = useCallback(async () => {
    try {
      setLoadingAssignments(true);
      setError("");

      const { data } = await api.get("assignments/");
      const allAssignments = getArray(data);
      const activeAssignments = allAssignments.filter(
        (a) =>
          a &&
          a.id &&
          a.is_active !== false &&
          !(a.is_active === "false" || a.is_active === 0)
      );

      setAssignments(activeAssignments);

      const classTeachers = activeAssignments.filter((a) =>
        isTrue(a.is_class_teacher)
      );
      setClassTeacherAssignments(classTeachers);

      if (classTeachers.length > 0) {
        setSelectedAssignment(classTeachers[0]);
      } else {
        setSelectedAssignment(null);
      }
    } catch (err) {
      console.error("❌ Fetch assignments error:", err.response?.data || err.message);
      setAssignments([]);
      setClassTeacherAssignments([]);
      setSelectedAssignment(null);
      setError("Failed to load your assigned classes.");
    } finally {
      setLoadingAssignments(false);
    }
  }, []);

  // =====================================================
  // FETCH STUDENTS
  // =====================================================
  const fetchStudents = useCallback(
    async (assignment) => {
      if (!assignment?.id) {
        setStudents([]);
        return;
      }

      try {
        setLoadingStudents(true);
        setError("");

        let studentList = [];
        let primarySuccess = false;

        // Try attendance endpoint first
        try {
          const { data: markData } = await api.get(
            `attendance/mark/?assignment=${assignment.id}`
          );
          const rawStudents = getArray(markData.students);

          if (rawStudents.length > 0) {
            primarySuccess = true;
            studentList = rawStudents.map((student) => ({
              id: student.student || student.id,
              admission_number:
                student.admission_number || student.admission_no || "—",
              name:
                firstValue(
                  student.name,
                  `${student.first_name || ""} ${student.last_name || ""}`.trim()
                ) || "—",
            }));
          }
        } catch (e) {
          console.log("⚠️ Primary endpoint failed, using fallback...");
        }

        // Fallback to dashboard endpoint
        if (!primarySuccess) {
          const classroomId =
            assignment.classroom?.id || assignment.classroom_id;

          if (!classroomId) throw new Error("No classroom ID available");

          const { data: dashData } = await api.get(
            `dashboard/teacher/students/?class_id=${classroomId}`
          );

          let rawStudents = [];
          if (Array.isArray(dashData)) rawStudents = dashData;
          else if (Array.isArray(dashData?.results)) rawStudents = dashData.results;

          studentList = rawStudents.map((student) => ({
            id: student.id,
            admission_number:
              student.admission_number || student.admission_no || "—",
            name:
              firstValue(
                student.name,
                `${student.first_name || ""} ${student.last_name || ""}`.trim()
              ) || "—",
          }));
        }

        setStudents(studentList);
      } catch (err) {
        console.error("❌ Students error:", err.response?.data || err.message);
        setStudents([]);
        setError("Failed to load students for this class.");
      } finally {
        setLoadingStudents(false);
      }
    },
    []
  );

  // =====================================================
  // EFFECTS
  // =====================================================
  useEffect(() => {
    fetchMyAssignments();
  }, [fetchMyAssignments]);

  useEffect(() => {
    if (selectedAssignment) {
      fetchStudents(selectedAssignment);
    } else {
      setStudents([]);
    }
  }, [selectedAssignment, fetchStudents]);

  // =====================================================
  // HANDLERS
  // =====================================================
  const handleAssignmentChange = (e) => {
    const assignmentId = e.target.value;
    setError("");
    setStudents([]);

    if (!assignmentId) {
      setSelectedAssignment(null);
      return;
    }

    const assignment = classTeacherAssignments.find(
      (a) => String(a.id) === String(assignmentId)
    );
    setSelectedAssignment(assignment || null);
  };

  // =====================================================
  // LOADING
  // =====================================================
  if (loadingAssignments) {
    return <Spinner />;
  }

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="card">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">My Students</h1>
        <p className="text-gray-500 mt-1 text-sm">
          View students in your assigned classes.
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="card bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* NO ASSIGNED CLASSES */}
      {classTeacherAssignments.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-gray-400 text-4xl mb-3">👩‍🏫</div>
          <h2 className="text-lg font-semibold text-gray-700">
            No Class-Teacher Assignment
          </h2>
          <p className="text-gray-500 mt-1">
            You are not assigned as a Class Teacher for any class yet.
          </p>
        </div>
      ) : (
        <>
          {/* CLASS SELECTOR */}
          <div className="card">
            <label className="form-label block text-sm font-medium text-gray-700 mb-2">
              Select Class
            </label>

            <select
              className="milk-input w-full"
              value={selectedAssignment?.id || ""}
              onChange={handleAssignmentChange}
              disabled={loadingStudents}
            >
              <option value="">-- Choose your class --</option>
              {classTeacherAssignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.classroom_name || getClassName(a.classroom)} —{" "}
                  {a.subject_name || "Subject"}
                </option>
              ))}
            </select>
          </div>

          {/* SELECTED CLASS INFO */}
          {selectedAssignment && (
            <div className="card bg-green-50 border border-green-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {selectedAssignment.classroom_name ||
                      getClassName(selectedAssignment.classroom)}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Students in this class
                  </p>
                </div>
                <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-semibold">
                  {loadingStudents
                    ? "Loading..."
                    : `${students.length} Student${
                        students.length === 1 ? "" : "s"
                      }`}
                </div>
              </div>
            </div>
          )}

          {/* STUDENT TABLE */}
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
                        <th className="text-left py-3 px-4 font-medium text-gray-600 w-36">
                          Adm No.
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">
                          Full Name
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, index) => {
                        const fullName =
                          student.name ||
                          [student.first_name, student.last_name]
                            .filter(Boolean)
                            .join(" ") ||
                          "—";

                        return (
                          <tr
                            key={student.id ?? `student-${index}`}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="py-3 px-4 text-gray-700 font-mono text-sm">
                              {student.admission_number}
                            </td>
                            <td className="py-3 px-4 text-gray-800 font-medium">
                              {fullName}
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
              <div className="text-3xl mb-3">📋</div>
              <p>Please select a class to view students.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TeacherStudents;