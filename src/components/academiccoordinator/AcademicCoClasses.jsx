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
  const [searchTerm, setSearchTerm] = useState("");


  const [error, setError] = useState("");


  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);


  // Saving / deleting
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);


  // Form
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
  // STREAMS
  // =====================================================


  const streams = ["A", "B", "C"];


  // =====================================================
  // NORMALIZE API RESPONSE
  // =====================================================


  const getListData = (res) => {
    return res?.data?.results || res?.data || [];
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


    return String(teacher.id || "");
  };


  // =====================================================
  // GET TEACHER NAME
  // =====================================================


  const getTeacherName = (cls) => {
    // Backend display field
    if (
      cls?.class_teacher_name &&
      String(cls.class_teacher_name).trim()
    ) {
      return String(cls.class_teacher_name).trim();
    }


    // Nested teacher object
    if (
      cls?.class_teacher &&
      typeof cls.class_teacher === "object"
    ) {
      const teacher = cls.class_teacher;


      if (teacher.teacher_name) {
        return teacher.teacher_name;
      }


      if (teacher.full_name) {
        return teacher.full_name;
      }


      if (
        teacher.first_name ||
        teacher.last_name
      ) {
        return `${teacher.first_name || ""} ${
          teacher.last_name || ""
        }`.trim();
      }


      if (teacher.user) {
        const user = teacher.user;


        const fullName =
          `${user.first_name || ""} ${
            user.last_name || ""
          }`.trim();


        if (fullName) {
          return fullName;
        }


        if (user.username) {
          return user.username;
        }
      }


      if (teacher.employee_number) {
        return teacher.employee_number;
      }
    }


    return "Not assigned";
  };


  // =====================================================
  // GET CLASS NAME
  // =====================================================


  const getClassName = (cls) => {
    const grade = String(
      cls?.grade || ""
    ).trim();


    const stream = String(
      cls?.stream || ""
    ).trim();


    if (!grade) {
      return "Unnamed Class";
    }


    return stream
      ? `${grade} - ${stream}`
      : grade;
  };


  // =====================================================
  // LOAD CLASSES — COUNT STUDENTS DIRECTLY FROM STUDENTS ENDPOINT
  // =====================================================


  const loadClasses = async () => {
    try {
      setLoading(true);
      setError("");


      // -------------------------------------------------
      // LOAD CLASSES + STUDENTS TOGETHER
      // -------------------------------------------------
      const [classRes, studentRes] = await Promise.all([
        api.get("classes/"),
        api.get("students/"),
      ]);

      const classList = getListData(classRes);
      const studentList = getListData(studentRes);


      // -------------------------------------------------
      // COUNT STUDENTS BY CLASSROOM ID
      // -------------------------------------------------
      const studentCountMap = {};
      if (Array.isArray(studentList)) {
        studentList.forEach((student) => {
          const classroomId = student?.classroom;
          if (
            classroomId !== null &&
            classroomId !== undefined &&
            classroomId !== ""
          ) {
            const key = String(classroomId);
            studentCountMap[key] =
              (studentCountMap[key] || 0) + 1;
          }
        });
      }
      console.log(
        "📊 Student count by classroom:",
        studentCountMap
      );


      // -------------------------------------------------
      // ENRICH CLASS DATA
      // -------------------------------------------------
      const enriched = Array.isArray(classList)
        ? classList.map((cls) => {
            const classId = String(cls.id);
            const studentCount = studentCountMap[classId] || 0;
            return {
              ...cls,
              total_students: studentCount,
            };
          })
        : [];

      console.log(
        "🏫 Classes with student counts:",
        enriched
      );

      setClasses(enriched);

    } catch (err) {
      console.error(
        "❌ Load classes error:",
        err
      );


      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Failed to load classes. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };


  // =====================================================
  // LOAD TEACHERS
  // =====================================================


  const loadTeachers = async () => {
    try {
      const teacherRes = await api.get(
        "accounts/teacher-profiles/"
      );


      const teacherList =
        getListData(teacherRes);


      setTeachers(
        Array.isArray(teacherList)
          ? teacherList
          : []
      );
    } catch (err) {
      console.warn(
        "⚠️ Teachers load failed:",
        err
      );
    }
  };


  // =====================================================
  // INITIAL LOAD
  // =====================================================


  useEffect(() => {
    loadClasses();
    loadTeachers();
  }, []);


  // =====================================================
  // OPEN CREATE MODAL
  // =====================================================


  const openCreateModal = () => {
    setEditingClass(null);


    setFormData({
      grade: "",
      stream: "",
      capacity: "",
      class_teacher: "",
    });


    setFormError("");
    setShowModal(true);
  };


  // =====================================================
  // OPEN EDIT MODAL
  // =====================================================


  const openEditModal = (cls) => {
    if (!cls?.id) {
      return;
    }


    setEditingClass(cls);


    let teacherId = "";


    if (
      cls.class_teacher &&
      typeof cls.class_teacher === "object"
    ) {
      teacherId = getTeacherId(
        cls.class_teacher
      );
    } else if (cls.class_teacher) {
      teacherId = String(
        cls.class_teacher
      );
    }


    setFormData({
      grade: cls.grade || "",
      stream: cls.stream || "",
      capacity:
        cls.capacity !== null &&
        cls.capacity !== undefined
          ? String(cls.capacity)
          : "",
      class_teacher: teacherId,
    });


    setFormError("");
    setShowModal(true);
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


    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  // =====================================================
  // CREATE / UPDATE CLASS
  // =====================================================


  const handleSubmit = async (e) => {
    e.preventDefault();


    setFormError("");
    setError("");


    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------


    if (!formData.grade) {
      setFormError(
        "Please select a grade."
      );
      return;
    }


    if (!formData.stream) {
      setFormError(
        "Please select a stream."
      );
      return;
    }


    if (!formData.capacity) {
      setFormError(
        "Please enter the class capacity."
      );
      return;
    }


    const capacityNumber = Number(
      formData.capacity
    );


    if (
      Number.isNaN(capacityNumber) ||
      capacityNumber < 1
    ) {
      setFormError(
        "Capacity must be a valid number greater than 0."
      );
      return;
    }


    try {
      setSaving(true);


      // -------------------------------------------------
      // PAYLOAD
      // -------------------------------------------------


      const payload = {
        grade: formData.grade,
        stream:
          String(formData.stream)
            .toUpperCase()
            .trim(),
        capacity: capacityNumber,
        class_teacher:
          formData.class_teacher
            ? Number(
                formData.class_teacher
              )
            : null,
      };


      console.log(
        "📤 Class payload:",
        payload
      );


      // -------------------------------------------------
      // UPDATE EXISTING CLASS
      // -------------------------------------------------


      if (editingClass) {
        console.log(
          "✏️ Updating class:",
          editingClass.id
        );


        await api.patch(
          `classes/update/${editingClass.id}/`,
          payload
        );


      // -------------------------------------------------
      // CREATE NEW CLASS
      // -------------------------------------------------


      } else {
        console.log(
          "➕ Creating class"
        );


        await api.post(
          "classes/create/",
          payload
        );
      }


      // -------------------------------------------------
      // CLOSE MODAL
      // -------------------------------------------------


      setShowModal(false);
      setEditingClass(null);


      setFormData({
        grade: "",
        stream: "",
        capacity: "",
        class_teacher: "",
      });


      setFormError("");


      // -------------------------------------------------
      // RELOAD CLASSES
      // -------------------------------------------------


      await loadClasses();


    } catch (err) {
      console.error(
        "❌ Save class error:",
        err
      );


      console.error(
        "Response:",
        err?.response?.data
      );


      const backendError =
        err?.response?.data;


      if (
        backendError &&
        typeof backendError === "object"
      ) {
        const messages = Object.entries(
          backendError
        )
          .map(([field, message]) => {
            if (Array.isArray(message)) {
              return `${field}: ${message.join(
                ", "
              )}`;
            }


            return `${field}: ${message}`;
          })
          .join(" | ");


        setFormError(
          messages ||
            "Failed to save class."
        );
      } else {
        setFormError(
          "Failed to save class. Please try again."
        );
      }
    } finally {
      setSaving(false);
    }
  };


  // =====================================================
  // DELETE CLASS
  // =====================================================


  const handleDeleteClass = async (cls) => {
    if (!cls?.id) {
      return;
    }


    const className =
      getClassName(cls);


    const confirmed =
      window.confirm(
        `Are you sure you want to delete ${className}?\n\nThis action cannot be undone.`
      );


    if (!confirmed) {
      return;
    }


    try {
      setDeletingId(cls.id);
      setError("");


      console.log(
        "🗑️ Deleting class:",
        cls.id
      );


      await api.delete(
        `classes/delete/${cls.id}/`
      );


      // Remove immediately from UI
      setClasses((prev) =>
        prev.filter(
          (item) =>
            item.id !== cls.id
        )
      );


    } catch (err) {
      console.error(
        "❌ Delete class failed:",
        err
      );


      console.error(
        "Response:",
        err?.response?.data
      );


      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Failed to delete this class. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  };


  // =====================================================
  // VIEW CLASS
  // =====================================================


  const handleViewClass = (id) => {
    if (!id) {
      return;
    }


    navigate(
      `/academic-coordinator/classes-details/${id}`
    );
  };


  // =====================================================
  // FILTER CLASSES
  // =====================================================


  const filtered = classes.filter(
    (cls) => {
      const q =
        searchTerm
          .toLowerCase()
          .trim();


      if (!q) {
        return true;
      }


      return (
        String(cls.grade || "")
          .toLowerCase()
          .includes(q) ||
        String(cls.stream || "")
          .toLowerCase()
          .includes(q) ||
        getClassName(cls)
          .toLowerCase()
          .includes(q) ||
        getTeacherName(cls)
          .toLowerCase()
          .includes(q)
      );
    }
  );


  // =====================================================
  // LOADING
  // =====================================================


  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">


          <div className="relative mx-auto w-14 h-14 mb-5">


            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>


            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 border-r-purple-500 animate-spin"></div>


          </div>


          <h2 className="text-lg font-semibold text-gray-800">
            Loading classes...
          </h2>


          <p className="text-sm text-gray-500 mt-1">
            Please wait while we load your classes.
          </p>


        </div>
      </div>
    );
  }


  // =====================================================
  // RENDER
  // =====================================================


  return (
    <div className="w-full space-y-6 md:space-y-8">


      {/* =================================================
          HEADER
      ================================================= */}


      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 sm:p-7 lg:p-8 text-white shadow-lg">


        {/* Decorative circles */}


        <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full"></div>


        <div className="absolute -bottom-20 right-20 w-40 h-40 bg-white/5 rounded-full"></div>


        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">


          <div>


            <div className="flex items-center gap-3 mb-3">


              <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">


                <i className="bi bi-building text-2xl"></i>


              </div>


              <span className="text-sm font-semibold uppercase tracking-wider text-blue-100">
                Academic Management
              </span>


            </div>


            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              Manage Classes
            </h1>


            <p className="text-blue-100 mt-2 text-sm sm:text-base max-w-2xl">
              Create, edit, view and manage
              your school's classes,
              teachers and student capacity.
            </p>


          </div>


          {/* HEADER ACTIONS */}


          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">


            {/* CREATE BUTTON */}


            <button
              type="button"
              onClick={openCreateModal}
              className="
                flex
                items-center
                justify-center
                gap-2
                px-5
                py-3
                rounded-xl
                bg-white
                text-blue-700
                font-semibold
                shadow-sm
                hover:bg-blue-50
                transition
              "
            >
              <i className="bi bi-plus-lg"></i>
              Create Class
            </button>


            {/* CLASS COUNT */}


            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-5 py-4 border border-white/10">


              <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center">


                <i className="bi bi-collection-fill text-xl"></i>


              </div>


              <div>


                <p className="text-blue-100 text-xs uppercase tracking-wide">
                  Total Classes
                </p>


                <p className="text-2xl font-bold">
                  {classes.length}
                </p>


              </div>


            </div>


          </div>


        </div>
      </div>


      {/* =================================================
          ERROR
      ================================================= */}


      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">


          <div className="flex items-start gap-3">


            <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">


              <i className="bi bi-exclamation-triangle-fill"></i>


            </div>


            <div>


              <p className="font-semibold">
                Something went wrong
              </p>


              <p className="text-sm mt-1">
                {error}
              </p>


            </div>


          </div>
        </div>
      )}


      {/* =================================================
          SEARCH / TOOLBAR
      ================================================= */}


      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">


        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">


          {/* SEARCH */}


          <div className="relative w-full lg:max-w-xl">


            <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>


            <input
              type="text"
              placeholder="Search classes, streams or teachers..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(
                  e.target.value
                )
              }
              className="
                w-full
                pl-11
                pr-10
                py-3
                rounded-xl
                border
                border-gray-200
                bg-gray-50
                text-gray-800
                placeholder-gray-400
                outline-none
                focus:bg-white
                focus:border-blue-500
                focus:ring-4
                focus:ring-blue-100
                transition
              "
            />


            {searchTerm && (
              <button
                type="button"
                onClick={() =>
                  setSearchTerm("")
                }
                className="
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  w-7
                  h-7
                  rounded-full
                  text-gray-400
                  hover:bg-gray-200
                  hover:text-gray-700
                  transition
                "
              >
                <i className="bi bi-x"></i>
              </button>
            )}


          </div>


          {/* RESULTS */}


          <div className="flex items-center gap-2 text-sm">


            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">


              <i className="bi bi-grid-3x3-gap-fill"></i>


            </div>


            <span className="text-gray-500">
              Showing
            </span>


            <span className="font-bold text-gray-800">
              {filtered.length}
            </span>


            <span className="text-gray-500">
              of {classes.length}
            </span>


          </div>


        </div>
      </div>


      {/* =================================================
          EMPTY STATE
      ================================================= */}


      {filtered.length === 0 ? (


        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm py-16 px-6 text-center">


          <div className="w-20 h-20 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-5">


            <i className="bi bi-building text-3xl text-gray-400"></i>


          </div>


          <h2 className="text-xl font-bold text-gray-800">
            No classes found
          </h2>


          <p className="text-gray-500 mt-2 max-w-md mx-auto">
            {searchTerm
              ? "No classes match your search. Try a different search term."
              : "There are currently no classes registered in the system."}
          </p>


          <div className="flex items-center justify-center gap-3 mt-5">


            {searchTerm && (
              <button
                type="button"
                onClick={() =>
                  setSearchTerm("")
                }
                className="
                  px-5
                  py-2.5
                  rounded-xl
                  bg-gray-100
                  text-gray-700
                  font-medium
                  hover:bg-gray-200
                  transition
                "
              >
                Clear Search
              </button>
            )}


            {!searchTerm && (
              <button
                type="button"
                onClick={
                  openCreateModal
                }
                className="
                  px-5
                  py-2.5
                  rounded-xl
                  bg-blue-600
                  text-white
                  font-medium
                  hover:bg-blue-700
                  transition
                "
              >
                <i className="bi bi-plus-lg mr-2"></i>
                Create Class
              </button>
            )}


          </div>


        </div>


      ) : (


        /* =================================================
           CLASS GRID
        ================================================= */


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 xl:gap-6">


          {filtered.map((cls) => {


            const total =
              Number(
                cls.total_students
              ) || 0;


            const capacity =
              Number(
                cls.capacity
              ) || 0;


            const available =
              Math.max(
                capacity - total,
                0
              );


            const percentage =
              capacity > 0
                ? Math.min(
                    (total /
                      capacity) *
                      100,
                    100
                  )
                : 0;


            const teacher =
              getTeacherName(cls);


            const isFull =
              available === 0 &&
              capacity > 0;


            const isAlmostFull =
              percentage >= 80 &&
              !isFull;


            const isDeleting =
              deletingId === cls.id;


            return (
              <div
                key={cls.id}
                className="
                  group
                  bg-white
                  rounded-2xl
                  border
                  border-gray-200
                  shadow-sm
                  hover:shadow-xl
                  hover:-translate-y-1
                  transition-all
                  duration-300
                  overflow-hidden
                "
              >


                {/* =================================================
                    CARD TOP
                ================================================= */}


                <div className="relative p-5 pb-4">


                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-600"></div>


                  <div className="flex items-start justify-between gap-3">


                    <div className="min-w-0">


                      <div className="flex items-center gap-3">


                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-600 flex items-center justify-center flex-shrink-0">


                          <i className="bi bi-building-fill text-xl"></i>


                        </div>


                        <div className="min-w-0">


                          <h3 className="text-lg sm:text-xl font-bold text-gray-800 truncate">
                            {getClassName(cls)}
                          </h3>


                          <p className="text-xs text-gray-400 mt-0.5">
                            Class ID: {cls.id}
                          </p>


                        </div>


                      </div>


                    </div>


                    {/* STATUS */}


                    <div
                      className={`
                        flex-shrink-0
                        px-2.5
                        py-1
                        rounded-full
                        text-xs
                        font-semibold
                        ${
                          isFull
                            ? "bg-red-50 text-red-600"
                            : isAlmostFull
                            ? "bg-yellow-50 text-yellow-700"
                            : "bg-green-50 text-green-600"
                        }
                      `}
                    >
                      {isFull
                        ? "Full"
                        : isAlmostFull
                        ? "Almost Full"
                        : "Available"}
                    </div>


                  </div>
                </div>


                {/* =================================================
                    TEACHER
                ================================================= */}


                <div className="px-5">


                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">


                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">


                      <i className="bi bi-person-badge-fill"></i>


                    </div>


                    <div className="min-w-0">


                      <p className="text-xs text-gray-400 uppercase tracking-wide">
                        Class Teacher
                      </p>


                      <p
                        className={`
                          text-sm
                          font-semibold
                          truncate
                          ${
                            teacher ===
                            "Not assigned"
                              ? "text-gray-400"
                              : "text-gray-800"
                          }
                        `}
                      >
                        {teacher}
                      </p>


                    </div>


                  </div>


                </div>


                {/* =================================================
                    STUDENT STATS
                ================================================= */}


                <div className="p-5">


                  <div className="grid grid-cols-3 gap-2">


                    {/* STUDENTS */}


                    <div className="rounded-xl bg-blue-50 p-3 text-center">


                      <div className="w-8 h-8 mx-auto rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-1">


                        <i className="bi bi-people-fill"></i>


                      </div>


                      <p className="text-xl font-bold text-gray-800">
                        {total}
                      </p>


                      <p className="text-[11px] text-gray-500">
                        Students
                      </p>


                    </div>


                    {/* CAPACITY */}


                    <div className="rounded-xl bg-purple-50 p-3 text-center">


                      <div className="w-8 h-8 mx-auto rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-1">


                        <i className="bi bi-bar-chart-fill"></i>


                      </div>


                      <p className="text-xl font-bold text-gray-800">
                        {capacity}
                      </p>


                      <p className="text-[11px] text-gray-500">
                        Capacity
                      </p>


                    </div>


                    {/* AVAILABLE */}


                    <div
                      className={`
                        rounded-xl
                        p-3
                        text-center
                        ${
                          isFull
                            ? "bg-red-50"
                            : "bg-green-50"
                        }
                      `}
                    >


                      <div
                        className={`
                          w-8
                          h-8
                          mx-auto
                          rounded-lg
                          flex
                          items-center
                          justify-center
                          mb-1
                          ${
                            isFull
                              ? "bg-red-100 text-red-600"
                              : "bg-green-100 text-green-600"
                          }
                        `}
                      >
                        <i className="bi bi-person-plus-fill"></i>
                      </div>


                      <p className="text-xl font-bold text-gray-800">
                        {available}
                      </p>


                      <p className="text-[11px] text-gray-500">
                        Available
                      </p>


                    </div>


                  </div>


                  {/* CAPACITY PROGRESS */}


                  <div className="mt-5">


                    <div className="flex items-center justify-between mb-2">


                      <span className="text-xs font-medium text-gray-500">
                        Class occupancy
                      </span>


                      <span className="text-xs font-bold text-gray-700">
                        {Math.round(
                          percentage
                        )}
                        %
                      </span>


                    </div>


                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">


                      <div
                        className={`
                          h-full
                          rounded-full
                          transition-all
                          duration-500
                          ${
                            percentage >=
                            100
                              ? "bg-red-500"
                              : percentage >=
                                80
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }
                        `}
                        style={{
                          width: `${percentage}%`,
                        }}
                      />


                    </div>


                  </div>


                </div>


                {/* =================================================
                    ACTIONS
                ================================================= */}


                <div className="border-t border-gray-100 bg-gray-50/70 p-4">


                  <div className="grid grid-cols-3 gap-2">


                    {/* VIEW */}


                    <button
                      type="button"
                      onClick={() =>
                        handleViewClass(
                          cls.id
                        )
                      }
                      disabled={isDeleting}
                      className="
                        flex
                        items-center
                        justify-center
                        gap-1.5
                        px-3
                        py-2.5
                        rounded-xl
                        bg-white
                        border
                        border-gray-200
                        text-gray-700
                        text-sm
                        font-medium
                        hover:bg-blue-50
                        hover:border-blue-200
                        hover:text-blue-600
                        disabled:opacity-50
                        transition
                      "
                    >
                      <i className="bi bi-eye"></i>


                      <span className="hidden sm:inline">
                        View
                      </span>
                    </button>


                    {/* EDIT */}


                    <button
                      type="button"
                      onClick={() =>
                        openEditModal(
                          cls
                        )
                      }
                      disabled={isDeleting}
                      className="
                        flex
                        items-center
                        justify-center
                        gap-1.5
                        px-3
                        py-2.5
                        rounded-xl
                        bg-blue-600
                        text-white
                        text-sm
                        font-medium
                        hover:bg-blue-700
                        disabled:opacity-50
                        shadow-sm
                        hover:shadow
                        transition
                      "
                    >
                      <i className="bi bi-pencil-square"></i>


                      <span className="hidden sm:inline">
                        Edit
                      </span>
                    </button>


                    {/* DELETE */}


                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() =>
                        handleDeleteClass(
                          cls
                        )
                      }
                      className="
                        flex
                        items-center
                        justify-center
                        gap-1.5
                        px-3
                        py-2.5
                        rounded-xl
                        bg-red-50
                        border
                        border-red-100
                        text-red-600
                        text-sm
                        font-medium
                        hover:bg-red-600
                        hover:text-white
                        hover:border-red-600
                        disabled:opacity-50
                        disabled:cursor-not-allowed
                        transition
                      "
                    >
                      {isDeleting ? (
                        <>
                          <span className="
                            inline-block
                            w-4
                            h-4
                            rounded-full
                            border-2
                            border-red-400
                            border-t-transparent
                            animate-spin
                          "></span>


                          <span className="hidden sm:inline">
                            Deleting
                          </span>
                        </>
                      ) : (
                        <>
                          <i className="bi bi-trash3"></i>


                          <span className="hidden sm:inline">
                            Delete
                          </span>
                        </>
                      )}
                    </button>


                  </div>


                </div>


              </div>
            );
          })}


        </div>
      )}


      {/* =====================================================
          CREATE / EDIT MODAL
      ===================================================== */}


      {showModal && (
        <div
          className="
            fixed
            inset-0
            bg-black/50
            backdrop-blur-sm
            flex
            items-center
            justify-center
            z-50
            p-4
          "
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget &&
              !saving
            ) {
              closeModal();
            }
          }}
        >


          <div
            className="
              bg-white
              rounded-2xl
              w-full
              max-w-lg
              max-h-[90vh]
              overflow-y-auto
              shadow-2xl
            "
          >


            {/* MODAL HEADER */}


            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">


              <div>


                <h2 className="text-xl font-bold text-gray-800">
                  {editingClass
                    ? "Edit Class"
                    : "Create New Class"}
                </h2>


                <p className="text-sm text-gray-500 mt-1">
                  {editingClass
                    ? "Update the class information below."
                    : "Enter the details for the new class."}
                </p>


              </div>


              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="
                  w-9
                  h-9
                  rounded-lg
                  flex
                  items-center
                  justify-center
                  text-gray-400
                  hover:bg-gray-100
                  hover:text-gray-700
                  disabled:opacity-50
                  transition
                "
              >
                <i className="bi bi-x-lg"></i>
              </button>


            </div>


            {/* MODAL BODY */}


            <div className="p-6">


              {/* FORM ERROR */}


              {formError && (
                <div className="
                  mb-5
                  rounded-xl
                  border
                  border-red-200
                  bg-red-50
                  p-4
                  text-red-700
                ">


                  <div className="flex items-start gap-3">


                    <i className="bi bi-exclamation-circle-fill mt-0.5"></i>


                    <div className="text-sm">
                      {formError}
                    </div>


                  </div>


                </div>
              )}


              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >


                {/* GRADE */}


                <div>


                  <label className="
                    block
                    text-sm
                    font-semibold
                    text-gray-700
                    mb-2
                  ">
                    Grade
                    <span className="text-red-500 ml-1">
                      *
                    </span>
                  </label>


                  <select
                    name="grade"
                    value={
                      formData.grade
                    }
                    onChange={
                      handleChange
                    }
                    required
                    disabled={saving}
                    className="
                      w-full
                      px-4
                      py-3
                      rounded-xl
                      border
                      border-gray-200
                      bg-gray-50
                      text-gray-800
                      outline-none
                      focus:bg-white
                      focus:border-blue-500
                      focus:ring-4
                      focus:ring-blue-100
                      disabled:opacity-60
                      transition
                    "
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


                  <label className="
                    block
                    text-sm
                    font-semibold
                    text-gray-700
                    mb-2
                  ">
                    Stream
                    <span className="text-red-500 ml-1">
                      *
                    </span>
                  </label>


                  <select
                    name="stream"
                    value={
                      formData.stream
                    }
                    onChange={
                      handleChange
                    }
                    required
                    disabled={saving}
                    className="
                      w-full
                      px-4
                      py-3
                      rounded-xl
                      border
                      border-gray-200
                      bg-gray-50
                      text-gray-800
                      outline-none
                      focus:bg-white
                      focus:border-blue-500
                      focus:ring-4
                      focus:ring-blue-100
                      disabled:opacity-60
                      transition
                    "
                  >


                    <option value="">
                      Select Stream
                    </option>


                    {streams.map(
                      (stream) => (
                        <option
                          key={stream}
                          value={stream}
                        >
                          {stream}
                        </option>
                      )
                    )}


                  </select>


                </div>


                {/* CAPACITY */}


                <div>


                  <label className="
                    block
                    text-sm
                    font-semibold
                    text-gray-700
                    mb-2
                  ">
                    Maximum Capacity
                    <span className="text-red-500 ml-1">
                      *
                    </span>
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
                    required
                    disabled={saving}
                    className="
                      w-full
                      px-4
                      py-3
                      rounded-xl
                      border
                      border-gray-200
                      bg-gray-50
                      text-gray-800
                      outline-none
                      focus:bg-white
                      focus:border-blue-500
                      focus:ring-4
                      focus:ring-blue-100
                      disabled:opacity-60
                      transition
                    "
                  />


                </div>


                {/* CLASS TEACHER */}


                <div>


                  <label className="
                    block
                    text-sm
                    font-semibold
                    text-gray-700
                    mb-2
                  ">
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
                    disabled={saving}
                    className="
                      w-full
                      px-4
                      py-3
                      rounded-xl
                      border
                      border-gray-200
                      bg-gray-50
                      text-gray-800
                      outline-none
                      focus:bg-white
                      focus:border-blue-500
                      focus:ring-4
                      focus:ring-blue-100
                      disabled:opacity-60
                      transition
                    "
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
                            {teacher.teacher_name ||
                              teacher.full_name ||
                              (
                                teacher
                                  .user
                                    ?.first_name ||
                                teacher
                                  .user
                                    ?.last_name
                              )
                                ? `${teacher.user?.first_name || ""} ${
                                    teacher.user?.last_name || ""
                                  }`.trim()
                                : teacher.employee_number ||
                                    `Teacher #${teacherId}`}
                          </option>
                        );
                      }
                    )}


                  </select>


                  {teachers.length ===
                    0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      No teachers available.
                    </p>
                  )}


                </div>


                {/* ACTIONS */}


                <div className="
                  flex
                  flex-col-reverse
                  sm:flex-row
                  gap-3
                  pt-3
                ">


                  <button
                    type="button"
                    onClick={
                      closeModal
                    }
                    disabled={saving}
                    className="
                      flex-1
                      px-5
                      py-3
                      rounded-xl
                      border
                      border-gray-200
                      bg-white
                      text-gray-700
                      font-semibold
                      hover:bg-gray-50
                      disabled:opacity-50
                      transition
                    "
                  >
                    Cancel
                  </button>


                  <button
                    type="submit"
                    disabled={saving}
                    className="
                      flex-1
                      px-5
                      py-3
                      rounded-xl
                      bg-blue-600
                      text-white
                      font-semibold
                      hover:bg-blue-700
                      disabled:opacity-60
                      disabled:cursor-not-allowed
                      shadow-sm
                      transition
                    "
                  >


                    {saving ? (
                      <span className="flex items-center justify-center gap-2">


                        <span className="
                          w-4
                          h-4
                          rounded-full
                          border-2
                          border-white
                          border-t-transparent
                          animate-spin
                        "></span>


                        Saving...
                      </span>
                    ) : (
                      <>
                        <i
                          className={`bi ${
                            editingClass
                              ? "bi-check-lg"
                              : "bi-plus-lg"
                          } mr-2`}
                        ></i>


                        {editingClass
                          ? "Update Class"
                          : "Create Class"}
                      </>
                    )}


                  </button>


                </div>


              </form>


            </div>


          </div>


        </div>
      )}


    </div>
  );
};


export default AcademicCoClasses;