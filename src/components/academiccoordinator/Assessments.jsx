import React, { useEffect, useState } from "react";
import {
  FaClipboardList,
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaTimes,
} from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../api/api";

const Assessments = () => {
  const [assessments, setAssessments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    classroom: "",
    assessment_type: "",
    academic_year: "",
    term: "",
    total_marks: "",
    assessment_date: "",
  });

  const [editingId, setEditingId] = useState(null);

  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {
    fetchAssessments();
    fetchSubjects();
    fetchClassrooms();
  }, []);

  // =====================================================
  // FETCH ASSESSMENTS
  // =====================================================

  const fetchAssessments = async () => {
    try {
      setLoading(true);

      const res = await api.get("results/assessments/");

      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.results || [];

      setAssessments(data);
    } catch (err) {
      console.error(
        "Failed to fetch assessments:",
        err.response?.data || err
      );

      toast.error("Failed to load assessments.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FETCH SUBJECTS FROM BACKEND
  // =====================================================

  const fetchSubjects = async () => {
    try {
      const res = await api.get("subjects/");

      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.results || [];

      console.log("Subjects loaded:", data);

      setSubjects(data);
    } catch (err) {
      console.error(
        "Failed to fetch subjects:",
        err.response?.data || err
      );

      toast.error("Failed to load subjects.");
    }
  };

  // =====================================================
  // FETCH CLASSROOMS FROM BACKEND
  // =====================================================

  const fetchClassrooms = async () => {
    try {
      const res = await api.get("classes/");

      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.results || [];

      console.log("Classrooms loaded:", data);

      setClassrooms(data);
    } catch (err) {
      console.error(
        "Failed to fetch classrooms:",
        err.response?.data || err
      );

      toast.error("Failed to load classes.");
    }
  };

  // =====================================================
  // GET SUBJECT DISPLAY NAME
  // =====================================================

  const getSubjectName = (subject) => {
    if (!subject) return "-";

    // If backend returns an object
    if (typeof subject === "object") {
      return (
        subject.name ||
        subject.subject_name ||
        subject.title ||
        "-"
      );
    }

    // If backend returns only ID
    const found = subjects.find(
      (item) => String(item.id) === String(subject)
    );

    if (!found) return String(subject);

    return (
      found.name ||
      found.subject_name ||
      found.title ||
      String(subject)
    );
  };

  // =====================================================
  // GET FULL CLASSROOM DISPLAY NAME
  // =====================================================

  const getClassroomName = (classroom) => {
    if (!classroom) return "-";

    // Backend returned object
    if (typeof classroom === "object") {
      // Best option
      if (classroom.classroom_name) {
        return classroom.classroom_name;
      }

      if (classroom.name) {
        // If name is already "Grade 5 - A"
        if (
          classroom.name.includes("-") ||
          classroom.name.toLowerCase().includes("grade") ||
          classroom.name.toLowerCase().includes("pp")
        ) {
          return classroom.name;
        }
      }

      // Try grade/class + stream
      const grade =
        classroom.grade_name ||
        classroom.grade ||
        classroom.class_name ||
        classroom.classroom ||
        classroom.name ||
        "";

      const stream =
        classroom.stream ||
        classroom.stream_name ||
        "";

      if (grade && stream) {
        return `${grade} - ${stream}`;
      }

      return grade || stream || "-";
    }

    // Backend returned only ID
    const found = classrooms.find(
      (item) => String(item.id) === String(classroom)
    );

    if (!found) return String(classroom);

    if (found.classroom_name) {
      return found.classroom_name;
    }

    const grade =
      found.grade_name ||
      found.grade ||
      found.class_name ||
      found.classroom ||
      found.name ||
      "";

    const stream =
      found.stream ||
      found.stream_name ||
      "";

    if (grade && stream) {
      return `${grade} - ${stream}`;
    }

    return grade || stream || String(classroom);
  };

  // =====================================================
  // HANDLE INPUT
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // CLEAR FORM
  // =====================================================

  const clearForm = () => {
    setEditingId(null);

    setFormData({
      name: "",
      subject: "",
      classroom: "",
      assessment_type: "",
      academic_year: "",
      term: "",
      total_marks: "",
      assessment_date: "",
    });
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Convert numeric fields before sending to Django
      const payload = {
        ...formData,
        subject: Number(formData.subject),
        classroom: Number(formData.classroom),
        academic_year: Number(formData.academic_year),
        total_marks: Number(formData.total_marks),
      };

      console.log("Assessment payload:", payload);

      if (editingId) {
        await api.put(
          `results/assessments/${editingId}/`,
          payload
        );

        toast.success("Assessment updated successfully.");
      } else {
        await api.post(
          "results/assessments/",
          payload
        );

        toast.success("Assessment created successfully.");
      }

      await fetchAssessments();

      clearForm();
    } catch (err) {
      console.error(
        "Assessment save error:",
        err.response?.data || err
      );

      const backendError = err.response?.data;

      if (backendError && typeof backendError === "object") {
        Object.entries(backendError).forEach(
          ([field, messages]) => {
            if (Array.isArray(messages)) {
              messages.forEach((message) => {
                toast.error(`${field}: ${message}`);
              });
            } else {
              toast.error(`${field}: ${messages}`);
            }
          }
        );
      } else {
        toast.error("Failed to save assessment.");
      }
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // EDIT
  // =====================================================

  const handleEdit = (assessment) => {
    setEditingId(assessment.id);

    setFormData({
      name: assessment.name || "",
      subject:
        assessment.subject?.id ||
        assessment.subject ||
        "",
      classroom:
        assessment.classroom?.id ||
        assessment.classroom ||
        "",
      assessment_type:
        assessment.assessment_type || "",
      academic_year:
        assessment.academic_year || "",
      term:
        assessment.term || "",
      total_marks:
        assessment.total_marks || "",
      assessment_date:
        assessment.assessment_date || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this assessment?"
    );

    if (!confirmed) return;

    try {
      await api.delete(
        `results/assessments/${id}/`
      );

      toast.success(
        "Assessment deleted successfully."
      );

      await fetchAssessments();
    } catch (err) {
      console.error(
        "Delete error:",
        err.response?.data || err
      );

      toast.error(
        "Failed to delete assessment."
      );
    }
  };

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredAssessments =
    assessments.filter((assessment) => {
      const searchTerm = search.toLowerCase();

      return (
        assessment.name
          ?.toLowerCase()
          .includes(searchTerm) ||

        assessment.assessment_type
          ?.toLowerCase()
          .includes(searchTerm) ||

        assessment.term
          ?.toLowerCase()
          .includes(searchTerm) ||

        getSubjectName(
          assessment.subject
        )
          ?.toLowerCase()
          .includes(searchTerm) ||

        getClassroomName(
          assessment.classroom
        )
          ?.toLowerCase()
          .includes(searchTerm)
      );
    });

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-6 flex items-center gap-3">

        <div className="bg-green-600 text-white p-3 rounded-xl">
          <FaClipboardList className="text-xl" />
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Assessments
          </h1>

          <p className="text-gray-500">
            Create and manage student assessments
          </p>
        </div>

      </div>

      {/* =================================================
          FORM
      ================================================= */}

      <div className="card mb-6">

        <div className="flex items-center justify-between mb-5">

          <h2 className="text-xl font-semibold text-gray-800">
            {editingId
              ? "Edit Assessment"
              : "Create Assessment"}
          </h2>

          {editingId && (
            <button
              type="button"
              onClick={clearForm}
              className="flex items-center gap-2 text-gray-500 hover:text-red-600"
            >
              <FaTimes />
              Cancel
            </button>
          )}

        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
        >

          {/* Assessment Name */}

          <div>
            <label className="form-label">
              Assessment Name
            </label>

            <input
              type="text"
              name="name"
              placeholder="e.g. Mathematics CAT 1"
              value={formData.name}
              onChange={handleChange}
              className="milk-input"
              required
            />
          </div>

          {/* SUBJECT */}

          <div>
            <label className="form-label">
              Subject
            </label>

            <select
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="milk-input"
              required
            >
              <option value="">
                Select Subject
              </option>

              {subjects.map((subject) => (
                <option
                  key={subject.id}
                  value={subject.id}
                >
                  {getSubjectName(subject)}
                </option>
              ))}
            </select>

            {subjects.length === 0 && (
              <p className="text-sm text-red-500 mt-1">
                No subjects found.
              </p>
            )}
          </div>

          {/* CLASSROOM */}

          <div>
            <label className="form-label">
              Class
            </label>

            <select
              name="classroom"
              value={formData.classroom}
              onChange={handleChange}
              className="milk-input"
              required
            >
              <option value="">
                Select Class
              </option>

              {classrooms.map((classroom) => (
                <option
                  key={classroom.id}
                  value={classroom.id}
                >
                  {getClassroomName(classroom)}
                </option>
              ))}
            </select>

            {classrooms.length === 0 && (
              <p className="text-sm text-red-500 mt-1">
                No classes found.
              </p>
            )}
          </div>

          {/* ASSESSMENT TYPE */}

          <div>
            <label className="form-label">
              Assessment Type
            </label>

            <input
              type="text"
              name="assessment_type"
              placeholder="e.g. CAT 1"
              value={formData.assessment_type}
              onChange={handleChange}
              className="milk-input"
              required
            />
          </div>

          {/* ACADEMIC YEAR */}

          <div>
            <label className="form-label">
              Academic Year
            </label>

            <input
              type="number"
              name="academic_year"
              placeholder="e.g. 2026"
              value={formData.academic_year}
              onChange={handleChange}
              className="milk-input"
              required
            />
          </div>

          {/* TERM */}

          <div>
            <label className="form-label">
              Term
            </label>

            <select
              name="term"
              value={formData.term}
              onChange={handleChange}
              className="milk-input"
              required
            >
              <option value="">
                Select Term
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

          {/* TOTAL MARKS */}

          <div>
            <label className="form-label">
              Total Marks
            </label>

            <input
              type="number"
              name="total_marks"
              placeholder="e.g. 100"
              min="1"
              max="999"
              step="1"
              value={formData.total_marks}
              onChange={handleChange}
              className="milk-input"
              required
            />
          </div>

          {/* DATE */}

          <div>
            <label className="form-label">
              Assessment Date
            </label>

            <input
              type="date"
              name="assessment_date"
              value={formData.assessment_date}
              onChange={handleChange}
              className="milk-input"
              required
            />
          </div>

          {/* SUBMIT */}

          <div className="lg:col-span-4">

            <button
              type="submit"
              disabled={loading}
              className="milk-btn w-full flex items-center justify-center gap-2"
            >
              <FaPlus />

              {loading
                ? "Saving..."
                : editingId
                ? "Update Assessment"
                : "Create Assessment"}
            </button>

          </div>

        </form>
      </div>

      {/* =================================================
          SEARCH
      ================================================= */}

      <div className="card mb-6">

        <div className="relative max-w-md">

          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

          <input
            type="text"
            placeholder="Search assessments..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="milk-input pl-10"
          />

        </div>

      </div>

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="card overflow-x-auto">

        <table className="w-full text-left">

          <thead>
            <tr className="bg-green-600 text-white">

              <th className="p-3">
                Name
              </th>

              <th className="p-3">
                Subject
              </th>

              <th className="p-3">
                Class
              </th>

              <th className="p-3">
                Assessment Type
              </th>

              <th className="p-3">
                Academic Year
              </th>

              <th className="p-3">
                Term
              </th>

              <th className="p-3">
                Total Marks
              </th>

              <th className="p-3">
                Date
              </th>

              <th className="p-3 text-center">
                Actions
              </th>

            </tr>
          </thead>

          <tbody>

            {loading ? (
              <tr>
                <td
                  colSpan={9}
                  className="p-8 text-center text-gray-500"
                >
                  Loading assessments...
                </td>
              </tr>
            ) : filteredAssessments.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="p-8 text-center text-gray-500"
                >
                  No assessments found.
                </td>
              </tr>
            ) : (
              filteredAssessments.map(
                (assessment) => (
                  <tr
                    key={assessment.id}
                    className="border-b border-gray-100 hover:bg-green-50 transition"
                  >

                    <td className="p-3 font-medium">
                      {assessment.name}
                    </td>

                    <td className="p-3">
                      {getSubjectName(
                        assessment.subject
                      )}
                    </td>

                    <td className="p-3">
                      {getClassroomName(
                        assessment.classroom
                      )}
                    </td>

                    <td className="p-3">
                      {assessment.assessment_type}
                    </td>

                    <td className="p-3">
                      {assessment.academic_year}
                    </td>

                    <td className="p-3">
                      {assessment.term}
                    </td>

                    <td className="p-3">
                      {assessment.total_marks}
                    </td>

                    <td className="p-3">
                      {assessment.assessment_date}
                    </td>

                    <td className="p-3">

                      <div className="flex justify-center gap-4">

                        <button
                          type="button"
                          onClick={() =>
                            handleEdit(
                              assessment
                            )
                          }
                          className="text-green-600 hover:text-green-800 transition"
                          title="Edit assessment"
                        >
                          <FaEdit />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              assessment.id
                            )
                          }
                          className="text-red-600 hover:text-red-800 transition"
                          title="Delete assessment"
                        >
                          <FaTrash />
                        </button>

                      </div>

                    </td>

                  </tr>
                )
              )
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
};

export default Assessments;