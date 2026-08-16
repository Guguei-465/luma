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

  const [studentReport, setStudentReport] = useState(null);
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
  // LOAD DATA
  // =====================================================

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    loadClassDetails();
    loadTeachers();
  }, [id]);

  // =====================================================
  // HELPER
  // =====================================================

  const getListData = (response) => {
    return (
      response?.data?.results ||
      response?.data ||
      []
    );
  };

  // =====================================================
  // GET TEACHER NAME
  // =====================================================

  const getTeacherName = (teacher) => {
    if (!teacher) {
      return "Teacher";
    }

    // Serializer already provides teacher_name
    if (teacher.teacher_name) {
      return teacher.teacher_name;
    }

    // Other possible serializer fields
    if (teacher.full_name) {
      return teacher.full_name;
    }

    if (teacher.name) {
      return teacher.name;
    }

    // Nested user object
    if (
      teacher.user &&
      typeof teacher.user === "object"
    ) {
      const nestedName =
        `${teacher.user.first_name || ""} ${
          teacher.user.last_name || ""
        }`.trim();

      if (nestedName) {
        return nestedName;
      }

      if (teacher.user.username) {
        return teacher.user.username;
      }
    }

    // Direct fields
    const directName =
      `${teacher.first_name || ""} ${
        teacher.last_name || ""
      }`.trim();

    if (directName) {
      return directName;
    }

    return (
      teacher.username ||
      teacher.user_name ||
      teacher.employee_number ||
      teacher.staff_number ||
      `Teacher #${teacher.id}`
    );
  };

  // =====================================================
  // GET TEACHER ID
  // =====================================================

  const getTeacherId = (teacher) => {
    if (!teacher) {
      return "";
    }

    if (
      typeof teacher === "number" ||
      typeof teacher === "string"
    ) {
      return String(teacher);
    }

    return String(
      teacher.id ||
      teacher.teacher_id ||
      teacher.teacher_profile_id ||
      ""
    );
  };

  // =====================================================
  // LOAD CLASS DETAILS
  // =====================================================

  const loadClassDetails = async (
    showRefreshLoader = false
  ) => {
    if (!id) return;

    try {
      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // -------------------------------------------------
      // MAIN CLASS
      // -------------------------------------------------

      const classRes = await api.get(
        `classes/${id}/`
      );

      const selectedClass = classRes.data;

      setClassData(selectedClass);

      const classroomName =
        `${selectedClass.grade}${
          selectedClass.stream
            ? ` ${selectedClass.stream}`
            : ""
        }`;

      // -------------------------------------------------
      // REPORTS
      // -------------------------------------------------

      const [
        studentsResult,
        capacityResult,
        teachersResult,
      ] = await Promise.allSettled([
        api.get("reports/students/by-class/"),
        api.get("reports/school/class-capacity/"),
        api.get("reports/teachers/by-class/"),
      ]);

      // =================================================
      // STUDENT REPORT
      // =================================================

      if (
        studentsResult.status ===
        "fulfilled"
      ) {
        const studentsReport = getListData(
          studentsResult.value
        );

        const matchingStudents =
          studentsReport.find(
            (item) =>
              String(item.classroom || "")
                .toLowerCase()
                .trim() ===
              classroomName
                .toLowerCase()
                .trim()
          );

        setStudentReport(
          matchingStudents || null
        );
      } else {
        console.error(
          "Failed to load student report:",
          studentsResult.reason
        );

        setStudentReport(null);
      }

      // =================================================
      // CAPACITY REPORT
      // =================================================

      if (
        capacityResult.status ===
        "fulfilled"
      ) {
        const capacityReport = getListData(
          capacityResult.value
        );

        const matchingCapacity =
          capacityReport.find(
            (item) =>
              String(item.classroom || "")
                .toLowerCase()
                .trim() ===
              classroomName
                .toLowerCase()
                .trim()
          );

        setCapacityData(
          matchingCapacity || null
        );
      } else {
        console.error(
          "Failed to load capacity report:",
          capacityResult.reason
        );

        setCapacityData(null);
      }

      // =================================================
      // TEACHER REPORT
      // =================================================

      if (
        teachersResult.status ===
        "fulfilled"
      ) {
        const teacherReport = getListData(
          teachersResult.value
        );

        const matchingTeacher =
          teacherReport.find(
            (item) =>
              String(item.classroom || "")
                .toLowerCase()
                .trim() ===
              classroomName
                .toLowerCase()
                .trim()
          );

        setTeacherData(
          matchingTeacher || null
        );
      } else {
        console.error(
          "Failed to load teacher report:",
          teachersResult.reason
        );

        setTeacherData(null);
      }
    } catch (err) {
      console.error(
        "Failed to load class details:",
        err
      );

      setClassData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =====================================================
  // LOAD TEACHER PROFILES
  // =====================================================
  //
  // IMPORTANT:
  //
  // You do NOT have a teacher app.
  //
  // TeacherProfile belongs to accounts and is exposed
  // through the TeacherAssignment URLs.
  //
  // The backend URLs are structured like:
  //
  // teacher-assignments/
  // teacher-assignments/teacher-profile/
  //
  // We try the assignment route first.
  //
  // =====================================================

  const loadTeachers = async () => {
    try {
      let response = null;

      const teacherEndpoints = [
        "assignments/teacher-profile/",
        "assignments/teacher-profile/",
        "teacher-profile/",
      ];

      for (
        const endpoint of teacherEndpoints
      ) {
        try {
          const res = await api.get(
            endpoint
          );

          response = res;

          console.log(
            `Teacher profiles loaded from: ${endpoint}`,
            res.data
          );

          break;
        } catch (endpointError) {
          console.warn(
            `Teacher endpoint failed: ${endpoint}`,
            endpointError?.response?.status
          );
        }
      }

      if (!response) {
        console.error(
          "Could not load TeacherProfile from any available endpoint."
        );

        setTeachers([]);
        return;
      }

      const data = getListData(response);

      console.log(
        "Teacher profiles:",
        data
      );

      setTeachers(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "Failed to load teacher profiles:",
        err
      );

      setTeachers([]);
    }
  };

  // =====================================================
  // OPEN EDIT MODAL
  // =====================================================

  const openEditModal = () => {
    if (!classData) {
      return;
    }

    // -------------------------------------------------
    // Normalize class_teacher
    // -------------------------------------------------

    let currentTeacherId = "";

    if (
      classData.class_teacher !== null &&
      classData.class_teacher !== undefined
    ) {
      if (
        typeof classData.class_teacher ===
        "object"
      ) {
        currentTeacherId =
          getTeacherId(
            classData.class_teacher
          );
      } else {
        currentTeacherId = String(
          classData.class_teacher
        );
      }
    }

    if (
      !currentTeacherId &&
      classData.class_teacher_id
    ) {
      currentTeacherId = String(
        classData.class_teacher_id
      );
    }

    setFormData({
      grade: classData.grade || "",
      stream: classData.stream || "",
      capacity:
        classData.capacity ?? "",
      class_teacher:
        currentTeacherId,
    });

    setFormError("");
    setShowEditModal(true);
  };

  // =====================================================
  // CLOSE EDIT MODAL
  // =====================================================

  const closeEditModal = () => {
    if (saving) {
      return;
    }

    setShowEditModal(false);
    setFormError("");
  };

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // FORMAT BACKEND ERROR
  // =====================================================

  const getBackendError = (error) => {
    const data =
      error?.response?.data;

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

    if (
      typeof data === "object"
    ) {
      return Object.entries(data)
        .map(([field, value]) => {
          const message =
            Array.isArray(value)
              ? value.join(" ")
              : String(value);

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

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (!formData.grade.trim()) {
      setFormError(
        "Please select a grade."
      );
      return;
    }

    if (!formData.stream.trim()) {
      setFormError(
        "Please enter a stream."
      );
      return;
    }

    const capacity =
      Number(formData.capacity);

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

    try {
      setSaving(true);

      // -------------------------------------------------
      // PAYLOAD
      // -------------------------------------------------

      const payload = {
        grade:
          formData.grade.trim(),

        stream:
          formData.stream.trim(),

        capacity,

        class_teacher:
          formData.class_teacher
            ? Number(
                formData.class_teacher
              )
            : null,
      };

      console.log(
        "Updating class with payload:",
        payload
      );

      // -------------------------------------------------
      // UPDATE
      // -------------------------------------------------

      const response =
        await api.patch(
          `classes/update/${id}/`,
          payload
        );

      setClassData(
        response.data
      );

      setShowEditModal(false);

      setFormError("");

      await loadClassDetails();
    } catch (err) {
      console.error(
        "Failed to update class:",
        err
      );

      setFormError(
        getBackendError(err)
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE CLASS
  // =====================================================

  const handleDeleteClass = async () => {
    if (!classData) {
      return;
    }

    const className =
      `${classData.grade}${
        classData.stream
          ? ` - ${classData.stream}`
          : ""
      }`;

    const confirmed =
      window.confirm(
        `Are you sure you want to delete ${className}?\n\n` +
        "This action cannot be undone."
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);

      await api.delete(
        `classes/delete/${id}/`
      );

      navigate(
        "/academic-coordinator/classes",
        {
          replace: true,
        }
      );
    } catch (err) {
      console.error(
        "Failed to delete class:",
        err
      );

      window.alert(
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
          <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-green-600 mx-auto mb-4"></div>

          <p className="text-lg text-gray-500">
            Loading class details...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // CLASS NOT FOUND
  // =====================================================

  if (!classData) {
    return (
      <div className="card text-center py-12">
        <div className="text-5xl mb-4">
        </div>

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
  // VALUES
  // =====================================================

  const classroomName =
    `${classData.grade}${
      classData.stream
        ? ` - ${classData.stream}`
        : ""
    }`;

  const totalStudents =
    studentReport?.total_students ??
    capacityData?.current_students ??
    classData.total_students ??
    0;

  const capacity =
    capacityData?.capacity ??
    classData.capacity ??
    0;

  const availableSpaces =
    capacityData?.available_spaces ??
    Math.max(
      Number(capacity) -
        Number(totalStudents),
      0
    );

  // -----------------------------------------------------
  // CLASS TEACHER NAME
  // -----------------------------------------------------

  let classTeacher =
    classData.class_teacher_name ||
    "";

  if (
    !classTeacher &&
    classData.class_teacher &&
    typeof classData.class_teacher ===
      "object"
  ) {
    classTeacher =
      getTeacherName(
        classData.class_teacher
      );
  }

  if (
    !classTeacher &&
    teacherData?.class_teacher
  ) {
    classTeacher =
      teacherData.class_teacher;
  }

  if (!classTeacher) {
    classTeacher =
      "Not Assigned";
  }

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
  // PAGE
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
            Class overview, students,
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
            <i className="bi bi-arrow-left mr-1"></i>
            Back to Classes
          </button>

          <button
            type="button"
            disabled={refreshing}
            onClick={() =>
              loadClassDetails(true)
            }
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <i className="bi bi-arrow-clockwise mr-1"></i>

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

          <button
            type="button"
            onClick={openEditModal}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            <i className="bi bi-pencil mr-1"></i>
            Edit Class
          </button>

          <button
            type="button"
            disabled={deleting}
            onClick={handleDeleteClass}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            <i className="bi bi-trash mr-1"></i>

            {deleting
              ? "Deleting..."
              : "Delete Class"}
          </button>

        </div>
      </div>

      {/* =================================================
          OVERVIEW
      ================================================= */}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

        <div className="stat-card py-5">
          <p className="text-gray-700 font-medium">
            Class Teacher
          </p>

          <p className="stat-value text-lg mt-1">
            {classTeacher}
          </p>
        </div>

        <div className="stat-card py-5">
          <p className="text-gray-700 font-medium">
            Total Students
          </p>

          <p className="stat-value mt-1">
            {totalStudents}
          </p>
        </div>

        <div className="stat-card py-5">
          <p className="text-gray-700 font-medium">
            Class Capacity
          </p>

          <p className="stat-value mt-1">
            {capacity}
          </p>
        </div>

        <div className="stat-card py-5">
          <p className="text-gray-700 font-medium">
            Available Spaces
          </p>

          <p
            className={`stat-value mt-1 ${
              availableSpaces === 0
                ? "text-red-600"
                : "text-green-600"
            }`}
          >
            {availableSpaces}
          </p>
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

            <p className="font-semibold text-gray-800 mt-1">
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
          STUDENT SUMMARY
      ================================================= */}

      <div className="card">

        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Student Summary
        </h2>

        <p className="text-gray-500 text-sm mb-6">
          Current enrollment for{" "}
          {classroomName}
        </p>

        {!studentReport ? (
          <div className="text-center py-8">

            <div className="text-4xl mb-3">
              👨‍🎓
            </div>

            <p className="text-gray-500">
              No student records found
              for this class.
            </p>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead>
                <tr className="border-b border-gray-200">

                  <th className="py-3 px-3 text-gray-600">
                    Class
                  </th>

                  <th className="py-3 px-3 text-gray-600">
                    Total Students
                  </th>

                  <th className="py-3 px-3 text-gray-600">
                    Capacity
                  </th>

                  <th className="py-3 px-3 text-gray-600">
                    Available
                  </th>

                </tr>
              </thead>

              <tbody>
                <tr className="border-b border-gray-100">

                  <td className="py-4 px-3 font-medium">
                    {studentReport.classroom}
                  </td>

                  <td className="py-4 px-3">
                    {studentReport.total_students}
                  </td>

                  <td className="py-4 px-3">
                    {capacity}
                  </td>

                  <td
                    className={`py-4 px-3 font-semibold ${
                      availableSpaces === 0
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {availableSpaces}
                  </td>

                </tr>
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

          <div className="flex items-center justify-between">

            <span className="text-gray-600">
              Students
            </span>

            <span className="font-semibold text-gray-800">
              {totalStudents} / {capacity}
            </span>

          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">

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
          TEACHER INFORMATION
      ================================================= */}

      <div className="card">

        <div className="mb-5">

          <h2 className="text-xl font-semibold text-gray-800">
            Class Teacher
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            The teacher responsible for this class.
          </p>

        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg bg-green-50 border border-green-200">

          <div>

            <p className="text-sm text-gray-500">
              Assigned Teacher
            </p>

            <p className="font-semibold text-gray-800 text-lg mt-1">
              {classTeacher}
            </p>

          </div>

          {classData.class_teacher && (
            <div className="text-sm text-gray-500">
              Teacher ID:{" "}
              {getTeacherId(
                classData.class_teacher
              )}
            </div>
          )}

        </div>

        <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200">

          <p className="text-sm text-blue-800">
            <strong>Teacher Assignments:</strong>{" "}
            Subject teachers are managed through the
            Teacher Assignments system. One teacher can
            teach multiple subjects and can be assigned
            to multiple classes.
          </p>

        </div>

      </div>

      {/* =================================================
          EDIT CLASS MODAL
      ================================================= */}

      {showEditModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">

          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            {/* HEADER */}

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
                className="text-gray-400 hover:text-gray-700 text-2xl disabled:opacity-50"
              >
                ×
              </button>

            </div>

            {/* FORM */}

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

                  {grades.map(
                    (grade) => (
                      <option
                        key={grade}
                        value={grade}
                      >
                        {grade}
                      </option>
                    )
                  )}

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
                  min="1"
                  max="100"
                  className="milk-input w-full"
                  required
                />

                <p className="text-xs text-gray-500 mt-1">
                  Maximum allowed capacity is 100 students.
                </p>

              </div>

              {/* CLASS TEACHER */}

              <div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Teacher
                </label>

                <select
                  name="class_teacher"
                  value={
                    formData.class_teacher
                  }
                  onChange={handleChange}
                  className="milk-input w-full"
                >

                  <option value="">
                    No Class Teacher
                  </option>

                  {teachers.map(
                    (teacher) => {

                      const teacherId =
                        getTeacherId(
                          teacher
                        );

                      if (!teacherId) {
                        return null;
                      }

                      return (
                        <option
                          key={teacherId}
                          value={teacherId}
                        >
                          {getTeacherName(
                            teacher
                          )}
                        </option>
                      );
                    }
                  )}

                </select>

                {teachers.length === 0 && (
                  <p className="text-xs text-orange-600 mt-2">
                    No teacher profiles are available.
                    Please check the Teacher Profile
                    records.
                  </p>
                )}

                {teachers.length > 0 && (
                  <p className="text-xs text-green-600 mt-2">
                    {teachers.length} teacher profile
                    {teachers.length !== 1
                      ? "s"
                      : ""}{" "}
                    available.
                  </p>
                )}

              </div>

              {/* ACTIONS */}

              <div className="flex flex-col sm:flex-row gap-3 pt-3">

                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={saving}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="milk-btn w-full disabled:opacity-50"
                >
                  {saving
                    ? "Updating Class..."
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