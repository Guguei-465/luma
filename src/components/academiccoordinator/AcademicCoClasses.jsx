import React, { useEffect, useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";

const AcademicCoClasses = () => {
  const navigate = useNavigate();

  // =====================================================
  // STATE
  // =====================================================

  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

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
    loadClasses();
    loadTeachers();
  }, []);

  // =====================================================
  // GET LIST DATA
  // =====================================================

  const getListData = (response) => {
    return (
      response?.data?.results ||
      response?.data ||
      []
    );
  };

  // =====================================================
  // GET TEACHER ID
  // =====================================================

  /*
   * IMPORTANT:
   *
   * The class_teacher field points to TeacherProfile.
   *
   * Therefore we must use:
   *
   * teacher.id
   *
   * NOT the CustomUser ID.
   */

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
  // GET TEACHER NAME
  // =====================================================

  const getTeacherName = (teacher) => {
    if (!teacher) {
      return "Teacher";
    }

    // Serializer field
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

    if (teacher.user_name) {
      return teacher.user_name;
    }

    if (teacher.username) {
      return teacher.username;
    }

    // Nested user
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

    // Direct first_name / last_name
    const directName =
      `${teacher.first_name || ""} ${
        teacher.last_name || ""
      }`.trim();

    if (directName) {
      return directName;
    }

    return (
      teacher.employee_number ||
      teacher.staff_number ||
      `Teacher #${teacher.id}`
    );
  };

  // =====================================================
  // LOAD CLASSES
  // =====================================================

  const loadClasses = async () => {
    try {
      setLoading(true);

      const [
        classesResult,
        studentsResult,
      ] = await Promise.allSettled([
        api.get("classes/"),
        api.get("reports/students/by-class/"),
      ]);

      // =================================================
      // CLASSES
      // =================================================

      if (
        classesResult.status !== "fulfilled"
      ) {
        throw classesResult.reason;
      }

      const classData = getListData(
        classesResult.value
      );

      // =================================================
      // STUDENT REPORT
      // =================================================

      let studentReports = [];

      if (
        studentsResult.status ===
        "fulfilled"
      ) {
        studentReports = getListData(
          studentsResult.value
        );
      } else {
        console.warn(
          "Could not load student reports:",
          studentsResult.reason
        );
      }

      // =================================================
      // MERGE STUDENT COUNTS
      // =================================================

      const updatedClasses =
        Array.isArray(classData)
          ? classData.map((cls) => {
              const classroomName =
                `${cls.grade}${
                  cls.stream
                    ? ` ${cls.stream}`
                    : ""
                }`;

              const report =
                Array.isArray(studentReports)
                  ? studentReports.find(
                      (item) =>
                        String(
                          item.classroom ||
                            ""
                        )
                          .toLowerCase()
                          .trim() ===
                        classroomName
                          .toLowerCase()
                          .trim()
                    )
                  : null;

              return {
                ...cls,

                total_students:
                  cls.total_students ??
                  report?.total_students ??
                  0,
              };
            })
          : [];

      setClasses(updatedClasses);
    } catch (err) {
      console.error(
        "Failed to load classes:",
        err
      );

      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD TEACHER PROFILES
  // =====================================================

  /*
   * IMPORTANT:
   *
   * There is NO separate Teacher app.
   *
   * TeacherProfile is exposed through the
   * teacher-assignment functionality.
   *
   * The correct endpoint is:
   *
   * teacher-assignments/teacher-profile/
   *
   * We also keep fallback endpoints so this page
   * remains compatible if your backend exposes the
   * profiles under another route.
   */

  const loadTeachers = async () => {
    try {
      setLoadingTeachers(true);

      let response = null;

      const teacherEndpoints = [
        "assignments/teacher-profile/",
        "assignments/teacher-profile/",
        "teacher-profile/",
        "teachers/",
      ];

      for (
        const endpoint of teacherEndpoints
      ) {
        try {
          const res = await api.get(
            endpoint
          );

          const data = getListData(res);

          if (
            Array.isArray(data)
          ) {
            response = res;

            console.log(
              "===================================="
            );

            console.log(
              "TEACHER PROFILES LOADED FROM:",
              endpoint
            );

            console.log(
              "TEACHER PROFILES:",
              data
            );

            console.log(
              "===================================="
            );

            break;
          }
        } catch (endpointError) {
          console.warn(
            `Teacher endpoint failed: ${endpoint}`,
            endpointError?.response
              ?.status
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

      const data =
        getListData(response);

      /*
       * Only keep valid TeacherProfile records.
       *
       * A valid teacher must have an ID because
       * class_teacher expects TeacherProfile.id.
       */

      const validTeachers =
        Array.isArray(data)
          ? data.filter(
              (teacher) =>
                Boolean(
                  getTeacherId(
                    teacher
                  )
                )
            )
          : [];

      console.log(
        "VALID TEACHER PROFILES:",
        validTeachers
      );

      setTeachers(
        validTeachers
      );
    } catch (err) {
      console.error(
        "Failed to load teacher profiles:",
        err
      );

      setTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
  };

  // =====================================================
  // OPEN CREATE MODAL
  // =====================================================

  const openCreateModal = async () => {
    setEditingClass(null);

    setFormData({
      grade: "",
      stream: "",
      capacity: "",
      class_teacher: "",
    });

    setFormError("");
    setShowModal(true);

    /*
     * Make sure teachers are available.
     */

    if (
      teachers.length === 0 &&
      !loadingTeachers
    ) {
      await loadTeachers();
    }
  };

  // =====================================================
  // OPEN EDIT MODAL
  // =====================================================

  const openEditModal = async (cls) => {
    if (!cls) {
      return;
    }

    setEditingClass(cls);

    // =================================================
    // NORMALIZE CLASS TEACHER
    // =================================================

    let selectedTeacher = "";

    /*
     * First check class_teacher_id.
     */

    if (
      cls.class_teacher_id !==
        null &&
      cls.class_teacher_id !==
        undefined &&
      cls.class_teacher_id !== ""
    ) {
      selectedTeacher =
        cls.class_teacher_id;
    }

    /*
     * Otherwise check class_teacher.
     */

    else if (
      cls.class_teacher !==
        null &&
      cls.class_teacher !==
        undefined &&
      cls.class_teacher !== ""
    ) {
      selectedTeacher =
        cls.class_teacher;
    }

    /*
     * If class_teacher is an object:
     *
     * {
     *   id: 2,
     *   teacher_name: "Dancan Manyasi"
     * }
     *
     * extract the TeacherProfile ID.
     */

    if (
      selectedTeacher &&
      typeof selectedTeacher ===
        "object"
    ) {
      selectedTeacher =
        getTeacherId(
          selectedTeacher
        );
    }

    /*
     * Normalize the value to string because
     * HTML select option values are strings.
     */

    selectedTeacher =
      selectedTeacher !== null &&
      selectedTeacher !== undefined
        ? String(selectedTeacher)
        : "";

    console.log(
      "===================================="
    );

    console.log(
      "EDITING CLASS:",
      cls
    );

    console.log(
      "CLASS TEACHER:",
      cls.class_teacher
    );

    console.log(
      "CLASS TEACHER ID:",
      cls.class_teacher_id
    );

    console.log(
      "NORMALIZED TEACHER ID:",
      selectedTeacher
    );

    console.log(
      "AVAILABLE TEACHERS:",
      teachers
    );

    console.log(
      "===================================="
    );

    setFormData({
      grade: cls.grade || "",
      stream: cls.stream || "",
      capacity:
        cls.capacity ?? "",
      class_teacher:
        selectedTeacher,
    });

    setFormError("");
    setShowModal(true);

    /*
     * IMPORTANT:
     *
     * If teachers have not loaded yet, load them
     * before the user submits the edit.
     */

    if (
      teachers.length === 0 &&
      !loadingTeachers
    ) {
      await loadTeachers();
    }
  };

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingClass(null);

    setFormData({
      grade: "",
      stream: "",
      capacity: "",
      class_teacher: "",
    });

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

    setFormData(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };

  // =====================================================
  // VALIDATE FORM
  // =====================================================

  const validateForm = () => {
    if (
      !formData.grade.trim()
    ) {
      setFormError(
        "Please select a grade."
      );

      return false;
    }

    if (
      !formData.stream.trim()
    ) {
      setFormError(
        "Please select a stream."
      );

      return false;
    }

    const capacity =
      Number(
        formData.capacity
      );

    if (
      !formData.capacity ||
      Number.isNaN(capacity) ||
      capacity < 1
    ) {
      setFormError(
        "Please enter a valid class capacity."
      );

      return false;
    }

    if (capacity > 100) {
      setFormError(
        "Class capacity cannot exceed 100 students."
      );

      return false;
    }

    return true;
  };

  // =====================================================
  // CREATE / UPDATE CLASS
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setFormError("");

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      // =================================================
      // PAYLOAD
      // =================================================

      const payload = {
        grade:
          formData.grade.trim(),

        stream:
          formData.stream
            .trim()
            .toUpperCase(),

        capacity:
          Number(
            formData.capacity
          ),

        /*
         * TeacherProfile ID.
         *
         * Empty means no class teacher.
         */

        class_teacher:
          formData.class_teacher
            ? Number(
                formData.class_teacher
              )
            : null,
      };

      console.log(
        "===================================="
      );

      console.log(
        editingClass
          ? "UPDATING CLASS"
          : "CREATING CLASS"
      );

      console.log(
        "CLASS PAYLOAD:",
        payload
      );

      console.log(
        "SELECTED TEACHER ID:",
        formData.class_teacher
      );

      console.log(
        "===================================="
      );

      // =================================================
      // CREATE
      // =================================================

      if (!editingClass) {
        await api.post(
          "classes/create/",
          payload
        );
      }

      // =================================================
      // UPDATE
      // =================================================

      else {
        await api.patch(
          `classes/update/${editingClass.id}/`,
          payload
        );
      }

      // =================================================
      // CLOSE
      // =================================================

      closeModal();

      // =================================================
      // REFRESH
      // =================================================

      await loadClasses();
    } catch (err) {
      console.error(
        editingClass
          ? "Failed to update class:"
          : "Failed to create class:",
        err
      );

      showBackendError(
        err,
        editingClass
          ? "Failed to update class."
          : "Failed to create class."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // BACKEND ERROR
  // =====================================================

  const showBackendError = (
    err,
    fallbackMessage
  ) => {
    const backendError =
      err?.response?.data;

    if (!backendError) {
      setFormError(
        fallbackMessage
      );

      return;
    }

    if (
      typeof backendError ===
      "string"
    ) {
      setFormError(
        backendError
      );

      return;
    }

    if (
      backendError.detail
    ) {
      setFormError(
        String(
          backendError.detail
        )
      );

      return;
    }

    if (
      backendError.message
    ) {
      setFormError(
        String(
          backendError.message
        )
      );

      return;
    }

    const messages =
      Object.entries(
        backendError
      )
        .map(
          ([field, value]) => {
            const message =
              Array.isArray(
                value
              )
                ? value.join(" ")
                : String(value);

            return `${field}: ${message}`;
          }
        )
        .join(" ");

    setFormError(
      messages ||
        fallbackMessage
    );
  };

  // =====================================================
  // DELETE CLASS
  // =====================================================

  const handleDelete = async (
    cls
  ) => {
    const className =
      `${cls.grade}${
        cls.stream
          ? ` - ${cls.stream}`
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
      setDeletingId(cls.id);

      await api.delete(
        `classes/delete/${cls.id}/`
      );

      setClasses(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !== cls.id
          )
      );
    } catch (err) {
      console.error(
        "Failed to delete class:",
        err
      );

      const backendError =
        err?.response?.data;

      let message =
        "Failed to delete class.";

      if (
        typeof backendError ===
        "string"
      ) {
        message =
          backendError;
      } else if (
        backendError?.detail
      ) {
        message =
          backendError.detail;
      } else if (
        backendError
      ) {
        message =
          Object.entries(
            backendError
          )
            .map(
              ([field, value]) =>
                `${field}: ${
                  Array.isArray(
                    value
                  )
                    ? value.join(
                        " "
                      )
                    : value
                }`
            )
            .join("\n");
      }

      window.alert(
        message
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =====================================================
  // FILTER
  // =====================================================

  const filteredClasses =
    classes.filter(
      (cls) => {
        const grade =
          cls.grade?.toLowerCase() ||
          "";

        const stream =
          cls.stream?.toLowerCase() ||
          "";

        const teacher =
          cls.class_teacher_name?.toLowerCase() ||
          "";

        const search =
          searchTerm
            .toLowerCase()
            .trim();

        return (
          grade.includes(
            search
          ) ||
          stream.includes(
            search
          ) ||
          teacher.includes(
            search
          )
        );
      }
    );

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-green-600 mx-auto mb-4"></div>

          <p className="text-lg text-gray-500">
            Loading classes...
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

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

        <div>
          <h1 className="text-[clamp(1.5rem,3vw,2.2rem)] font-bold text-gray-800">
            Manage Classes
          </h1>

          <p className="text-gray-500 mt-2">
            Create, edit, view and delete school classes
          </p>
        </div>

        <div className="flex flex-wrap gap-3">

          <button
            type="button"
            onClick={() =>
              navigate(
                "/academic-coordinator"
              )
            }
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <i className="bi bi-arrow-left"></i>
            Dashboard
          </button>

          <button
            type="button"
            onClick={
              openCreateModal
            }
            className="milk-btn"
          >
            <i className="bi bi-plus-lg mr-2"></i>
            Create Class
          </button>

        </div>

      </div>

      {/* =================================================
          SEARCH
      ================================================= */}

      <div className="card">

        <input
          type="text"
          placeholder="Search by grade, stream or class teacher..."
          className="milk-input max-w-xl"
          value={searchTerm}
          onChange={(e) =>
            setSearchTerm(
              e.target.value
            )
          }
        />

      </div>

      {/* =================================================
          CLASS CARDS
      ================================================= */}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

        {filteredClasses.length ===
        0 ? (
          <div className="card col-span-full text-center py-12">

            <div className="text-5xl mb-4">
              🏫
            </div>

            <p className="text-gray-500">
              No classes found.
            </p>

          </div>
        ) : (
          filteredClasses.map(
            (cls) => {

              const totalStudents =
                Number(
                  cls.total_students
                ) || 0;

              const capacity =
                Number(
                  cls.capacity
                ) || 0;

              const availableSpaces =
                Math.max(
                  capacity -
                    totalStudents,
                  0
                );

              const isDeleting =
                deletingId ===
                cls.id;

              return (
                <div
                  key={cls.id}
                  className="card hover:shadow-lg transition-shadow"
                >

                  {/* CARD HEADER */}

                  <div className="flex items-start justify-between gap-3 mb-4">

                    <div>

                      <h3 className="text-xl font-semibold text-gray-800">
                        {cls.grade}

                        {cls.stream &&
                          ` - ${cls.stream}`}
                      </h3>

                      <p className="text-sm text-gray-400 mt-1">
                        Class ID: {cls.id}
                      </p>

                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        availableSpaces ===
                        0
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {availableSpaces ===
                      0
                        ? "Full"
                        : "Available"}
                    </span>

                  </div>

                  {/* CLASS INFORMATION */}

                  <div className="space-y-2 mb-5 text-gray-600">

                    <p>
                      <span className="font-medium">
                        Class Teacher:
                      </span>{" "}

                      {cls.class_teacher_name ||
                        "Not assigned"}
                    </p>

                    <p>
                      <span className="font-medium">
                        Students:
                      </span>{" "}

                      {totalStudents}
                    </p>

                    <p>
                      <span className="font-medium">
                        Capacity:
                      </span>{" "}

                      {capacity}
                    </p>

                    <p>
                      <span className="font-medium">
                        Available:
                      </span>{" "}

                      {availableSpaces}
                    </p>

                  </div>

                  {/* ACTIONS */}

                  <div className="grid grid-cols-3 gap-2">

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/academic-coordinator/classes-details/${cls.id}`
                        )
                      }
                      className="px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm"
                    >
                      <i className="bi bi-eye mr-1"></i>
                      View
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        openEditModal(
                          cls
                        )
                      }
                      disabled={
                        isDeleting
                      }
                      className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 text-sm"
                    >
                      <i className="bi bi-pencil mr-1"></i>
                      Edit
                    </button>

                    <button
                      type="button"
                      disabled={
                        isDeleting
                      }
                      onClick={() =>
                        handleDelete(
                          cls
                        )
                      }
                      className="px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 text-sm"
                    >
                      <i className="bi bi-trash mr-1"></i>

                      {isDeleting
                        ? "..."
                        : "Delete"}
                    </button>

                  </div>

                </div>
              );
            }
          )
        )}

      </div>

      {/* =================================================
          CREATE / EDIT MODAL
      ================================================= */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">

          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between px-6 py-5 border-b">

              <div>

                <h2 className="text-xl font-bold text-gray-800">
                  {editingClass
                    ? "Edit Class"
                    : "Create New Class"}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {editingClass
                    ? "Update class information"
                    : "Add a new class to the school"}
                </p>

              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                disabled={saving}
                className="text-gray-400 hover:text-gray-700 text-2xl disabled:opacity-50"
              >
                ×
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleSubmit
              }
              className="p-6 space-y-5"
            >

              {/* ERROR */}

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
                  value={
                    formData.grade
                  }
                  onChange={
                    handleChange
                  }
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
                  value={
                    formData.stream
                  }
                  onChange={
                    handleChange
                  }
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
                  value={
                    formData.capacity
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="e.g. 40"
                  min="1"
                  max="100"
                  className="milk-input w-full"
                  required
                />

                <p className="text-xs text-gray-500 mt-1">
                  Maximum 100 students.
                </p>

              </div>

              {/* =================================================
                  CLASS TEACHER
              ================================================= */}

              <div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Teacher
                </label>

                <select
                  name="class_teacher"
                  value={
                    formData.class_teacher
                  }
                  onChange={
                    handleChange
                  }
                  className="milk-input w-full"
                  disabled={
                    loadingTeachers
                  }
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
                          key={
                            teacherId
                          }
                          value={
                            teacherId
                          }
                        >
                          {getTeacherName(
                            teacher
                          )}
                        </option>
                      );
                    }
                  )}

                </select>

                {/* LOADING */}

                {loadingTeachers && (
                  <p className="text-xs text-gray-500 mt-2">
                    Loading teacher profiles...
                  </p>
                )}

                {/* EMPTY */}

                {!loadingTeachers &&
                  teachers.length ===
                    0 && (
                    <div className="mt-2">

                      <p className="text-xs text-orange-600">
                        No teacher profiles were found.
                      </p>

                      <button
                        type="button"
                        onClick={
                          loadTeachers
                        }
                        className="text-xs text-blue-600 hover:underline mt-1"
                      >
                        Retry loading teachers
                      </button>

                    </div>
                  )}

                {/* TEACHER COUNT */}

                {!loadingTeachers &&
                  teachers.length >
                    0 && (
                    <p className="text-xs text-green-600 mt-2">
                      {teachers.length} teacher
                      {teachers.length !==
                      1
                        ? "s"
                        : ""}{" "}
                      available.
                    </p>
                  )}

                <p className="text-xs text-gray-500 mt-2">
                  Select the teacher responsible
                  for this class. Subject teaching
                  assignments are managed separately.
                </p>

              </div>

              {/* BUTTONS */}

              <div className="flex flex-col sm:flex-row gap-3 pt-3">

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={saving}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    loadingTeachers
                  }
                  className="milk-btn w-full disabled:opacity-50"
                >
                  {saving
                    ? editingClass
                      ? "Updating Class..."
                      : "Creating Class..."
                    : editingClass
                    ? "Update Class"
                    : "Create Class"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
};

export default AcademicCoClasses;