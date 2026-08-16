import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

const TimetableForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    academic_year: "",
    term: "",
    day: "",
    start_time: "",
    end_time: "",
    assignment: "",
  });

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // TERMS
  // =====================================================
  const terms = [
    {
      value: "Term 1",
      label: "Term 1",
    },
    {
      value: "Term 2",
      label: "Term 2",
    },
    {
      value: "Term 3",
      label: "Term 3",
    },
  ];

  // =====================================================
  // DAYS
  // IMPORTANT:
  // These values MUST match the Django backend.
  // Your backend expects "Monday", "Tuesday", etc.
  // =====================================================
  const days = [
    {
      value: "Monday",
      label: "Monday",
    },
    {
      value: "Tuesday",
      label: "Tuesday",
    },
    {
      value: "Wednesday",
      label: "Wednesday",
    },
    {
      value: "Thursday",
      label: "Thursday",
    },
    {
      value: "Friday",
      label: "Friday",
    },
    {
      value: "Saturday",
      label: "Saturday",
    },
  ];

  // =====================================================
  // LOAD ASSIGNMENTS + EDIT DATA
  // =====================================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        // =================================================
        // LOAD ASSIGNMENTS
        // =================================================
        const assignRes = await api.get("assignments/");

        const assignmentData =
          assignRes.data.results || assignRes.data;

        setAssignments(assignmentData);

        // =================================================
        // EDIT MODE
        // =================================================
        if (id) {
          const res = await api.get(`timetable/${id}/`);

          const timetable = res.data;

          setFormData({
            academic_year:
              timetable.academic_year || "",

            term:
              timetable.term?.trim() || "",

            day:
              timetable.day || "",

            // HTML time input requires HH:MM
            // Backend returns HH:MM:SS
            start_time:
              timetable.start_time
                ? timetable.start_time.substring(0, 5)
                : "",

            end_time:
              timetable.end_time
                ? timetable.end_time.substring(0, 5)
                : "",

            assignment:
              timetable.assignment || "",
          });
        }
      } catch (err) {
        console.error(
          "Failed to load form data:",
          err
        );

        console.error(
          "Backend error:",
          err.response?.data
        );

        setError(
          "Could not load required data."
        );
      }
    };

    fetchData();
  }, [id]);

  // =====================================================
  // HANDLE INPUT CHANGE
  // =====================================================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // VALIDATE TIME
  // =====================================================
  const validateTimes = () => {
    if (
      !formData.start_time ||
      !formData.end_time
    ) {
      return false;
    }

    return (
      formData.start_time <
      formData.end_time
    );
  };

  // =====================================================
  // SUBMIT FORM
  // =====================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    // =================================================
    // VALIDATE TIME
    // =================================================
    if (!validateTimes()) {
      setError(
        "Start time must be earlier than end time!"
      );

      setLoading(false);
      return;
    }

    // =================================================
    // CREATE PAYLOAD
    // =================================================
    const payload = {
      assignment: Number(
        formData.assignment
      ),

      academic_year:
        formData.academic_year.trim(),

      term: formData.term,

      day: formData.day,

      start_time:
        formData.start_time.length === 5
          ? `${formData.start_time}:00`
          : formData.start_time,

      end_time:
        formData.end_time.length === 5
          ? `${formData.end_time}:00`
          : formData.end_time,

      is_active: true,
    };

    console.log(
      "Timetable payload:",
      payload
    );

    try {
      // =================================================
      // UPDATE
      // =================================================
      if (id) {
        await api.put(
          `timetable/update/${id}/`,
          payload
        );
      }

      // =================================================
      // CREATE
      // =================================================
      else {
        await api.post(
          "timetable/create/",
          payload
        );
      }

      // =================================================
      // SUCCESS
      // =================================================
      navigate(
        "/academic-coordinator/timetable"
      );
    } catch (err) {
      console.error(
        "Save failed:",
        err
      );

      console.error(
        "Backend errors:",
        err.response?.data
      );

      if (err.response?.data) {
        setError(
          `Error: ${JSON.stringify(
            err.response.data
          )}`
        );
      } else {
        setError(
          "Failed to save timetable. Check the fields or overlapping time."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div className="p-6">

      {/* =================================================
          HEADER
      ================================================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">

        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {id
              ? "Edit Timetable Entry"
              : "Create Timetable Entry"}
          </h1>

          <p className="text-gray-500 mt-1">
            {id
              ? "Update schedule details"
              : "Add new lesson/period to timetable"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-4 md:mt-0 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
        >
          Cancel
        </button>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-100 text-red-700">
          {error}
        </div>
      )}

      {/* =================================================
          FORM CARD
      ================================================= */}
      <div className="card">

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          <div className="grid md:grid-cols-2 gap-6">

            {/* =================================================
                ACADEMIC YEAR
            ================================================= */}
            <div>
              <label className="form-lable">
                Academic Year{" "}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <input
                type="text"
                name="academic_year"
                placeholder="e.g 2026/2027"
                value={
                  formData.academic_year
                }
                onChange={handleChange}
                className="milk-input"
                required
              />
            </div>

            {/* =================================================
                TERM
            ================================================= */}
            <div>
              <label className="form-lable">
                Term{" "}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <select
                name="term"
                value={formData.term}
                onChange={handleChange}
                className="milk-input"
                required
              >
                <option value="">
                  -- Select Term --
                </option>

                {terms.map((term) => (
                  <option
                    key={term.value}
                    value={term.value}
                  >
                    {term.label}
                  </option>
                ))}
              </select>
            </div>

            {/* =================================================
                DAY
            ================================================= */}
            <div>
              <label className="form-lable">
                Day of Week{" "}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <select
                name="day"
                value={formData.day}
                onChange={handleChange}
                className="milk-input"
                required
              >
                <option value="">
                  -- Select Day --
                </option>

                {days.map((day) => (
                  <option
                    key={day.value}
                    value={day.value}
                  >
                    {day.label}
                  </option>
                ))}
              </select>
            </div>

            {/* =================================================
                ASSIGNMENT
            ================================================= */}
            <div className="md:col-span-2">

              <label className="form-lable">
                Assignment{" "}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <select
                name="assignment"
                value={
                  formData.assignment
                }
                onChange={handleChange}
                className="milk-input"
                required
                disabled={
                  assignments.length === 0
                }
              >

                <option value="">
                  {assignments.length === 0
                    ? "No assignments available"
                    : "-- Select Assignment --"}
                </option>

                {assignments.map((a) => (
                  <option
                    key={a.id}
                    value={a.id}
                  >
                    {a.classroom_name ||
                      `${a.classroom?.grade || ""} ${
                        a.classroom?.stream || ""
                      }`}{" "}
                    —{" "}
                    {a.subject_name ||
                      a.subject?.name ||
                      ""}{" "}
                    —{" "}
                    {a.teacher_name ||
                      `${a.teacher?.user?.first_name || ""} ${
                        a.teacher?.user?.last_name || ""
                      }`}
                  </option>
                ))}

              </select>
            </div>

            {/* =================================================
                START TIME
            ================================================= */}
            <div>
              <label className="form-lable">
                Start Time{" "}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <input
                type="time"
                name="start_time"
                value={
                  formData.start_time
                }
                onChange={handleChange}
                className="milk-input"
                required
              />
            </div>

            {/* =================================================
                END TIME
            ================================================= */}
            <div>
              <label className="form-lable">
                End Time{" "}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <input
                type="time"
                name="end_time"
                value={
                  formData.end_time
                }
                onChange={handleChange}
                className="milk-input"
                required
              />
            </div>

          </div>

          {/* =================================================
              BUTTON
          ================================================= */}
          <div className="flex justify-end pt-4 border-t">

            <button
              type="submit"
              className="milk-btn min-w-[150px]"
              disabled={loading}
            >

              {loading ? (
                <span className="flex items-center gap-2">

                  <i className="bi bi-arrow-repeat animate-spin"></i>

                  Saving...

                </span>
              ) : id ? (
                "Update Entry"
              ) : (
                "Save Entry"
              )}

            </button>

          </div>

        </form>

      </div>
    </div>
  );
};

export default TimetableForm;
