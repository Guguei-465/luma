import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import api from "../api/api";
import FeedbackAlert from "../ui/FeedbackAlert";

// =====================================================
// SPINNER
// =====================================================

const Spinner = () => (
  <div className="flex items-center justify-center h-96">
    <div className="text-center">

      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-600 mx-auto mb-4"></div>

      <p className="text-gray-500">
        Loading teacher profile...
      </p>

    </div>
  </div>
);

// =====================================================
// BUTTON SPINNER
// =====================================================

const ButtonSpinner = () => (
  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
);

// =====================================================
// SAFE ARRAY
// =====================================================

const getArray = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
};

// =====================================================
// FIRST VALID VALUE
// =====================================================

const firstValue = (...values) => {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
  }

  return null;
};

// =====================================================
// GET ID
// =====================================================

const getId = (value) => {
  if (
    value !== null &&
    typeof value === "object"
  ) {
    return value.id ?? null;
  }

  return value ?? null;
};

// =====================================================
// GET TEACHER NAME
// =====================================================

const getTeacherName = (teacher) => {
  if (!teacher) {
    return "Teacher Profile";
  }

  if (teacher.full_name) {
    return teacher.full_name;
  }

  if (teacher.teacher_name) {
    return teacher.teacher_name;
  }

  if (teacher.teacher_full_name) {
    return teacher.teacher_full_name;
  }

  if (teacher.name) {
    return teacher.name;
  }

  if (teacher.user) {
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
    `Teacher #${teacher.id}`
  );
};

// =====================================================
// GET CLASSROOM NAME
// =====================================================

const getClassroomName = (
  classroom
) => {
  if (!classroom) {
    return "Unknown Class";
  }

  if (typeof classroom === "string") {
    return classroom;
  }

  if (classroom.name) {
    return classroom.name;
  }

  if (classroom.class_name) {
    return classroom.class_name;
  }

  if (classroom.classroom_name) {
    return classroom.classroom_name;
  }

  if (classroom.grade) {
    return `${classroom.grade}${
      classroom.stream
        ? ` ${classroom.stream}`
        : ""
    }`;
  }

  return classroom.id
    ? `Class ${classroom.id}`
    : "Unknown Class";
};

// =====================================================
// GET SUBJECT NAME
// =====================================================

const getSubjectName = (
  subject
) => {
  if (!subject) {
    return "Unknown Subject";
  }

  if (typeof subject === "string") {
    return subject;
  }

  if (subject.name) {
    return subject.name;
  }

  if (subject.subject_name) {
    return subject.subject_name;
  }

  if (subject.title) {
    return subject.title;
  }

  return subject.id
    ? `Subject ${subject.id}`
    : "Unknown Subject";
};

// =====================================================
// NORMALIZE ASSIGNMENT
// =====================================================

const normalizeAssignment = (
  assignment
) => {
  const teacherId = getId(
    assignment.teacher ??
      assignment.teacher_id
  );

  const classroomId = getId(
    assignment.classroom ??
      assignment.classroom_id
  );

  const subjectId = getId(
    assignment.subject ??
      assignment.subject_id
  );

  const teacherObject =
    assignment.teacher &&
    typeof assignment.teacher ===
      "object"
      ? assignment.teacher
      : null;

  const classroomObject =
    assignment.classroom &&
    typeof assignment.classroom ===
      "object"
      ? assignment.classroom
      : null;

  const subjectObject =
    assignment.subject &&
    typeof assignment.subject ===
      "object"
      ? assignment.subject
      : null;

  const nestedTeacherName =
    teacherObject?.user
      ? `${teacherObject.user.first_name || ""} ${
          teacherObject.user.last_name || ""
        }`.trim()
      : null;

  return {
    id: assignment.id,

    teacher: teacherId,

    teacherName:
      firstValue(
        assignment.teacher_name,
        assignment.teacher_full_name,
        teacherObject?.full_name,
        teacherObject?.teacher_name,
        teacherObject?.name,
        nestedTeacherName
      ) ||
      "Unknown Teacher",

    classroom: classroomId,

    classroomName:
      firstValue(
        assignment.classroom_name,
        assignment.class_name,
        classroomObject?.name,
        classroomObject?.class_name,
        classroomObject?.classroom_name
      ) ||
      (
        classroomObject?.grade
          ? `${classroomObject.grade}${
              classroomObject.stream
                ? ` ${classroomObject.stream}`
                : ""
            }`
          : classroomId
            ? `Class ${classroomId}`
            : "Unknown Class"
      ),

    subject: subjectId,

    subjectName:
      firstValue(
        assignment.subject_name,
        subjectObject?.name,
        subjectObject?.subject_name,
        subjectObject?.title
      ) ||
      "Unknown Subject",

    academicYear:
      assignment.academic_year ??
      assignment.academicYear ??
      "",

    term:
      assignment.term ||
      "",

    isClassTeacher:
      Boolean(
        assignment.is_class_teacher
      ),

    isActive:
      assignment.is_active !== false,

    assignedDate:
      assignment.assigned_date ||
      assignment.created_at ||
      null,

    endDate:
      assignment.end_date ||
      null,

    createdAt:
      assignment.created_at ||
      null,

    updatedAt:
      assignment.updated_at ||
      null,
  };
};

// =====================================================
// STATUS BADGE
// =====================================================

const StatusBadge = ({
  active,
}) => (
  <span
    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
      active
        ? "bg-green-100 text-green-700 border border-green-200"
        : "bg-gray-100 text-gray-600 border border-gray-200"
    }`}
  >
    {active
      ? "ACTIVE"
      : "INACTIVE"}
  </span>
);

// =====================================================
// COMPONENT
// =====================================================

const AcademicTeacherProfile = () => {
  const navigate =
    useNavigate();

  const {
    teacherId,
  } = useParams();

  // ===================================================
  // STATE
  // ===================================================

  const [
    teacher,
    setTeacher,
  ] = useState(null);

  // Current teacher's assignments
  const [
    assignments,
    setAssignments,
  ] = useState([]);

  // ALL assignments.
  //
  // Used to detect whether another teacher is already
  // the class teacher of a classroom.
  const [
    allAssignments,
    setAllAssignments,
  ] = useState([]);

  const [
    classrooms,
    setClassrooms,
  ] = useState([]);

  const [
    subjects,
    setSubjects,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadingOptions,
    setLoadingOptions,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  const [
    showAssignForm,
    setShowAssignForm,
  ] = useState(false);

  const [
    showInactive,
    setShowInactive,
  ] = useState(false);

  // ===================================================
  // FORM
  // ===================================================

  const [
    form,
    setForm,
  ] = useState({
    classroom: "",
    subject: "",
    academic_year:
      "2026/2027",
    term: "Term 1",
    is_class_teacher:
      false,
  });

  // ===================================================
  // LOAD TEACHER
  // ===================================================

  const loadTeacher =
    useCallback(
      async () => {
        if (!teacherId) {
          setTeacher(null);
          return null;
        }

        try {
          const response =
            await api.get(
              `/acounts/teacher-profiles/${teacherId}/`
            );

          console.log(
            "TEACHER PROFILE DETAIL:",
            response.data
          );

          setTeacher(
            response.data
          );

          return response.data;
        } catch (detailError) {
          console.error(
            "TEACHER DETAIL FAILED:",
            detailError.response?.data ||
              detailError.message
          );
        }

        // ---------------------------------------------
        // FALLBACK LIST
        // ---------------------------------------------

        try {
          const response =
            await api.get(
              "accounts/teacher-profiles/"
            );

          const data =
            getArray(
              response.data
            );

          const found =
            data.find(
              (item) =>
                String(
                  item.id
                ) ===
                String(
                  teacherId
                )
            );

          if (found) {
            setTeacher(found);
            return found;
          }

          setTeacher(null);
          return null;
        } catch (fallbackError) {
          console.error(
            "TEACHER PROFILE LIST FAILED:",
            fallbackError.response
              ?.data ||
              fallbackError.message
          );

          setTeacher(null);

          return null;
        }
      },
      [teacherId]
    );

  // ===================================================
  // LOAD CURRENT TEACHER ASSIGNMENTS
  // ===================================================

  const loadAssignments =
    useCallback(
      async () => {
        if (!teacherId) {
          setAssignments([]);
          return [];
        }

        try {
          const response =
            await api.get(
              `assignments/?teacher=${teacherId}`
            );

          console.log(
            "CURRENT TEACHER ASSIGNMENTS:",
            response.data
          );

          const data =
            getArray(
              response.data
            );

          const normalized =
            data
              .map(
                normalizeAssignment
              )
              .filter(
                (assignment) =>
                  String(
                    assignment.teacher
                  ) ===
                  String(
                    teacherId
                  )
              );

          setAssignments(
            normalized
          );

          return normalized;
        } catch (err) {
          console.error(
            "FAILED TO LOAD TEACHER ASSIGNMENTS:",
            err.response?.data ||
              err.message
          );

          setAssignments([]);

          setError(
            err.response?.status ===
              404
              ? "Teacher assignments endpoint was not found."
              : "Could not load this teacher's assignments."
          );

          return [];
        }
      },
      [teacherId]
    );

  // ===================================================
  // LOAD ALL ASSIGNMENTS
  //
  // IMPORTANT:
  //
  // This is used to determine whether another teacher
  // is already the class teacher for a classroom.
  // ===================================================

  const loadAllAssignments =
    useCallback(
      async () => {
        try {
          const response =
            await api.get(
              "assignments/"
            );

          const data =
            getArray(
              response.data
            );

          const normalized =
            data.map(
              normalizeAssignment
            );

          setAllAssignments(
            normalized
          );

          return normalized;
        } catch (err) {
          console.error(
            "FAILED TO LOAD ALL ASSIGNMENTS:",
            err.response?.data ||
              err.message
          );

          setAllAssignments([]);

          return [];
        }
      },
      []
    );

  // ===================================================
  // LOAD CLASSROOMS
  // ===================================================

  const loadClassrooms =
    useCallback(
      async () => {
        try {
          const response =
            await api.get(
              "classes/"
            );

          const data =
            getArray(
              response.data
            );

          setClassrooms(
            data
          );

          return data;
        } catch (err) {
          console.error(
            "FAILED TO LOAD CLASSROOMS:",
            err.response?.data ||
              err.message
          );

          setClassrooms([]);

          return [];
        }
      },
      []
    );

  // ===================================================
  // LOAD SUBJECTS
  // ===================================================

  const loadSubjects =
    useCallback(
      async () => {
        try {
          const response =
            await api.get(
              "subjects/"
            );

          const data =
            getArray(
              response.data
            );

          setSubjects(
            data
          );

          return data;
        } catch (err) {
          console.error(
            "FAILED TO LOAD SUBJECTS:",
            err.response?.data ||
              err.message
          );

          setSubjects([]);

          return [];
        }
      },
      []
    );

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    const loadPage =
      async () => {
        try {
          setLoading(true);

          await Promise.all([
            loadTeacher(),
            loadAssignments(),
            loadAllAssignments(),
            loadClassrooms(),
            loadSubjects(),
          ]);
        } finally {
          setLoading(false);
        }
      };

    loadPage();
  }, [
    loadTeacher,
    loadAssignments,
    loadAllAssignments,
    loadClassrooms,
    loadSubjects,
  ]);

  // ===================================================
  // TEACHER NAME
  // ===================================================

  const teacherName =
    useMemo(() => {
      return teacher
        ? getTeacherName(teacher)
        : "Teacher Profile";
    }, [teacher]);

  // ===================================================
  // VISIBLE ASSIGNMENTS
  // ===================================================

  const visibleAssignments =
    useMemo(() => {
      if (showInactive) {
        return assignments;
      }

      return assignments.filter(
        (assignment) =>
          assignment.isActive
      );
    }, [
      assignments,
      showInactive,
    ]);

  // ===================================================
  // GROUP BY CLASS
  // ===================================================

  const groupedByClass =
    useMemo(() => {
      const groups =
        new Map();

      visibleAssignments.forEach(
        (assignment) => {
          const classId =
            assignment.classroom ??
            `class-${assignment.classroomName}`;

          const key =
            String(classId);

          if (!groups.has(key)) {
            groups.set(key, {
              id: classId,

              name:
                assignment.classroomName ||
                "Unknown Class",

              assignments: [],
            });
          }

          groups
            .get(key)
            .assignments.push(
              assignment
            );
        }
      );

      return Array.from(
        groups.values()
      );
    }, [
      visibleAssignments,
    ]);

  // ===================================================
  // STATISTICS
  // ===================================================

  const activeAssignments =
    assignments.filter(
      (assignment) =>
        assignment.isActive
    ).length;

  const inactiveAssignments =
    assignments.filter(
      (assignment) =>
        !assignment.isActive
    ).length;

  const uniqueClasses =
    new Set(
      assignments
        .map(
          (assignment) =>
            assignment.classroom
        )
        .filter(
          (value) =>
            value !== null &&
            value !== undefined
        )
    ).size;

  const uniqueSubjects =
    new Set(
      assignments
        .map(
          (assignment) =>
            assignment.subject
        )
        .filter(
          (value) =>
            value !== null &&
            value !== undefined
        )
    ).size;

  const classTeacherCount =
    assignments.filter(
      (assignment) =>
        assignment.isClassTeacher &&
        assignment.isActive
    ).length;

  // ===================================================
  // FORM CHANGE
  // ===================================================

  const handleChange =
    (event) => {
      const {
        name,
        value,
        type,
        checked,
      } = event.target;

      setForm(
        (previous) => ({
          ...previous,

          [name]:
            type === "checkbox"
              ? checked
              : value,
        })
      );
    };

  // ===================================================
  // RESET FORM
  // ===================================================

  const resetForm =
    (classroomId = "") => {
      setForm({
        classroom:
          classroomId
            ? String(
                classroomId
              )
            : "",

        subject: "",

        academic_year:
          "2026/2027",

        term: "Term 1",

        is_class_teacher:
          false,
      });
    };

  // ===================================================
  // OPEN FORM
  // ===================================================

  const openAssignForm =
    async (
      classroomId = ""
    ) => {
      setError("");
      setSuccess("");

      try {
        setLoadingOptions(true);

        await Promise.all([
          classrooms.length === 0
            ? loadClassrooms()
            : Promise.resolve(),

          subjects.length === 0
            ? loadSubjects()
            : Promise.resolve(),

          // Always refresh all assignments before opening
          // so class-teacher conflict detection is current.
          loadAllAssignments(),
        ]);
      } finally {
        setLoadingOptions(false);
      }

      resetForm(
        classroomId
      );

      setShowAssignForm(
        true
      );
    };

  // ===================================================
  // CLOSE FORM
  // ===================================================

  const closeAssignForm =
    () => {
      if (saving) {
        return;
      }

      setShowAssignForm(
        false
      );

      resetForm();
    };

  // ===================================================
  // DUPLICATE ASSIGNMENT
  //
  // Same teacher + class + subject + year + term
  // cannot exist as two active assignments.
  // ===================================================

  const duplicateAssignment =
    useMemo(() => {
      if (
        !form.classroom ||
        !form.subject ||
        !form.academic_year ||
        !form.term
      ) {
        return false;
      }

      return assignments.some(
        (assignment) =>
          assignment.isActive &&
          String(
            assignment.classroom
          ) ===
            String(
              form.classroom
            ) &&
          String(
            assignment.subject
          ) ===
            String(
              form.subject
            ) &&
          String(
            assignment.academicYear
          ).trim() ===
            String(
              form.academic_year
            ).trim() &&
          String(
            assignment.term
          ).trim() ===
            String(
              form.term
            ).trim()
      );
    }, [
      assignments,
      form.classroom,
      form.subject,
      form.academic_year,
      form.term,
    ]);

  // ===================================================
  // CLASS TEACHER CONFLICT
  //
  // IMPORTANT:
  //
  // Check ALL teachers.
  //
  // We exclude the current teacher because they may
  // already have a class-teacher assignment for that
  // same classroom/year/term.
  // ===================================================

  const conflictingClassTeacher =
    useMemo(() => {
      if (
        !form.classroom ||
        !form.academic_year ||
        !form.term ||
        !form.is_class_teacher
      ) {
        return null;
      }

      const conflict =
        allAssignments.find(
          (assignment) =>
            assignment.isActive &&
            assignment.isClassTeacher &&
            String(
              assignment.classroom
            ) ===
              String(
                form.classroom
              ) &&
            String(
              assignment.academicYear
            ).trim() ===
              String(
                form.academic_year
              ).trim() &&
            String(
              assignment.term
            ).trim() ===
              String(
                form.term
              ).trim() &&
            String(
              assignment.teacher
            ) !==
              String(
                teacherId
              )
        );

      return conflict || null;
    }, [
      allAssignments,
      form.classroom,
      form.academic_year,
      form.term,
      form.is_class_teacher,
      teacherId,
    ]);

  const classTeacherAlreadyAssigned =
    Boolean(
      conflictingClassTeacher
    );

  // ===================================================
  // BACKEND ERROR
  // ===================================================

  const getBackendError =
    (requestError) => {
      const data =
        requestError?.response
          ?.data;

      if (!data) {
        return "The server could not process the request.";
      }

      if (
        typeof data ===
        "string"
      ) {
        return data;
      }

      if (data.detail) {
        return data.detail;
      }

      if (data.message) {
        return data.message;
      }

      if (
        typeof data ===
        "object"
      ) {
        return Object.entries(
          data
        )
          .map(
            ([field, value]) => {
              const message =
                Array.isArray(value)
                  ? value.join(
                      ", "
                    )
                  : String(
                      value
                    );

              return `${field}: ${message}`;
            }
          )
          .join(" ");
      }

      return "The server rejected the request.";
    };

  // ===================================================
  // ASSIGN TEACHER
  // ===================================================

  const handleAssign =
    async (event) => {
      event.preventDefault();

      setError("");
      setSuccess("");

      // -----------------------------------------------
      // VALIDATION
      // -----------------------------------------------

      if (!form.classroom) {
        setError(
          "Please select a classroom."
        );
        return;
      }

      if (!form.subject) {
        setError(
          "Please select a subject."
        );
        return;
      }

      if (
        !form.academic_year.trim()
      ) {
        setError(
          "Please enter the academic year."
        );
        return;
      }

      if (!form.term) {
        setError(
          "Please select a term."
        );
        return;
      }

      if (duplicateAssignment) {
        setError(
          "This teacher is already assigned to this subject in this class for the selected academic year and term."
        );
        return;
      }

      if (
        classTeacherAlreadyAssigned
      ) {
        setError(
          `${conflictingClassTeacher.teacherName} is already the class teacher for this classroom in ${form.academic_year}, ${form.term}.`
        );
        return;
      }

      if (!teacherId) {
        setError(
          "Teacher profile ID is missing."
        );
        return;
      }

      try {
        setSaving(true);

        const payload = {
          teacher:
            Number(
              teacherId
            ),

          classroom:
            Number(
              form.classroom
            ),

          subject:
            Number(
              form.subject
            ),

          academic_year:
            form.academic_year.trim(),

          term:
            form.term,

          is_class_teacher:
            Boolean(
              form.is_class_teacher
            ),

          is_active:
            true,
        };

        console.log(
          "CREATING TEACHER ASSIGNMENT:",
          payload
        );

        const response =
          await api.post(
            "assignments/create/",
            payload
          );

        console.log(
          "ASSIGNMENT CREATED:",
          response.data
        );

        const selectedClass =
          classrooms.find(
            (item) =>
              String(
                item.id
              ) ===
              String(
                form.classroom
              )
          );

        const selectedSubject =
          subjects.find(
            (item) =>
              String(
                item.id
              ) ===
              String(
                form.subject
              )
          );

        setSuccess(
          `${teacherName} was successfully assigned to ${getClassroomName(
            selectedClass
          )} for ${getSubjectName(
            selectedSubject
          )}.`
        );

        setShowAssignForm(
          false
        );

        resetForm();

        // Reload current teacher assignments
        // AND all assignments.
        await Promise.all([
          loadAssignments(),
          loadAllAssignments(),
        ]);
      } catch (err) {
        console.error(
          "ASSIGNMENT CREATE ERROR:",
          err.response?.data ||
            err.message
        );

        setError(
          getBackendError(err)
        );
      } finally {
        setSaving(false);
      }
    };

  // ===================================================
  // DEACTIVATE
  // ===================================================

  const deactivateAssignment =
    async (
      assignment
    ) => {
      const confirmed =
        window.confirm(
          `Deactivate ${assignment.subjectName} for ${assignment.classroomName}?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setError("");
        setSuccess("");

        await api.patch(
          `assignments/update/${assignment.id}/`,
          {
            is_active:
              false,

            end_date:
              new Date()
                .toISOString()
                .split("T")[0],
          }
        );

        setSuccess(
          "Assignment deactivated successfully."
        );

        await Promise.all([
          loadAssignments(),
          loadAllAssignments(),
        ]);
      } catch (err) {
        console.error(
          "DEACTIVATE ERROR:",
          err.response?.data ||
            err.message
        );

        setError(
          getBackendError(err)
        );
      }
    };

  // ===================================================
  // REACTIVATE
  // ===================================================

  const reactivateAssignment =
    async (
      assignment
    ) => {
      try {
        setError("");
        setSuccess("");

        await api.patch(
          `assignments/update/${assignment.id}/`,
          {
            is_active:
              true,

            end_date:
              null,
          }
        );

        setSuccess(
          "Assignment reactivated successfully."
        );

        await Promise.all([
          loadAssignments(),
          loadAllAssignments(),
        ]);
      } catch (err) {
        console.error(
          "REACTIVATE ERROR:",
          err.response?.data ||
            err.message
        );

        setError(
          getBackendError(err)
        );
      }
    };

  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh =
    async () => {
      try {
        setRefreshing(true);

        setError("");
        setSuccess("");

        await Promise.all([
          loadTeacher(),
          loadAssignments(),
          loadAllAssignments(),
          loadClassrooms(),
          loadSubjects(),
        ]);

        setSuccess(
          "Teacher profile refreshed successfully."
        );
      } catch (err) {
        console.error(
          "REFRESH ERROR:",
          err
        );

        setError(
          "Failed to refresh teacher profile."
        );
      } finally {
        setRefreshing(false);
      }
    };

  // ===================================================
  // BACK
  // ===================================================

  const handleBack =
    () => {
      navigate(
        "/academic-coordinator/teachers"
      );
    };

  // ===================================================
  // DATE
  // ===================================================

  const formatDate =
    (date) => {
      if (!date) {
        return "—";
      }

      const parsed =
        new Date(date);

      if (
        Number.isNaN(
          parsed.getTime()
        )
      ) {
        return "—";
      }

      return parsed.toLocaleDateString(
        "en-KE",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        }
      );
    };

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return <Spinner />;
  }

  // ===================================================
  // NOT FOUND
  // ===================================================

  if (!teacher) {
    return (
      <div className="card text-center py-12">

        <div className="text-5xl mb-4">
          👨‍🏫
        </div>

        <h2 className="text-xl font-semibold text-gray-800">
          Teacher profile not found
        </h2>

        <p className="text-gray-500 mt-2 mb-5">
          The requested TeacherProfile could not be
          loaded.
        </p>

        <button
          type="button"
          onClick={handleBack}
          className="milk-btn"
        >
          ← Back to Teachers
        </button>

      </div>
    );
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="space-y-6 md:space-y-8">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="card">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

          <div>

            <button
              type="button"
              onClick={handleBack}
              className="text-sm text-blue-600 hover:text-blue-800 mb-3"
            >
              ← Back to Teachers
            </button>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              {teacherName}
            </h1>

            <p className="text-gray-500 mt-1">
              Teacher Assignment Profile
            </p>

            {teacher.employee_number && (
              <p className="text-sm text-gray-400 mt-1">
                Employee No:{" "}
                {teacher.employee_number}
              </p>
            )}

          </div>

          <div className="flex flex-col sm:flex-row gap-2">

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="milk-btn disabled:opacity-60"
            >
              {refreshing && (
                <ButtonSpinner />
              )}

              {refreshing
                ? "Refreshing..."
                : "🔄 Refresh"}
            </button>

            <button
              type="button"
              onClick={() =>
                openAssignForm()
              }
              className="milk-btn"
            >
              + Assign Class / Subject
            </button>

          </div>

        </div>

      </div>

      {/* =================================================
          ALERTS
      ================================================= */}

      {success && (
        <FeedbackAlert
          type="success"
          message={success}
          onDismiss={() =>
            setSuccess("")
          }
        />
      )}

      {error && (
        <FeedbackAlert
          type="error"
          message={error}
          onDismiss={() =>
            setError("")
          }
        />
      )}

      {/* =================================================
          STATISTICS
      ================================================= */}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">

        <div className="stat-card py-4">
          <p className="text-sm text-gray-500">
            Active Assignments
          </p>

          <p className="stat-value mt-1">
            {activeAssignments}
          </p>
        </div>

        <div className="stat-card py-4">
          <p className="text-sm text-gray-500">
            Classes
          </p>

          <p className="stat-value mt-1">
            {uniqueClasses}
          </p>
        </div>

        <div className="stat-card py-4">
          <p className="text-sm text-gray-500">
            Subjects
          </p>

          <p className="stat-value mt-1">
            {uniqueSubjects}
          </p>
        </div>

        <div className="stat-card py-4">
          <p className="text-sm text-gray-500">
            Class Teacher
          </p>

          <p className="stat-value mt-1">
            {classTeacherCount}
          </p>
        </div>

        <div className="stat-card py-4">
          <p className="text-sm text-gray-500">
            Inactive
          </p>

          <p className="stat-value mt-1">
            {inactiveAssignments}
          </p>
        </div>

      </div>

      {/* =================================================
          TEACHER INFORMATION
      ================================================= */}

      <div className="card">

        <h2 className="text-xl font-semibold text-gray-800 mb-5">
          Teacher Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

          <div>
            <p className="text-sm text-gray-500">
              Name
            </p>

            <p className="font-semibold text-gray-800 mt-1">
              {teacherName}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Employee Number
            </p>

            <p className="font-semibold text-gray-800 mt-1">
              {teacher.employee_number ||
                "—"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Email
            </p>

            <p className="font-semibold text-gray-800 mt-1 break-all">
              {teacher.email ||
                teacher.user?.email ||
                "—"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Teacher ID
            </p>

            <p className="font-semibold text-gray-800 mt-1">
              {teacher.id}
            </p>
          </div>

        </div>

      </div>

      {/* =================================================
          ASSIGN FORM
      ================================================= */}

      {showAssignForm && (
        <div className="card border-2 border-green-200">

          <div className="flex items-center justify-between mb-5">

            <div>

              <h2 className="text-xl font-semibold text-gray-800">
                Assign Teacher
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Assign {teacherName} to a class and
                subject.
              </p>

            </div>

            <button
              type="button"
              onClick={closeAssignForm}
              disabled={saving}
              className="text-gray-500 hover:text-gray-800 text-xl disabled:opacity-50"
            >
              ×
            </button>

          </div>

          <form
            onSubmit={handleAssign}
            className="space-y-5"
          >

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* CLASS */}

              <div>

                <label className="form-label">
                  Classroom *
                </label>

                <select
                  name="classroom"
                  value={
                    form.classroom
                  }
                  onChange={
                    handleChange
                  }
                  className="milk-input w-full"
                  disabled={
                    saving ||
                    loadingOptions
                  }
                  required
                >

                  <option value="">
                    Select classroom
                  </option>

                  {classrooms.map(
                    (classroom) => {
                      if (!classroom.id) {
                        return null;
                      }

                      return (
                        <option
                          key={
                            classroom.id
                          }
                          value={
                            classroom.id
                          }
                        >
                          {getClassroomName(
                            classroom
                          )}
                        </option>
                      );
                    }
                  )}

                </select>

                {classrooms.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    No classrooms found.
                  </p>
                )}

              </div>

              {/* SUBJECT */}

              <div>

                <label className="form-label">
                  Subject *
                </label>

                <select
                  name="subject"
                  value={
                    form.subject
                  }
                  onChange={
                    handleChange
                  }
                  className="milk-input w-full"
                  disabled={
                    saving ||
                    loadingOptions
                  }
                  required
                >

                  <option value="">
                    Select subject
                  </option>

                  {subjects.map(
                    (subject) => {
                      if (!subject.id) {
                        return null;
                      }

                      return (
                        <option
                          key={
                            subject.id
                          }
                          value={
                            subject.id
                          }
                        >
                          {getSubjectName(
                            subject
                          )}
                        </option>
                      );
                    }
                  )}

                </select>

                {subjects.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    No subjects found.
                  </p>
                )}

              </div>

              {/* YEAR */}

              <div>

                <label className="form-label">
                  Academic Year *
                </label>

                <input
                  type="text"
                  name="academic_year"
                  value={
                    form.academic_year
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="2026/2027"
                  className="milk-input w-full"
                  disabled={saving}
                  required
                />

              </div>

              {/* TERM */}

              <div>

                <label className="form-label">
                  Term *
                </label>

                <select
                  name="term"
                  value={
                    form.term
                  }
                  onChange={
                    handleChange
                  }
                  className="milk-input w-full"
                  disabled={saving}
                  required
                >

                  <option value="Term 1">
                    Term 1
                  </option>

                  <option value="Term 2">
                    Term 2
                  </option>

                  <option value="Term 3">
                    Term 3
                  </option>

                </select>

              </div>

            </div>

            {/* CLASS TEACHER */}

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">

              <label className="flex items-start gap-3 cursor-pointer">

                <input
                  type="checkbox"
                  name="is_class_teacher"
                  checked={
                    form.is_class_teacher
                  }
                  onChange={
                    handleChange
                  }
                  disabled={saving}
                  className="mt-1 h-4 w-4"
                />

                <div>

                  <p className="font-medium text-gray-800">
                    Assign as Class Teacher
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    This makes {teacherName} the class
                    teacher for the selected classroom,
                    academic year and term.
                  </p>

                </div>

              </label>

            </div>

            {/* DUPLICATE */}

            {duplicateAssignment && (
              <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-700">
                This teacher is already assigned to
                this subject in this classroom for this
                academic year and term.
              </div>
            )}

            {/* CLASS TEACHER CONFLICT */}

            {classTeacherAlreadyAssigned && (
              <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 text-sm text-orange-700">

                <p className="font-medium">
                  Classroom already has a class teacher.
                </p>

                <p className="mt-1">
                  {
                    conflictingClassTeacher.teacherName
                  }{" "}
                  is already the active class teacher
                  for this classroom in{" "}
                  {form.academic_year},{" "}
                  {form.term}.
                </p>

              </div>
            )}

            {/* BUTTONS */}

            <div className="flex flex-col sm:flex-row justify-end gap-3">

              <button
                type="button"
                onClick={closeAssignForm}
                disabled={saving}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  saving ||
                  loadingOptions ||
                  classrooms.length === 0 ||
                  subjects.length === 0 ||
                  duplicateAssignment ||
                  classTeacherAlreadyAssigned
                }
                className="milk-btn disabled:opacity-60"
              >

                {saving && (
                  <ButtonSpinner />
                )}

                {saving
                  ? "Assigning..."
                  : "Assign Teacher"}

              </button>

            </div>

          </form>

        </div>
      )}

      {/* =================================================
          SHOW INACTIVE
      ================================================= */}

      <div className="flex items-center gap-2">

        <input
          id="showInactiveAssignments"
          type="checkbox"
          checked={
            showInactive
          }
          onChange={(event) =>
            setShowInactive(
              event.target.checked
            )
          }
          className="h-4 w-4"
        />

        <label
          htmlFor="showInactiveAssignments"
          className="text-sm text-gray-600"
        >
          Show inactive assignments
        </label>

      </div>

      {/* =================================================
          ASSIGNMENTS
      ================================================= */}

      {groupedByClass.length === 0 ? (
        <div className="card text-center py-12">

          <div className="text-5xl mb-4">
        
          </div>

          <h2 className="text-xl font-semibold text-gray-800">
            No assignments yet
          </h2>

          <p className="text-gray-500 mt-2 mb-5">
            {teacherName} has not been assigned to any
            class or subject yet.
          </p>

          <button
            type="button"
            onClick={() =>
              openAssignForm()
            }
            className="milk-btn"
          >
            + Assign Teacher
          </button>

        </div>
      ) : (
        <div className="space-y-6">

          {groupedByClass.map(
            (classGroup) => {

              const classTeacher =
                classGroup.assignments.find(
                  (assignment) =>
                    assignment.isClassTeacher &&
                    assignment.isActive
                );

              return (
                <div
                  key={
                    classGroup.id
                  }
                  className="card overflow-hidden"
                >

                  {/* CLASS HEADER */}

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b">

                    <div>

                      <h2 className="text-xl font-semibold text-gray-800">
                        {classGroup.name}
                      </h2>

                      <p className="text-sm text-gray-500 mt-1">
                        {
                          classGroup
                            .assignments
                            .length
                        }{" "}
                        subject
                        {classGroup
                          .assignments
                          .length !== 1
                          ? "s"
                          : ""}{" "}
                        assigned
                      </p>

                    </div>

                    {classTeacher && (
                      <span className="inline-flex w-fit px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                        ✓ Class Teacher
                      </span>
                    )}

                  </div>

                  {/* ASSIGNMENTS */}

                  <div className="divide-y">

                    {classGroup.assignments.map(
                      (assignment) => (
                        <div
                          key={
                            assignment.id
                          }
                          className="py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
                        >

                          <div className="flex-1">

                            <div className="flex flex-wrap items-center gap-2">

                              <h3 className="font-semibold text-gray-800">
                                {
                                  assignment.subjectName
                                }
                              </h3>

                              <StatusBadge
                                active={
                                  assignment.isActive
                                }
                              />

                              {assignment.isClassTeacher && (
                                <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                                  Class Teacher
                                </span>
                              )}

                            </div>

                            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500 mt-2">

                              <span>
                                <strong>
                                  Academic Year:
                                </strong>{" "}
                                {
                                  assignment.academicYear ||
                                  "—"
                                }
                              </span>

                              <span>
                                <strong>
                                  Term:
                                </strong>{" "}
                                {
                                  assignment.term ||
                                  "—"
                                }
                              </span>

                              <span>
                                <strong>
                                  Assigned:
                                </strong>{" "}
                                {formatDate(
                                  assignment.assignedDate
                                )}
                              </span>

                              {assignment.endDate && (
                                <span>
                                  <strong>
                                    Ended:
                                  </strong>{" "}
                                  {formatDate(
                                    assignment.endDate
                                  )}
                                </span>
                              )}

                            </div>

                          </div>

                          <div className="flex gap-2">

                            {assignment.isActive ? (
                              <button
                                type="button"
                                onClick={() =>
                                  deactivateAssignment(
                                    assignment
                                  )
                                }
                                className="px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm"
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  reactivateAssignment(
                                    assignment
                                  )
                                }
                                className="px-3 py-2 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 text-sm"
                              >
                                Reactivate
                              </button>
                            )}

                          </div>

                        </div>
                      )
                    )}

                  </div>

                  {/* ADD SUBJECT */}

                  <div className="border-t pt-4 mt-2">

                    <button
                      type="button"
                      onClick={() =>
                        openAssignForm(
                          classGroup.id
                        )
                      }
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      + Add another subject to{" "}
                      {classGroup.name}
                    </button>

                  </div>

                </div>
              );
            }
          )}

        </div>
      )}

    </div>
  );
};

export default AcademicTeacherProfile;