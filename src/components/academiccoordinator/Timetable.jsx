import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

const Timetable = () => {
  const navigate = useNavigate();

  // =====================================================
  // DATA
  // =====================================================

  const [timetableData, setTimetableData] = useState([]);
  const [classes, setClasses] = useState([]);
  const [groupedByDay, setGroupedByDay] = useState({});

  // =====================================================
  // STATE
  // =====================================================

  const [loading, setLoading] = useState(true);
  const [classesLoading, setClassesLoading] =
    useState(true);

  const [filters, setFilters] = useState({
    year: "",
    term: "",
    class_id: "",
  });

  // =====================================================
  // DAYS
  // IMPORTANT:
  // These MUST match Django model values
  // =====================================================

  const daysOrder = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // =====================================================
  // DAY DISPLAY
  // =====================================================

  const dayNames = {
    Monday: "Monday",
    Tuesday: "Tuesday",
    Wednesday: "Wednesday",
    Thursday: "Thursday",
    Friday: "Friday",
    Saturday: "Saturday",
  };

  // =====================================================
  // TERMS
  // =====================================================

  const terms = [
    "Term 1",
    "Term 2",
    "Term 3",
  ];

  // =====================================================
  // GET CLASS NAME
  // =====================================================

  const getClassName = (classroom) => {
    if (!classroom) {
      return "Unknown Class";
    }

    if (classroom.name) {
      return classroom.name;
    }

    if (classroom.classroom_name) {
      return classroom.classroom_name;
    }

    const grade =
      classroom.grade || "";

    const stream =
      classroom.stream || "";

    const name =
      `${grade} ${stream}`.trim();

    return name || `Class ${classroom.id}`;
  };

  // =====================================================
  // LOAD CLASSES
  // =====================================================

  useEffect(() => {
    const loadClasses = async () => {
      try {
        setClassesLoading(true);

        const res =
          await api.get("classes/");

        const data =
          res.data?.results ||
          res.data ||
          [];

        setClasses(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        console.error(
          "Failed to load classes:",
          err
        );

        setClasses([]);
      } finally {
        setClassesLoading(false);
      }
    };

    loadClasses();
  }, []);

  // =====================================================
  // LOAD TIMETABLE
  // =====================================================

  useEffect(() => {
    loadTimetable();
  }, [
    filters.year,
    filters.term,
    filters.class_id,
  ]);

  const loadTimetable = async () => {
    try {
      setLoading(true);

      const params = {};

      if (filters.year) {
        params.academic_year =
          filters.year;
      }

      if (filters.term) {
        params.term =
          filters.term;
      }

      let res;

      // =================================================
      // CLASS FILTER
      // =================================================

      if (filters.class_id) {
        res = await api.get(
          `timetable/classroom/${filters.class_id}/`,
          {
            params,
          }
        );
      } else {
        res = await api.get(
          "timetable/",
          {
            params,
          }
        );
      }

      const data =
        res.data?.results ||
        res.data ||
        [];

      const timetable =
        Array.isArray(data)
          ? data
          : [];

      setTimetableData(
        timetable
      );

      // =================================================
      // GROUP BY DAY
      // =================================================

      const grouped = {};

      daysOrder.forEach((day) => {
        grouped[day] = {
          name:
            dayNames[day],
          entries: [],
        };
      });

      timetable.forEach(
        (entry) => {
          const day =
            entry.day;

          if (
            grouped[day]
          ) {
            grouped[
              day
            ].entries.push(
              entry
            );
          }
        }
      );

      setGroupedByDay(
        grouped
      );

    } catch (err) {
      console.error(
        "Failed to load timetable:",
        err
      );

      setTimetableData([]);
      setGroupedByDay({});
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime = (time) => {
    if (!time) {
      return "";
    }

    return time.substring(
      0,
      5
    );
  };

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {
    setFilters({
      year: "",
      term: "",
      class_id: "",
    });
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (
    loading &&
    timetableData.length === 0
  ) {
    return (
      <div className="flex justify-center py-10">
        <p className="text-gray-500">
          Loading Timetable...
        </p>
      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-8">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">

        <div>
          <h1 className="text-[clamp(1.5rem,3vw,2.2rem)] font-bold text-gray-800">
            Class Timetable
          </h1>

          <p className="text-gray-500">
            Weekly class schedule & lesson times
          </p>
        </div>

        <button
          onClick={() =>
            navigate(
              "/academic-coordinator/timetable/create"
            )
          }
          className="milk-btn w-fit"
        >
          + Create Timetable
        </button>

      </div>

      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="card">

        <div className="grid md:grid-cols-3 gap-4">

          {/* =================================================
              ACADEMIC YEAR
          ================================================= */}

          <div>
            <label className="form-lable">
              Academic Year
            </label>

            <input
              type="text"
              placeholder="e.g. 2026/2027"
              className="milk-input"
              value={
                filters.year
              }
              onChange={(e) =>
                setFilters({
                  ...filters,
                  year:
                    e.target.value,
                })
              }
            />
          </div>

          {/* =================================================
              TERM
          ================================================= */}

          <div>
            <label className="form-lable">
              Term
            </label>

            <select
              className="milk-input"
              value={
                filters.term
              }
              onChange={(e) =>
                setFilters({
                  ...filters,
                  term:
                    e.target.value,
                })
              }
            >
              <option value="">
                All Terms
              </option>

              {terms.map(
                (term) => (
                  <option
                    key={term}
                    value={term}
                  >
                    {term}
                  </option>
                )
              )}
            </select>
          </div>

          {/* =================================================
              CLASS
          ================================================= */}

          <div>
            <label className="form-lable">
              Class
            </label>

            <select
              className="milk-input"
              value={
                filters.class_id
              }
              onChange={(e) =>
                setFilters({
                  ...filters,
                  class_id:
                    e.target.value,
                })
              }
              disabled={
                classesLoading
              }
            >
              <option value="">
                {classesLoading
                  ? "Loading classes..."
                  : "All Classes"}
              </option>

              {classes.map(
                (classroom) => (
                  <option
                    key={
                      classroom.id
                    }
                    value={
                      classroom.id
                    }
                  >
                    {getClassName(
                      classroom
                    )}
                  </option>
                )
              )}
            </select>
          </div>

        </div>

        {/* =================================================
            CLEAR
        ================================================= */}

        {(filters.year ||
          filters.term ||
          filters.class_id) && (
          <div className="mt-4">

            <button
              type="button"
              onClick={
                clearFilters
              }
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm"
            >
              Clear Filters
            </button>

          </div>
        )}

      </div>

      {/* =================================================
          TIMETABLE GRID
      ================================================= */}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

        {daysOrder.map(
          (day) => {

            const dayData =
              groupedByDay[
                day
              ] || {
                name: day,
                entries: [],
              };

            return (
              <div
                key={day}
                className="card"
              >

                {/* DAY HEADER */}

                <h3 className="text-lg font-bold text-green-700 mb-4 border-b pb-2">
                  {dayData.name}
                </h3>

                {/* NO LESSONS */}

                {dayData.entries
                  .length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No lessons scheduled
                  </p>
                ) : (

                  <div className="space-y-3">

                    {dayData.entries
                      .map(
                        (entry) => (

                          <div
                            key={
                              entry.id
                            }
                            className="p-4 bg-green-50 rounded-lg border border-green-200"
                          >

                            {/* TIME */}

                            <div className="flex justify-between items-center mb-2">

                              <span className="font-bold text-green-700">
                                {formatTime(
                                  entry.start_time
                                )}
                                {" - "}
                                {formatTime(
                                  entry.end_time
                                )}
                              </span>

                            </div>

                            {/* CLASS */}

                            <p className="font-semibold text-gray-800">
                              {entry.classroom_name ||
                                "Unknown Class"}
                            </p>

                            {/* SUBJECT */}

                            <p className="text-sm text-gray-700 mt-1">
                              Subject:{" "}
                              <strong>
                                {entry.subject_name ||
                                  "Unknown Subject"}
                              </strong>
                            </p>

                            {/* TEACHER */}

                            <p className="text-sm text-gray-600 mt-1">
                              Teacher:{" "}
                              <strong>
                                {entry.teacher_name ||
                                  "Unknown Teacher"}
                              </strong>
                            </p>

                            {/* TERM */}

                            <p className="text-xs text-gray-500 mt-2">
                              {entry.term}
                              {" • "}
                              {entry.academic_year}
                            </p>

                          </div>

                        )
                      )}

                  </div>

                )}

              </div>
            );
          }
        )}

      </div>

      {/* =================================================
          EMPTY STATE
      ================================================= */}

      {!loading &&
        timetableData.length === 0 && (
          <div className="card text-center py-12">

            <div className="text-5xl mb-4">
              📅
            </div>

            <h3 className="text-lg font-semibold text-gray-800">
              No timetable entries found
            </h3>

            <p className="text-gray-500 mt-2">
              Create a timetable entry
              for a class, subject and
              teacher.
            </p>

            <button
              onClick={() =>
                navigate(
                  "/academic-coordinator/timetable/create"
                )
              }
              className="milk-btn mt-5"
            >
              + Create Timetable
            </button>

          </div>
        )}

    </div>
  );
};

export default Timetable;