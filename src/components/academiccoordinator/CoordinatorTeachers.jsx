import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

// =====================================================
// SPINNER
// =====================================================

const Spinner = () => (
  <div className="flex items-center justify-center h-96">
    <div className="text-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-green-600 mx-auto mb-3"></div>

      <p className="text-gray-500">
        Loading teachers...
      </p>
    </div>
  </div>
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
    return "Unknown Teacher";
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
    teacher.employee_no ||
    (teacher.id
      ? `Teacher #${teacher.id}`
      : "Unknown Teacher")
  );
};

// =====================================================
// NORMALIZE TEACHER PROFILE
// =====================================================

const normalizeTeacherProfile = (teacher) => {
  return {
    id: teacher.id,

    name: getTeacherName(teacher),

    employeeNumber:
      teacher.employee_number ||
      teacher.employee_no ||
      "",

    email:
      teacher.email ||
      teacher.user?.email ||
      "",

    userId:
      teacher.user?.id ||
      teacher.user_id ||
      null,

    assignments: [],

    classes: [],

    subjects: [],

    classTeacherAssignments: [],

    isClassTeacher: false,
  };
};

// =====================================================
// NORMALIZE ASSIGNMENT
// =====================================================

const normalizeAssignment = (assignment) => {
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
    typeof assignment.teacher === "object"
      ? assignment.teacher
      : null;

  const classroomObject =
    assignment.classroom &&
    typeof assignment.classroom === "object"
      ? assignment.classroom
      : null;

  const subjectObject =
    assignment.subject &&
    typeof assignment.subject === "object"
      ? assignment.subject
      : null;

  return {
    id: assignment.id,

    teacherId,

    teacherName:
      firstValue(
        assignment.teacher_name,
        assignment.teacher_full_name,
        teacherObject?.full_name,
        teacherObject?.teacher_name,
        teacherObject?.name,
        teacherObject?.user?.first_name
          ? `${teacherObject.user.first_name || ""} ${
              teacherObject.user.last_name || ""
            }`.trim()
          : null
      ) || "Unknown Teacher",

    classroomId,

    classroomName:
      firstValue(
        assignment.classroom_name,
        assignment.class_name,
        assignment.classroom?.name,
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
            : "Unassigned"
      ),

    subjectId,

    subjectName:
      firstValue(
        assignment.subject_name,
        assignment.subject?.name,
        subjectObject?.name,
        subjectObject?.subject_name,
        subjectObject?.title
      ) || "Unassigned",

    academicYear:
      assignment.academic_year ??
      assignment.academicYear ??
      "—",

    term:
      assignment.term ||
      "—",

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
// BUILD TEACHERS
//
// IMPORTANT:
//
// Every registered TeacherProfile appears.
//
// Assignments are then merged into the teacher.
//
// One teacher can have:
// - many classes
// - many subjects
// - many assignment records
// =====================================================

const buildTeachers = (
  teacherProfiles,
  assignments
) => {
  const teacherMap = new Map();

  // ---------------------------------------------------
  // FIRST: ADD EVERY REGISTERED TEACHER
  // ---------------------------------------------------

  teacherProfiles.forEach((profile) => {
    if (
      profile?.id === undefined ||
      profile?.id === null
    ) {
      return;
    }

    const teacher =
      normalizeTeacherProfile(
        profile
      );

    teacherMap.set(
      String(teacher.id),
      teacher
    );
  });

  // ---------------------------------------------------
  // SECOND: MERGE ASSIGNMENTS
  // ---------------------------------------------------

  assignments.forEach((assignment) => {
    if (
      assignment.teacherId === undefined ||
      assignment.teacherId === null
    ) {
      return;
    }

    const key =
      String(
        assignment.teacherId
      );

    // -------------------------------------------------
    // FALLBACK TEACHER
    // -------------------------------------------------

    if (!teacherMap.has(key)) {
      teacherMap.set(key, {
        id: assignment.teacherId,

        name:
          assignment.teacherName ||
          "Unknown Teacher",

        employeeNumber: "",

        email: "",

        userId: null,

        assignments: [],

        classes: [],

        subjects: [],

        classTeacherAssignments: [],

        isClassTeacher: false,
      });
    }

    const teacher =
      teacherMap.get(key);

    // -------------------------------------------------
    // ADD ASSIGNMENT
    // -------------------------------------------------

    teacher.assignments.push(
      assignment
    );

    // -------------------------------------------------
    // ADD UNIQUE CLASS
    // -------------------------------------------------

    if (
      assignment.classroomId !== null &&
      assignment.classroomId !== undefined
    ) {
      const exists =
        teacher.classes.some(
          (item) =>
            String(item.id) ===
            String(
              assignment.classroomId
            )
        );

      if (!exists) {
        teacher.classes.push({
          id:
            assignment.classroomId,

          name:
            assignment.classroomName,
        });
      }
    }

    // -------------------------------------------------
    // ADD UNIQUE SUBJECT
    // -------------------------------------------------

    if (
      assignment.subjectId !== null &&
      assignment.subjectId !== undefined
    ) {
      const exists =
        teacher.subjects.some(
          (item) =>
            String(item.id) ===
            String(
              assignment.subjectId
            )
        );

      if (!exists) {
        teacher.subjects.push({
          id:
            assignment.subjectId,

          name:
            assignment.subjectName,
        });
      }
    }

    // -------------------------------------------------
    // CLASS TEACHER ASSIGNMENT
    // -------------------------------------------------

    if (
      assignment.isClassTeacher &&
      assignment.isActive
    ) {
      teacher.classTeacherAssignments.push(
        assignment
      );
    }
  });

  // ---------------------------------------------------
  // FINALIZE
  // ---------------------------------------------------

  return Array.from(
    teacherMap.values()
  ).map((teacher) => ({
    ...teacher,

    isClassTeacher:
      teacher.classTeacherAssignments
        .length > 0,
  }));
};

// =====================================================
// COMPONENT
// =====================================================

const CoordinatorTeachers = () => {
  const navigate =
    useNavigate();

  // ===================================================
  // STATE
  // ===================================================

  const [
    teacherProfiles,
    setTeacherProfiles,
  ] = useState([]);

  const [
    assignments,
    setAssignments,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    filterTerm,
    setFilterTerm,
  ] = useState("");

  const [
    filterYear,
    setFilterYear,
  ] = useState("");

  const [
    showInactive,
    setShowInactive,
  ] = useState(false);

  // ===================================================
  // LOAD TEACHERS
  // ===================================================

  const loadTeacherProfiles =
    useCallback(async () => {
      const response =
        await api.get(
          "accounts/teacher-profiles/"
        );

      console.log(
        "TEACHER PROFILES:",
        response.data
      );

      const data =
        getArray(response.data);

      setTeacherProfiles(data);

      return data;
    }, []);

  // ===================================================
  // LOAD ASSIGNMENTS
  // ===================================================

  const loadAssignments =
    useCallback(async () => {
      const response =
        await api.get(
          "assignments/"
        );

      console.log(
        "ALL TEACHER ASSIGNMENTS:",
        response.data
      );

      const data =
        getArray(response.data);

      const normalized =
        data.map(
          normalizeAssignment
        );

      setAssignments(
        normalized
      );

      return normalized;
    }, []);

  // ===================================================
  // LOAD PAGE
  // ===================================================

  const loadPage =
    useCallback(
      async (isRefresh = false) => {
        try {
          if (isRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError("");

          const results =
            await Promise.allSettled([
              loadTeacherProfiles(),
              loadAssignments(),
            ]);

          const profiles =
            results[0];

          const assignmentResult =
            results[1];

          if (
            profiles.status ===
            "rejected"
          ) {
            setError(
              "Could not load teacher profiles."
            );
          }

          if (
            assignmentResult.status ===
            "rejected"
          ) {
            setError(
              profiles.status ===
              "fulfilled"
                ? "Teachers loaded, but assignments could not be loaded."
                : "Could not load teachers."
            );
          }
        } catch (err) {
          console.error(
            "LOAD TEACHERS ERROR:",
            err
          );

          setError(
            "Could not load teachers."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        loadTeacherProfiles,
        loadAssignments,
      ]
    );

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    loadPage(false);
  }, [loadPage]);

  // ===================================================
  // BUILD TEACHERS
  // ===================================================

  const teachers =
    useMemo(() => {
      return buildTeachers(
        teacherProfiles,
        assignments
      );
    }, [
      teacherProfiles,
      assignments,
    ]);

  // ===================================================
  // ACADEMIC YEARS
  // ===================================================

  const academicYears =
    useMemo(() => {
      const years =
        assignments
          .map(
            (assignment) =>
              assignment.academicYear
          )
          .filter(
            (year) =>
              year !== null &&
              year !== undefined &&
              String(year).trim() !== "" &&
              String(year) !== "—"
          );

      return [
        ...new Set(
          years.map(String)
        ),
      ].sort();
    }, [assignments]);

  // ===================================================
  // FILTER ASSIGNMENTS
  // ===================================================

  const filteredAssignments =
    useMemo(() => {
      return assignments.filter(
        (assignment) => {
          if (
            !showInactive &&
            !assignment.isActive
          ) {
            return false;
          }

          if (
            filterTerm &&
            assignment.term !==
              filterTerm
          ) {
            return false;
          }

          if (
            filterYear &&
            String(
              assignment.academicYear
            ) !==
              String(filterYear)
          ) {
            return false;
          }

          return true;
        }
      );
    }, [
      assignments,
      showInactive,
      filterTerm,
      filterYear,
    ]);

  // ===================================================
  // FILTER TEACHERS
  //
  // NEVER REMOVE A TEACHER BECAUSE THEY HAVE
  // ZERO ASSIGNMENTS.
  // ===================================================

  const filteredTeachers =
    useMemo(() => {
      let result =
        teachers.map(
          (teacher) => {
            const teacherAssignments =
              filteredAssignments.filter(
                (assignment) =>
                  String(
                    assignment.teacherId
                  ) ===
                  String(
                    teacher.id
                  )
              );

            return {
              ...teacher,

              filteredAssignments:
                teacherAssignments,
            };
          }
        );

      // -----------------------------------------------
      // SEARCH
      // -----------------------------------------------

      if (
        searchTerm.trim()
      ) {
        const search =
          searchTerm
            .trim()
            .toLowerCase();

        result =
          result.filter(
            (teacher) => {
              const name =
                (
                  teacher.name ||
                  ""
                ).toLowerCase();

              const employee =
                (
                  teacher.employeeNumber ||
                  ""
                ).toLowerCase();

              const email =
                (
                  teacher.email ||
                  ""
                ).toLowerCase();

              const subjects =
                teacher.filteredAssignments
                  .map(
                    (assignment) =>
                      assignment.subjectName
                  )
                  .join(" ")
                  .toLowerCase();

              const classes =
                teacher.filteredAssignments
                  .map(
                    (assignment) =>
                      assignment.classroomName
                  )
                  .join(" ")
                  .toLowerCase();

              return (
                name.includes(search) ||
                employee.includes(search) ||
                email.includes(search) ||
                subjects.includes(search) ||
                classes.includes(search)
              );
            }
          );
      }

      return result;
    }, [
      teachers,
      filteredAssignments,
      searchTerm,
    ]);

  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh =
    async () => {
      await loadPage(true);
    };

  // ===================================================
  // VIEW TEACHER
  // ===================================================

  const viewTeacher =
    (teacher) => {
      navigate(
        `/academic-coordinator/teachers/${teacher.id}`
      );
    };

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return <Spinner />;
  }

  // ===================================================
  // STATISTICS
  // ===================================================

  const totalTeachers =
    teachers.length;

  const classTeachers =
    teachers.filter(
      (teacher) =>
        teacher.classTeacherAssignments
          .length > 0
    ).length;

  const subjectSpecialists =
    teachers.filter(
      (teacher) =>
        teacher.subjects.length > 0
    ).length;

  const activeAssignments =
    assignments.filter(
      (assignment) =>
        assignment.isActive
    ).length;

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="space-y-6 md:space-y-8">

      {/* HEADER */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

        <div>
          <h1 className="text-[clamp(1.5rem,3vw,2.2rem)] font-bold text-gray-800">
            Teachers & Staff
          </h1>

          <p className="text-gray-500 mt-2">
            View all registered teachers and manage
            their class and subject assignments.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="milk-btn w-full lg:w-auto disabled:opacity-60"
        >
          {refreshing ? (
            <>
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
              Refreshing...
            </>
          ) : (
            "🔄 Refresh"
          )}
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <p className="font-medium">
            {error}
          </p>

          <p className="text-sm mt-2">
            Registered teachers:{" "}
            {teacherProfiles.length}
            {" | "}
            Assignments:{" "}
            {assignments.length}
          </p>
        </div>
      )}

      {/* STATISTICS */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <div className="stat-card py-5">
          <p className="text-gray-600 font-medium">
            Total Teachers
          </p>

          <p className="stat-value mt-2">
            {totalTeachers}
          </p>
        </div>

        <div className="stat-card py-5">
          <p className="text-gray-600 font-medium">
            Class Teachers
          </p>

          <p className="stat-value mt-2">
            {classTeachers}
          </p>
        </div>

        <div className="stat-card py-5">
          <p className="text-gray-600 font-medium">
            Subject Teachers
          </p>

          <p className="stat-value mt-2">
            {subjectSpecialists}
          </p>
        </div>

        <div className="stat-card py-5">
          <p className="text-gray-600 font-medium">
            Active Assignments
          </p>

          <p className="stat-value mt-2">
            {activeAssignments}
          </p>

          <p className="text-xs text-gray-400 mt-1">
            Assignment records
          </p>
        </div>

      </div>

      {/* FILTERS */}

      <div className="card space-y-4">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* SEARCH */}

          <div className="lg:col-span-2">
            <label className="form-label">
              Search Teacher
            </label>

            <input
              type="text"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
              placeholder="Search teacher, class or subject..."
              className="milk-input w-full"
            />
          </div>

          {/* TERM */}

          <div>
            <label className="form-label">
              Term
            </label>

            <select
              value={filterTerm}
              onChange={(event) =>
                setFilterTerm(
                  event.target.value
                )
              }
              className="milk-input w-full"
            >
              <option value="">
                All Terms
              </option>

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

          {/* YEAR */}

          <div>
            <label className="form-label">
              Academic Year
            </label>

            <select
              value={filterYear}
              onChange={(event) =>
                setFilterYear(
                  event.target.value
                )
              }
              className="milk-input w-full"
            >
              <option value="">
                All Years
              </option>

              {academicYears.map(
                (year) => (
                  <option
                    key={year}
                    value={year}
                  >
                    {year}
                  </option>
                )
              )}
            </select>
          </div>

        </div>

        <div className="flex items-center gap-2">

          <input
            id="showInactive"
            type="checkbox"
            checked={showInactive}
            onChange={(event) =>
              setShowInactive(
                event.target.checked
              )
            }
            className="h-4 w-4"
          />

          <label
            htmlFor="showInactive"
            className="text-sm text-gray-600"
          >
            Include inactive assignments
          </label>

        </div>

        <div className="text-sm text-gray-500">
          Showing{" "}
          <strong className="text-gray-800">
            {filteredTeachers.length}
          </strong>{" "}
          teacher
          {filteredTeachers.length !== 1
            ? "s"
            : ""}{" "}
          from{" "}
          <strong className="text-gray-800">
            {teacherProfiles.length}
          </strong>{" "}
          registered teachers.

          <span className="block mt-1 text-xs text-gray-400">
            Teachers without assignments remain visible.
          </span>
        </div>

      </div>

      {/* TEACHERS */}

      <div>

        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Teaching Staff
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            All registered teachers are shown. Open a
            profile to assign classes and subjects.
          </p>
        </div>

        {filteredTeachers.length === 0 ? (
          <div className="card text-center py-12">

            <div className="text-4xl mb-3">
              👨‍🏫
            </div>

            <h3 className="font-semibold text-gray-700">
              No teachers found
            </h3>

            <p className="text-gray-500 text-sm mt-2">
              No registered teachers match your search.
            </p>

          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

            {filteredTeachers.map(
              (teacher) => {
                const teacherAssignments =
                  teacher.filteredAssignments ||
                  [];

                const classes = [
                  ...new Map(
                    teacherAssignments
                      .filter(
                        (assignment) =>
                          assignment.classroomId !==
                          null &&
                          assignment.classroomId !==
                          undefined
                      )
                      .map(
                        (assignment) => [
                          assignment.classroomId,
                          assignment.classroomName,
                        ]
                      )
                  ).values(),
                ];

                const subjects = [
                  ...new Map(
                    teacherAssignments
                      .filter(
                        (assignment) =>
                          assignment.subjectId !==
                          null &&
                          assignment.subjectId !==
                          undefined
                      )
                      .map(
                        (assignment) => [
                          assignment.subjectId,
                          assignment.subjectName,
                        ]
                      )
                  ).values(),
                ];

                const isClassTeacher =
                  teacherAssignments.some(
                    (assignment) =>
                      assignment.isClassTeacher &&
                      assignment.isActive
                  );

                const isUnassigned =
                  teacherAssignments.length === 0;

                return (
                  <div
                    key={teacher.id}
                    className={`card transition-shadow hover:shadow-lg ${
                      isUnassigned
                        ? "border-2 border-dashed border-gray-200"
                        : ""
                    }`}
                  >

                    {/* HEADER */}

                    <div className="flex items-start justify-between gap-3 mb-4">

                      <div className="min-w-0">

                        <h3 className="text-lg font-semibold text-gray-800 break-words">
                          {teacher.name}
                        </h3>

                        <p className="text-sm text-gray-500 mt-1">
                          Teacher Profile ID:{" "}
                          {teacher.id}
                        </p>

                        {teacher.employeeNumber && (
                          <p className="text-xs text-gray-400 mt-1">
                            Employee No:{" "}
                            {teacher.employeeNumber}
                          </p>
                        )}

                        {teacher.email && (
                          <p className="text-xs text-gray-400 mt-1 break-all">
                            {teacher.email}
                          </p>
                        )}

                      </div>

                      {isClassTeacher && (
                        <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold whitespace-nowrap">
                          Class Teacher
                        </span>
                      )}

                    </div>

                    {/* UNASSIGNED */}

                    {isUnassigned && (
                      <div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 p-3">

                        <div className="flex items-start gap-2">

                          <span className="text-lg">
                            ⚠️
                          </span>

                          <div>
                            <p className="text-sm font-semibold text-yellow-800">
                              Not Assigned Yet
                            </p>

                            <p className="text-xs text-yellow-700 mt-1">
                              Open the teacher profile to
                              assign a class and/or subject.
                            </p>
                          </div>

                        </div>

                      </div>
                    )}

                    {/* CLASSES */}

                    <div className="mb-4">

                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Assigned Classes
                      </p>

                      {classes.length > 0 ? (
                        <div className="flex flex-wrap gap-2">

                          {classes.map(
                            (
                              className,
                              index
                            ) => (
                              <span
                                key={`${className}-${index}`}
                                className="px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-xs"
                              >
                                {className}
                              </span>
                            )
                          )}

                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">
                          No class assigned
                        </span>
                      )}

                    </div>

                    {/* SUBJECTS */}

                    <div className="mb-4">

                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Subjects Taught
                      </p>

                      {subjects.length > 0 ? (
                        <div className="flex flex-wrap gap-2">

                          {subjects.map(
                            (
                              subject,
                              index
                            ) => (
                              <span
                                key={`${subject}-${index}`}
                                className="px-2 py-1 rounded-md bg-green-100 text-green-700 text-xs"
                              >
                                {subject}
                              </span>
                            )
                          )}

                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">
                          No subject assigned
                        </span>
                      )}

                    </div>

                    {/* COUNT */}

                    <div className="border-t pt-3 mb-4">

                      <div className="flex justify-between text-sm">

                        <span className="text-gray-500">
                          Assignments
                        </span>

                        <strong
                          className={
                            teacherAssignments.length > 0
                              ? "text-gray-800"
                              : "text-yellow-600"
                          }
                        >
                          {teacherAssignments.length}
                        </strong>

                      </div>

                    </div>

                    {/* BUTTON */}

                    <button
                      type="button"
                      onClick={() =>
                        viewTeacher(
                          teacher
                        )
                      }
                      className="milk-btn w-full"
                    >
                      {isUnassigned
                        ? "Assign Teacher"
                        : "View Full Profile"}
                    </button>

                  </div>
                );
              }
            )}

          </div>
        )}

      </div>

    </div>
  );
};

export default CoordinatorTeachers;