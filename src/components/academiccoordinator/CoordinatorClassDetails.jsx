import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

const CoordinatorClassDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // =====================================================
  // STATE
  // =====================================================

  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);

  const [capacityData, setCapacityData] = useState(null);
  const [teacherData, setTeacherData] = useState(null);
  const [teachers, setTeachers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);

  const [formData, setFormData] = useState({
    grade: "",
    stream: "",
    capacity: "",
    class_teacher: "",
  });

  const [formError, setFormError] = useState("");

  // =====================================================
  // GRADES
  // =====================================================

  const grades = [
    "Day Care",
    "PP1",
    "PP2",
    "Grade 1",
    "Grade 2",
    "Grade 3",
    "Grade 4",
    "Grade 5",
    "Grade 6",
    "Grade 7",
    "Grade 8",
    "Grade 9",
  ];

  // =====================================================
  // LOAD ON MOUNT
  // =====================================================

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    loadInitialData();
  }, [id]);

  // =====================================================
  // LOAD INITIAL DATA
  // =====================================================

  const loadInitialData = async () => {
    setLoading(true);

    try {
      await Promise.all([
        loadClassDetails(false),
        loadAllTeachers(),
      ]);
    } catch (error) {
      console.error("Failed to load initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // NORMALIZE API RESPONSES
  // =====================================================

  const getListData = (response) => {
    return response?.data?.results || response?.data || [];
  };

  // =====================================================
  // NORMALIZE CLASSROOM
  // =====================================================

  const normalizeClassroom = (value) => {
    return String(value || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/\s*-\s*/g, " ")
      .trim();
  };

  // =====================================================
  // BUILD CLASSROOM NAME
  // =====================================================

  const buildClassroomName = (classObject) => {
    if (!classObject) return "";

    const grade = String(classObject.grade || "").trim();
    const stream = String(classObject.stream || "").trim();

    if (!grade) return "";

    return stream ? `${grade} - ${stream}` : grade;
  };

  // =====================================================
  // GET STUDENT NAME
  // =====================================================

  const getStudentName = (student) => {
    if (!student) return "Unnamed Student";

    const firstName = student.first_name || "";
    const lastName = student.last_name || "";

    const fullName = `${firstName} ${lastName}`.trim();

    if (fullName) {
      return fullName;
    }

    if (student.user && typeof student.user === "object") {
      const nestedName = `${student.user.first_name || ""} ${
        student.user.last_name || ""
      }`.trim();

      if (nestedName) return nestedName;

      if (student.user.username) {
        return student.user.username;
      }
    }

    if (student.username) {
      return student.username;
    }

    return "Unnamed Student";
  };

  // =====================================================
  // GET STUDENT ID
  // =====================================================

  const getStudentId = (student) => {
    if (!student) return "";

    if (student.id !== undefined && student.id !== null) {
      return String(student.id);
    }

    if (
      student.student_id !== undefined &&
      student.student_id !== null
    ) {
      return String(student.student_id);
    }

    return "";
  };

  // =====================================================
  // GET STUDENT CLASS ID
  // =====================================================

  const getStudentClassId = (student) => {
    if (!student) return "";

    if (
      student.classroom !== undefined &&
      student.classroom !== null &&
      (typeof student.classroom === "string" ||
        typeof student.classroom === "number")
    ) {
      return String(student.classroom);
    }

    if (
      student.classroom_id !== undefined &&
      student.classroom_id !== null
    ) {
      return String(student.classroom_id);
    }

    if (
      student.classroom &&
      typeof student.classroom === "object"
    ) {
      if (
        student.classroom.id !== undefined &&
        student.classroom.id !== null
      ) {
        return String(student.classroom.id);
      }
    }

    return "";
  };

  // =====================================================
  // GET STUDENT CLASS NAME
  // =====================================================

  const getStudentClassName = (student) => {
    if (!student) return "";

    if (
      student.classroom_name &&
      String(student.classroom_name).trim()
    ) {
      return String(student.classroom_name).trim();
    }

    if (
      student.classroom &&
      typeof student.classroom === "object"
    ) {
      const grade = student.classroom.grade || "";
      const stream = student.classroom.stream || "";

      if (grade) {
        return stream ? `${grade} - ${stream}` : grade;
      }
    }

    return "";
  };

  // =====================================================
  // TEACHER HELPERS
  // =====================================================

  const getTeacherId = (teacher) => {
    if (!teacher) return "";

    if (
      typeof teacher === "number" ||
      typeof teacher === "string"
    ) {
      return String(teacher);
    }

    if (teacher.id !== undefined && teacher.id !== null) {
      return String(teacher.id);
    }

    if (
      teacher.teacher_id !== undefined &&
      teacher.teacher_id !== null
    ) {
      return String(teacher.teacher_id);
    }

    if (
      teacher.user_id !== undefined &&
      teacher.user_id !== null
    ) {
      return String(teacher.user_id);
    }

    if (teacher.user && typeof teacher.user === "object") {
      if (
        teacher.user.id !== undefined &&
        teacher.user.id !== null
      ) {
        return String(teacher.user.id);
      }
    }

    if (
      teacher.user !== undefined &&
      teacher.user !== null &&
      (typeof teacher.user === "number" ||
        typeof teacher.user === "string")
    ) {
      return String(teacher.user);
    }

    return "";
  };

  const getTeacherName = (teacher) => {
    if (!teacher) return "Not Assigned";

    if (typeof teacher === "string") {
      return teacher;
    }

    if (teacher.teacher_name) {
      return teacher.teacher_name;
    }

    if (teacher.full_name) {
      return teacher.full_name;
    }

    if (teacher.name) {
      return teacher.name;
    }

    if (teacher.first_name || teacher.last_name) {
      return `${teacher.first_name || ""} ${
        teacher.last_name || ""
      }`.trim();
    }

    if (teacher.user && typeof teacher.user === "object") {
      const {
        first_name,
        last_name,
        username,
        email,
      } = teacher.user;

      const fullName = `${first_name || ""} ${
        last_name || ""
      }`.trim();

      if (fullName) return fullName;
      if (username) return username;
      if (email) return email;
    }

    if (
      teacher.user_profile &&
      typeof teacher.user_profile === "object"
    ) {
      const profile = teacher.user_profile;

      const fullName = `${profile.first_name || ""} ${
        profile.last_name || ""
      }`.trim();

      if (fullName) return fullName;
      if (profile.username) return profile.username;
    }

    if (teacher.employee_number) {
      return teacher.employee_number;
    }

    const teacherId = getTeacherId(teacher);

    if (teacherId) {
      return `Teacher #${teacherId}`;
    }

    return "Not Assigned";
  };

  // =====================================================
  // FIND TEACHER
  // =====================================================

  const findTeacherById = (teacherId) => {
    if (
      teacherId === undefined ||
      teacherId === null ||
      teacherId === ""
    ) {
      return null;
    }

    const normalizedId = String(teacherId);

    return (
      teachers.find(
        (teacher) => getTeacherId(teacher) === normalizedId
      ) || null
    );
  };

  // =====================================================
  // GET CLASS TEACHER ID
  // =====================================================

  const getClassTeacherId = (classObject) => {
    if (!classObject) return "";

    if (
      classObject.class_teacher_id !== undefined &&
      classObject.class_teacher_id !== null
    ) {
      return String(classObject.class_teacher_id);
    }

    if (
      classObject.class_teacher !== undefined &&
      classObject.class_teacher !== null
    ) {
      return getTeacherId(classObject.class_teacher);
    }

    return "";
  };

  // =====================================================
  // RESOLVE CLASS TEACHER
  // =====================================================

  const resolveClassTeacher = () => {
    if (!classData) return "Not Assigned";

    if (
      classData.class_teacher_name &&
      String(classData.class_teacher_name).trim()
    ) {
      return String(classData.class_teacher_name).trim();
    }

    if (
      classData.class_teacher &&
      typeof classData.class_teacher === "object"
    ) {
      const name = getTeacherName(classData.class_teacher);

      if (name && name !== "Not Assigned") {
        return name;
      }
    }

    const teacherId = getClassTeacherId(classData);

    if (teacherId) {
      const matchedTeacher = findTeacherById(teacherId);

      if (matchedTeacher) {
        return getTeacherName(matchedTeacher);
      }
    }

    if (teacherData) {
      if (teacherData.class_teacher_name) {
        return teacherData.class_teacher_name;
      }

      if (
        teacherData.class_teacher &&
        typeof teacherData.class_teacher === "object"
      ) {
        return getTeacherName(teacherData.class_teacher);
      }

      if (typeof teacherData.class_teacher === "string") {
        return teacherData.class_teacher;
      }

      if (teacherData.teacher_name) {
        return teacherData.teacher_name;
      }

      if (teacherData.teacher) {
        if (typeof teacherData.teacher === "object") {
          return getTeacherName(teacherData.teacher);
        }

        const reportTeacher = findTeacherById(
          teacherData.teacher
        );

        if (reportTeacher) {
          return getTeacherName(reportTeacher);
        }
      }
    }

    return "Not Assigned";
  };

  // =====================================================
  // LOAD ALL TEACHERS
  // =====================================================

  const loadAllTeachers = async () => {
    try {
      const res = await api.get("accounts/teacher-profiles/");

      const teacherList = getListData(res);

      setTeachers(
        Array.isArray(teacherList) ? teacherList : []
      );

      return teacherList;
    } catch (err) {
      console.warn(
        "Teacher profiles failed. Trying assignments...",
        err
      );

      try {
        const res = await api.get("assignments/");

        const assignments = getListData(res);

        const unique = [];
        const seen = new Set();

        assignments.forEach((assignment) => {
          const teacherId = getTeacherId(assignment);

          if (teacherId && !seen.has(teacherId)) {
            seen.add(teacherId);

            unique.push({
              id: teacherId,
              ...assignment,
            });
          }
        });

        setTeachers(unique);

        return unique;
      } catch (fallbackErr) {
        console.error(
          "Failed to load teachers:",
          fallbackErr
        );

        setTeachers([]);

        return [];
      }
    }
  };

  // =====================================================
  // LOAD CLASS DETAILS
  // =====================================================

  const loadClassDetails = async (showRefreshLoader = false) => {
    if (!id) return;

    try {
      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // =================================================
      // LOAD CLASS
      // =================================================

      const classRes = await api.get(`classes/${id}/`);

      const selectedClass = classRes.data;

      console.log("📦 Class API response:", selectedClass);

      setClassData(selectedClass);

      // =================================================
      // CLASS NAME
      // =================================================

      const classroomName =
        buildClassroomName(selectedClass);

      const normalizedClassroomName =
        normalizeClassroom(classroomName);

      // =================================================
      // LOAD ACTUAL STUDENTS
      // =================================================

      let actualStudents = [];

      try {
        const studentsRes = await api.get("students/");

        const allStudents = getListData(studentsRes);

        console.log("👨‍🎓 All students:", allStudents);

        // Match using class ID first
        actualStudents = allStudents.filter((student) => {
          return (
            getStudentClassId(student) === String(id)
          );
        });

        // Fallback to class name
        if (actualStudents.length === 0) {
          actualStudents = allStudents.filter((student) => {
            const studentClassName =
              getStudentClassName(student);

            return (
              normalizeClassroom(studentClassName) ===
              normalizedClassroomName
            );
          });
        }

        console.log(
          "✅ Students in this class:",
          actualStudents
        );

        setStudents(
          Array.isArray(actualStudents)
            ? actualStudents
            : []
        );
      } catch (studentError) {
        console.error(
          "❌ Failed to load students:",
          studentError
        );

        setStudents([]);
      }

      // =================================================
      // LOAD REPORTS
      // =================================================

      const [
        capacityResult,
        teachersResult,
      ] = await Promise.allSettled([
        api.get("reports/school/class-capacity/"),
        api.get("reports/teachers/by-class/"),
      ]);

      // =================================================
      // CAPACITY REPORT
      // =================================================

      if (capacityResult.status === "fulfilled") {
        const report = getListData(capacityResult.value);

        const matchedCapacityReport =
          report.find((item) => {
            return (
              normalizeClassroom(item.classroom) ===
              normalizedClassroomName
            );
          }) || null;

        setCapacityData(matchedCapacityReport);
      } else {
        setCapacityData(null);
      }

      // =================================================
      // TEACHER REPORT
      // =================================================

      if (teachersResult.status === "fulfilled") {
        const report = getListData(teachersResult.value);

        const matchedTeacherReport =
          report.find((item) => {
            return (
              normalizeClassroom(item.classroom) ===
              normalizedClassroomName
            );
          }) || null;

        setTeacherData(matchedTeacherReport);
      } else {
        setTeacherData(null);
      }
    } catch (err) {
      console.error(
        "❌ Failed to load class details:",
        err
      );

      setClassData(null);
      setStudents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =====================================================
  // EDIT MODAL
  // =====================================================

  const openEditModal = () => {
    if (!classData) return;

    const currentTeacherId =
      getClassTeacherId(classData);

    setFormData({
      grade: classData.grade || "",
      stream: classData.stream || "",
      capacity: classData.capacity ?? "",
      class_teacher: currentTeacherId,
    });

    setFormError("");
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    if (saving) return;

    setShowEditModal(false);
    setFormError("");
  };

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // BACKEND ERROR
  // =====================================================

  const getBackendError = (error) => {
    const data = error?.response?.data;

    if (!data) {
      return "The server could not process the request.";
    }

    if (typeof data === "string") {
      return data;
    }

    if (data.detail) {
      return data.detail;
    }

    if (data.message) {
      return data.message;
    }

    if (typeof data === "object") {
      return Object.entries(data)
        .map(([field, value]) => {
          const message = Array.isArray(value)
            ? value.join(" ")
            : value;

          return `${field}: ${message}`;
        })
        .join(" ");
    }

    return "The server rejected the request.";
  };

  // =====================================================
  // UPDATE CLASS
  // =====================================================

  const handleUpdateClass = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.grade.trim()) {
      setFormError("Please select a grade.");
      return;
    }

    if (!formData.stream.trim()) {
      setFormError("Please select a stream.");
      return;
    }

    const capacity = Number(formData.capacity);

    if (
      !formData.capacity ||
      Number.isNaN(capacity) ||
      capacity < 1
    ) {
      setFormError(
        "Please enter a valid class capacity."
      );
      return;
    }

    if (capacity > 100) {
      setFormError(
        "Capacity cannot exceed 100 students."
      );
      return;
    }

    if (capacity < students.length) {
      setFormError(
        `Capacity cannot be less than the current ${students.length} students.`
      );
      return;
    }

    try {
      setSaving(true);

      const teacherId = formData.class_teacher
        ? Number(formData.class_teacher)
        : null;

      const payload = {
        grade: formData.grade.trim(),
        stream: formData.stream.trim(),
        capacity,
        class_teacher: teacherId,
      };

      const response = await api.patch(
        `classes/update/${id}/`,
        payload
      );

      setClassData(response.data);
      setShowEditModal(false);
      setFormError("");

      await Promise.all([
        loadAllTeachers(),
        loadClassDetails(false),
      ]);
    } catch (err) {
      console.error(
        "❌ Failed to update class:",
        err
      );

      setFormError(getBackendError(err));
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE CLASS
  // =====================================================

  const handleDeleteClass = async () => {
    if (!classData) return;

    const className =
      buildClassroomName(classData);

    const confirmed = window.confirm(
      `Are you sure you want to delete ${className}?\n\nThis cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);

      await api.delete(`classes/delete/${id}/`);

      navigate(
        "/academic-coordinator/classes",
        {
          replace: true,
        }
      );
    } catch (err) {
      console.error("❌ Delete failed:", err);

      alert(
        getBackendError(err) ||
          "Failed to delete this class."
      );
    } finally {
      setDeleting(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-blue-600 mx-auto mb-4"></div>

          <p className="text-lg text-gray-500">
            Loading class details...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // NOT FOUND
  // =====================================================

  if (!classData) {
    return (
      <div className="card text-center py-12">
        <p className="text-red-500 text-lg">
          Class not found.
        </p>

        <button
          type="button"
          onClick={() =>
            navigate(
              "/academic-coordinator/classes"
            )
          }
          className="milk-btn mt-5"
        >
          ← Back to Classes
        </button>
      </div>
    );
  }

  // =====================================================
  // COMPUTED VALUES
  // =====================================================

  const classroomName =
    buildClassroomName(classData);

  const totalStudents = students.length;

  const capacity =
    capacityData?.capacity ??
    classData.capacity ??
    0;

  const availableSpaces = Math.max(
    Number(capacity) - Number(totalStudents),
    0
  );

  const classTeacher =
    resolveClassTeacher();

  const percentage =
    Number(capacity) > 0
      ? Math.min(
          (Number(totalStudents) /
            Number(capacity)) *
            100,
          100
        )
      : 0;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-8">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

        <div>
          <h1 className="text-[clamp(1.5rem,3vw,2.2rem)] font-bold text-gray-800">
            {classroomName}
          </h1>

          <p className="text-gray-500 mt-2">
            Class information, enrolled students,
            capacity and management
          </p>
        </div>

        <div className="flex flex-wrap gap-3">

          <button
            type="button"
            onClick={() =>
              navigate(
                "/academic-coordinator/classes"
              )
            }
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            ← Back to Classes
          </button>

          <button
            type="button"
            disabled={refreshing}
            onClick={() =>
              loadClassDetails(true)
            }
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

          <button
            type="button"
            onClick={openEditModal}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            ✏️ Edit Class
          </button>

          <button
            type="button"
            disabled={deleting}
            onClick={handleDeleteClass}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            🗑️{" "}
            {deleting
              ? "Deleting..."
              : "Delete Class"}
          </button>

        </div>
      </div>

      {/* =================================================
          CLASS INFORMATION
      ================================================= */}

      <div className="card">

        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          Class Information
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

          <div>
            <p className="text-sm text-gray-500">
              Grade
            </p>

            <p className="font-semibold text-gray-800 mt-1">
              {classData.grade || "—"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Stream
            </p>

            <p className="font-semibold text-gray-800 mt-1">
              {classData.stream || "—"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Class Teacher
            </p>

            <p className="font-semibold text-gray-800 mt-1">
              {classTeacher}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Maximum Capacity
            </p>

            <p className="font-semibold text-gray-800 mt-1">
              {capacity}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Current Students
            </p>

            <p className="font-semibold text-blue-600 mt-1 text-xl">
              {totalStudents}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Available Spaces
            </p>

            <p
              className={`font-semibold mt-1 ${
                availableSpaces === 0
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {availableSpaces}
            </p>
          </div>

        </div>
      </div>

      {/* =================================================
          ACTUAL STUDENTS
          
          VIEW BUTTON REMOVED
          ================================================= */}

      <div className="card">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">

          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Students in {classroomName}
            </h2>

            <p className="text-gray-500 text-sm mt-1">
              Actual students currently assigned to
              this class.
            </p>
          </div>

          <div className="px-4 py-2 rounded-lg bg-blue-50 border border-blue-200">
            <span className="text-sm text-gray-500">
              Total Students
            </span>

            <span className="ml-2 text-lg font-bold text-blue-700">
              {totalStudents}
            </span>
          </div>

        </div>

        {students.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-gray-300 rounded-xl">

            <div className="text-5xl mb-3">
              👨‍🎓
            </div>

            <p className="text-gray-600 font-medium">
              No students found in this class.
            </p>

            <p className="text-gray-400 text-sm mt-1">
              If students are assigned to this class,
              click Refresh to load the latest records.
            </p>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead>
                <tr className="border-b border-gray-200">

                  <th className="py-3 px-3 text-gray-600 font-semibold">
                    #
                  </th>

                  <th className="py-3 px-3 text-gray-600 font-semibold">
                    Student Name
                  </th>

                  <th className="py-3 px-3 text-gray-600 font-semibold">
                    Admission Number
                  </th>

                  <th className="py-3 px-3 text-gray-600 font-semibold">
                    Gender
                  </th>

                  <th className="py-3 px-3 text-gray-600 font-semibold">
                    Class
                  </th>

                </tr>
              </thead>

              <tbody>

                {students.map((student, index) => {

                  const studentName =
                    getStudentName(student);

                  return (
                    <tr
                      key={
                        getStudentId(student) ||
                        `student-${index}`
                      }
                      className="border-b border-gray-100 hover:bg-gray-50 transition"
                    >

                      <td className="py-4 px-3 text-gray-500">
                        {index + 1}
                      </td>

                      <td className="py-4 px-3">

                        <div className="flex items-center gap-3">

                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                            {studentName
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <p className="font-semibold text-gray-800">
                              {studentName}
                            </p>
                          </div>

                        </div>

                      </td>

                      <td className="py-4 px-3 text-gray-600">
                        {student.admission_number || "—"}
                      </td>

                      <td className="py-4 px-3 text-gray-600">
                        {student.gender || "—"}
                      </td>

                      <td className="py-4 px-3 text-gray-600">
                        {getStudentClassName(student) ||
                          classroomName}
                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* =================================================
          CAPACITY STATUS
      ================================================= */}

      <div className="card">

        <h2 className="text-xl font-semibold text-gray-800 mb-5">
          Capacity Status
        </h2>

        <div className="space-y-4">

          <div className="flex justify-between">

            <span className="text-gray-600">
              Students
            </span>

            <span className="font-semibold">
              {totalStudents} / {capacity}
            </span>

          </div>

          <div className="w-full bg-gray-200 rounded-full h-3">

            <div
              className={`h-3 rounded-full transition-all ${
                percentage >= 100
                  ? "bg-red-500"
                  : percentage >= 80
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{
                width: `${percentage}%`,
              }}
            />

          </div>

          <div className="flex justify-between text-sm text-gray-500">

            <span>
              {totalStudents} students enrolled
            </span>

            <span>
              {availableSpaces} spaces remaining
            </span>

          </div>

        </div>
      </div>

      {/* =================================================
          EDIT MODAL
      ================================================= */}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">

          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between px-6 py-5 border-b">

              <div>

                <h2 className="text-xl font-bold text-gray-800">
                  Edit Class
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Update {classroomName}
                </p>

              </div>

              <button
                type="button"
                onClick={closeEditModal}
                disabled={saving}
                className="text-gray-400 hover:text-gray-700 text-2xl"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleUpdateClass}
              className="p-6 space-y-5"
            >

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                  {formError}
                </div>
              )}

              {/* GRADE */}

              <div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade
                </label>

                <select
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  className="milk-input w-full"
                  required
                >

                  <option value="">
                    Select Grade
                  </option>

                  {grades.map((grade) => (
                    <option
                      key={grade}
                      value={grade}
                    >
                      {grade}
                    </option>
                  ))}

                </select>

              </div>

              {/* STREAM */}

              <div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stream
                </label>

                <select
                  name="stream"
                  value={formData.stream}
                  onChange={handleChange}
                  className="milk-input w-full"
                  required
                >

                  <option value="">
                    Select Stream
                  </option>

                  <option value="A">
                    A
                  </option>

                  <option value="B">
                    B
                  </option>

                  <option value="C">
                    C
                  </option>

                </select>

              </div>

              {/* CAPACITY */}

              <div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Capacity
                </label>

                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  min={Math.max(1, students.length)}
                  max="100"
                  className="milk-input w-full"
                  required
                />

                <p className="text-xs text-gray-500 mt-2">
                  Current enrollment:{" "}
                  <span className="font-semibold">
                    {students.length}
                  </span>{" "}
                  student
                  {students.length !== 1 ? "s" : ""}
                </p>

              </div>

              {/* CLASS TEACHER */}

              <div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Teacher
                </label>

                <select
                  name="class_teacher"
                  value={formData.class_teacher}
                  onChange={handleChange}
                  className="milk-input w-full"
                >

                  <option value="">
                    — No Class Teacher —
                  </option>

                  {teachers.map((teacher) => {

                    const teacherId =
                      getTeacherId(teacher);

                    if (!teacherId) {
                      return null;
                    }

                    return (
                      <option
                        key={teacherId}
                        value={teacherId}
                      >
                        {getTeacherName(teacher)}
                      </option>
                    );
                  })}

                </select>

                {teachers.length === 0 && (
                  <p className="text-xs text-orange-600 mt-2">
                    ⚠️ No teachers loaded.
                  </p>
                )}

                {teachers.length > 0 && (
                  <p className="text-xs text-green-600 mt-2">
                    ✅ {teachers.length} teacher
                    {teachers.length !== 1 ? "s" : ""}{" "}
                    available
                  </p>
                )}

              </div>

              {/* ACTIONS */}

              <div className="flex flex-col sm:flex-row gap-3 pt-3">

                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={saving}
                  className="px-4 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 w-full"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="milk-btn w-full"
                >
                  {saving
                    ? "Saving..."
                    : "Update Class"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default CoordinatorClassDetails;