import React, {
  useEffect,
  useState,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

// =====================================================
// ACADEMIC COORDINATOR DASHBOARD
// =====================================================

const AcademicCoDashboard = () => {
  const navigate = useNavigate();

  // ===================================================
  // DASHBOARD STATS
  // ===================================================

  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    subjects: 0,
    classes: 0,
    assessments: 0,
    timetables: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ===================================================
  // GET COUNT FROM API RESPONSE
  // ===================================================

  const getCount = (response) => {
    if (!response || !response.data) {
      return 0;
    }

    const data = response.data;

    // -------------------------------------------------
    // DRF PAGINATED RESPONSE
    // Example:
    // {
    //   count: 20,
    //   next: "...",
    //   previous: null,
    //   results: [...]
    // }
    // -------------------------------------------------

    if (
      typeof data === "object" &&
      typeof data.count === "number"
    ) {
      return data.count;
    }

    // -------------------------------------------------
    // NORMAL ARRAY RESPONSE
    // -------------------------------------------------

    if (Array.isArray(data)) {
      return data.length;
    }

    // -------------------------------------------------
    // OBJECT WITH RESULTS ARRAY
    // -------------------------------------------------

    if (
      typeof data === "object" &&
      Array.isArray(data.results)
    ) {
      return data.results.length;
    }

    return 0;
  };

  // ===================================================
  // SAFE API REQUEST
  // ===================================================

  const safeGet = async (url, label) => {
    try {
      const response = await api.get(url);

      console.log(
        "===================================="
      );

      console.log(
        `${label} RESPONSE:`,
        response.data
      );

      console.log(
        "===================================="
      );

      return response;
    } catch (error) {
      console.error(
        `${label} FAILED:`,
        error.response?.status,
        error.response?.data ||
          error.message
      );

      return null;
    }
  };

  // ===================================================
  // LOAD DASHBOARD
  // ===================================================

  const loadDashboard = useCallback(async () => {
    try {
      setError("");

      // =================================================
      // ONLY USE ENDPOINTS THAT EXIST
      // =================================================
      //
      // Removed:
      //
      // results/pending/
      // results/approved/
      //
      // Those endpoints are not registered in the
      // Django results URLs.
      // =================================================

      const [
        students,
        teachers,
        subjects,
        classes,
        assessments,
        timetable,
      ] = await Promise.all([
        safeGet(
          "students/",
          "STUDENTS"
        ),

        safeGet(
          "assignments/teacher-profile/",
          "TEACHERS"
        ),

        safeGet(
          "subjects/",
          "SUBJECTS"
        ),

        safeGet(
          "classes/",
          "CLASSES"
        ),

        safeGet(
          "results/assessments/",
          "ASSESSMENTS"
        ),

        safeGet(
          "timetable/",
          "TIMETABLE"
        ),
      ]);

      // =================================================
      // COUNTS
      // =================================================

      const studentCount =
        getCount(students);

      const teacherCount =
        getCount(teachers);

      const subjectCount =
        getCount(subjects);

      const classCount =
        getCount(classes);

      const assessmentCount =
        getCount(assessments);

      const timetableCount =
        getCount(timetable);

      // =================================================
      // DEBUG
      // =================================================

      console.log(
        "===================================="
      );

      console.log(
        "ACADEMIC DASHBOARD STATS"
      );

      console.log(
        "===================================="
      );

      console.log(
        "Students:",
        studentCount
      );

      console.log(
        "Teachers:",
        teacherCount
      );

      console.log(
        "Subjects:",
        subjectCount
      );

      console.log(
        "Classes:",
        classCount
      );

      console.log(
        "Assessments:",
        assessmentCount
      );

      console.log(
        "Timetable:",
        timetableCount
      );

      console.log(
        "===================================="
      );

      // =================================================
      // UPDATE STATE
      // =================================================

      setStats({
        students: studentCount,
        teachers: teacherCount,
        subjects: subjectCount,
        classes: classCount,
        assessments: assessmentCount,
        timetables: timetableCount,
      });

      // =================================================
      // SHOW WARNING ONLY IF ALL REQUESTS FAILED
      // =================================================

      const successfulRequests = [
        students,
        teachers,
        subjects,
        classes,
        assessments,
        timetable,
      ].filter(Boolean).length;

      if (successfulRequests === 0) {
        setError(
          "Unable to load academic dashboard information. Please check your connection."
        );
      } else if (successfulRequests < 6) {
        setError(
          "Some academic dashboard information could not be loaded."
        );
      }
    } catch (error) {
      console.error(
        "ACADEMIC DASHBOARD ERROR:",
        error
      );

      setError(
        "Some dashboard information could not be loaded."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // ===================================================
  // REFRESH
  // ===================================================

  const handleRefresh = () => {
    if (refreshing) {
      return;
    }

    setRefreshing(true);

    loadDashboard();
  };

  // ===================================================
  // DASHBOARD CARDS
  // ===================================================

  const cards = [
    {
      title: "Total Students",
      value: stats.students,
      icon: "bi-people-fill",
      color: "blue",
    },

    {
      title: "Assigned Teachers",
      value: stats.teachers,
      icon: "bi-person-badge-fill",
      color: "green",
    },

    {
      title: "School Subjects",
      value: stats.subjects,
      icon: "bi-book-fill",
      color: "purple",
    },

    {
      title: "Active Classes",
      value: stats.classes,
      icon: "bi-building",
      color: "orange",
    },

    {
      title: "Assessments",
      value: stats.assessments,
      icon: "bi-clipboard-check-fill",
      color: "cyan",
    },

    {
      title: "Timetable Entries",
      value: stats.timetables,
      icon: "bi-calendar3",
      color: "pink",
    },
  ];

  // ===================================================
  // CARD COLORS
  // ===================================================

  const getCardColor = (color) => {
    const colors = {
      blue:
        "border-blue-500 text-blue-600 bg-blue-50",

      green:
        "border-green-500 text-green-600 bg-green-50",

      purple:
        "border-purple-500 text-purple-600 bg-purple-50",

      orange:
        "border-orange-500 text-orange-600 bg-orange-50",

      cyan:
        "border-cyan-500 text-cyan-600 bg-cyan-50",

      pink:
        "border-pink-500 text-pink-600 bg-pink-50",
    };

    return (
      colors[color] ||
      "border-gray-500 text-gray-600 bg-gray-50"
    );
  };

  // ===================================================
  // LOADING SCREEN
  // ===================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center">

          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-600 mx-auto mb-4"></div>

          <p className="text-gray-500">
            Loading dashboard data...
          </p>

        </div>
      </div>
    );
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 space-y-5 md:space-y-8">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="card">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          <div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">
              Academic Coordinator Dashboard
            </h1>

            <p className="text-gray-500 mt-2 text-sm sm:text-base">
              Academic oversight, progress tracking & quality control
            </p>

          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="milk-btn w-full sm:w-auto disabled:opacity-60"
          >
            {refreshing ? (
              <>
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>

                Refreshing...
              </>
            ) : (
              <>
                <i className="bi bi-arrow-clockwise mr-2"></i>

                Refresh
              </>
            )}
          </button>

        </div>

      </div>

      {/* =================================================
          ERROR / WARNING
      ================================================= */}

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-3 text-sm">

          <div className="flex items-start gap-2">

            <i className="bi bi-exclamation-triangle-fill mt-0.5"></i>

            <span>
              {error}
            </span>

          </div>

        </div>
      )}

      {/* =================================================
          STATISTICS
      ================================================= */}

      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">

        {cards.map((card) => (
          <div
            key={card.title}
            className={`bg-white rounded-xl shadow-sm border-l-4 ${getCardColor(
              card.color
            )} p-4 sm:p-5 lg:p-6 transition hover:shadow-md`}
          >

            <div className="flex items-start justify-between gap-3">

              <div className="min-w-0">

                <p className="text-gray-600 font-medium text-sm sm:text-base">
                  {card.title}
                </p>

                <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-2">
                  {card.value}
                </p>

              </div>

              <div
                className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${getCardColor(
                  card.color
                )}`}
              >

                <i
                  className={`bi ${card.icon} text-lg sm:text-xl`}
                ></i>

              </div>

            </div>

          </div>
        ))}

      </div>

      {/* =================================================
          QUICK ACTIONS
      ================================================= */}

      <div>

        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">
          Academic Management
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">

          {/* =================================================
              CLASSES
          ================================================= */}

          <div className="card">

            <div className="flex items-start gap-3 mb-3">

              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">

                <i className="bi bi-building text-lg"></i>

              </div>

              <div>

                <h2 className="font-semibold text-base sm:text-lg text-gray-800">
                  Classes & Subjects
                </h2>

              </div>

            </div>

            <p className="text-gray-500 text-sm mb-4">
              Manage classrooms, subjects, class teachers and academic organization.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/academic-coordinator/classes"
                )
              }
              className="milk-btn w-full"
            >
              View Classes
            </button>

          </div>

          {/* =================================================
              RESULTS
          ================================================= */}

          <div className="card">

            <div className="flex items-start gap-3 mb-3">

              <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">

                <i className="bi bi-clipboard-check text-lg"></i>

              </div>

              <div>

                <h2 className="font-semibold text-base sm:text-lg text-gray-800">
                  Results & Assessments
                </h2>

              </div>

            </div>

            <p className="text-gray-500 text-sm mb-4">
              Manage assessments, review student results and handle academic performance records.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/academic-coordinator/academic-results"
                )
              }
              className="milk-btn w-full"
            >
              Manage Results
            </button>

          </div>

          {/* =================================================
              TIMETABLE
          ================================================= */}

          <div className="card">

            <div className="flex items-start gap-3 mb-3">

              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">

                <i className="bi bi-calendar3 text-lg"></i>

              </div>

              <div>

                <h2 className="font-semibold text-base sm:text-lg text-gray-800">
                  Timetable
                </h2>

              </div>

            </div>

            <p className="text-gray-500 text-sm mb-4">
              View and manage the school's class and teacher timetable.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/academic-coordinator/timetable"
                )
              }
              className="milk-btn w-full"
            >
              View Timetable
            </button>

          </div>

        </div>

      </div>

    </div>
  );
};

export default AcademicCoDashboard;