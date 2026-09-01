import { useEffect, useState, useCallback } from "react";
import api from "../api/api";

const LearningOutcomes = () => {
  // =====================================================
  // STATE
  // =====================================================
  const [outcomes, setOutcomes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    classroom: "",
    subject: "",
    name: "",
    description: "",
    maximum_marks: "",
  });

  // =====================================================
  // FETCH LEARNING OUTCOMES
  // =====================================================
  const fetchOutcomes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("results/learning-outcomes/");
      const data = res.data?.results ?? res.data ?? [];
      const outcomeData = Array.isArray(data) ? data : [];
      console.log("Learning outcomes loaded:", outcomeData);
      setOutcomes(outcomeData);
      setFiltered(outcomeData);
    } catch (error) {
      console.error("Failed to load learning outcomes:", error);
      console.error("Backend response:", error.response?.data);
    } finally {
      setLoading(false);
    }
  }, []);

  // =====================================================
  // FETCH SUBJECTS
  // =====================================================
  const fetchSubjects = useCallback(async () => {
    try {
      const res = await api.get("subjects/");
      const data = res.data?.results ?? res.data ?? [];
      const subjectData = Array.isArray(data) ? data : [];
      console.log("Subjects loaded:", subjectData);
      setSubjects(subjectData);
    } catch (error) {
      console.error("Failed to load subjects:", error);
      console.error("Backend response:", error.response?.data);
      setSubjects([]);
    }
  }, []);

  // =====================================================
  // FETCH CLASSROOMS
  // =====================================================
  const fetchClassrooms = useCallback(async () => {
    try {
      console.log("Fetching classrooms from classes/ ...");
      const res = await api.get("classes/");
      console.log("Classrooms API response:", res.data);
      const data = res.data?.results ?? res.data ?? [];
      const classroomData = Array.isArray(data) ? data : [];
      console.log("Classrooms loaded from backend:", classroomData);
      setClassrooms(classroomData);
    } catch (error) {
      console.error("Failed to load classrooms:", error);
      console.error("Status:", error.response?.status);
      console.error("Backend response:", error.response?.data);
      setClassrooms([]);
    }
  }, []);

  // =====================================================
  // INITIAL LOAD
  // =====================================================
  useEffect(() => {
    fetchOutcomes();
    fetchSubjects();
    fetchClassrooms();
  }, [fetchOutcomes, fetchSubjects, fetchClassrooms]);

  // =====================================================
  // HELPER: GET CLASSROOM NAME
  // =====================================================
  const getClassroomName = useCallback((classroom) => {
    if (!classroom) return "Unknown Classroom";
    if (classroom.grade && classroom.stream) return `${classroom.grade} ${classroom.stream}`;
    if (classroom.grade) return classroom.grade;
    if (classroom.name) return classroom.name;
    if (classroom.class_name) return classroom.class_name;
    if (classroom.classroom_name) return classroom.classroom_name;
    return `Classroom ${classroom.id ?? ""}`;
  }, []);

  // =====================================================
  // HELPER: GET CLASSROOM BY ID
  // =====================================================
  const getClassroomById = useCallback((classroomId) => {
    if (classroomId === null || classroomId === undefined || classroomId === "") return null;
    return classrooms.find((c) => Number(c.id) === Number(classroomId));
  }, [classrooms]);

  // =====================================================
  // HELPER: GET SUBJECT NAME
  // =====================================================
  const getSubjectName = useCallback((outcome) => {
    if (outcome.subject_name) return outcome.subject_name;
    const subject = subjects.find((s) => Number(s.id) === Number(outcome.subject));
    return subject?.name || `Subject ${outcome.subject ?? ""}`;
  }, [subjects]);

  // =====================================================
  // SEARCH FILTER
  // =====================================================
  useEffect(() => {
    const searchText = search.toLowerCase().trim();
    if (!searchText) {
      setFiltered(outcomes);
      return;
    }
    const filteredData = outcomes.filter((outcome) => {
      const classroom = getClassroomById(outcome.classroom);
      const classroomName = getClassroomName(classroom);
      const subjectName = getSubjectName(outcome);
      const outcomeName = outcome.name || "";
      const description = outcome.description || "";
      return (
        classroomName.toLowerCase().includes(searchText) ||
        subjectName.toLowerCase().includes(searchText) ||
        outcomeName.toLowerCase().includes(searchText) ||
        description.toLowerCase().includes(searchText)
      );
    });
    setFiltered(filteredData);
  }, [search, outcomes, subjects, classrooms, getClassroomById, getClassroomName, getSubjectName]);

  // =====================================================
  // MODAL HANDLERS
  // =====================================================
  const openAddModal = () => {
    setEditing(false);
    setFormData({ id: "", classroom: "", subject: "", name: "", description: "", maximum_marks: "" });
    setShowModal(true);
  };

  const openEditModal = (outcome) => {
    setEditing(true);
    setFormData({
      id: outcome.id ?? "",
      classroom: outcome.classroom ?? "",
      subject: outcome.subject ?? "",
      name: outcome.name ?? "",
      description: outcome.description ?? "",
      maximum_marks: outcome.maximum_marks ?? "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditing(false);
    setFormData({ id: "", classroom: "", subject: "", name: "", description: "", maximum_marks: "" });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // =====================================================
  // SUBMIT HANDLER
  // =====================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.classroom) return alert("Please select a classroom.");
    if (!formData.subject) return alert("Please select a subject.");
    if (!formData.name || !formData.name.trim()) return alert("Please enter the learning outcome name.");
    if (!formData.description || !formData.description.trim()) return alert("Please enter the description.");
    if (!formData.maximum_marks || Number(formData.maximum_marks) <= 0) return alert("Please enter valid maximum marks.");

    setSaving(true);
    try {
      const payload = {
        classroom: Number(formData.classroom),
        subject: Number(formData.subject),
        name: formData.name.trim(),
        description: formData.description.trim(),
        maximum_marks: Number(formData.maximum_marks),
      };
      console.log("Learning Outcome Payload:", payload);

      editing
        ? await api.put(`results/learning-outcomes/${formData.id}/`, payload)
        : await api.post("results/learning-outcomes/", payload);

      await fetchOutcomes();
      setShowModal(false);
      setEditing(false);
      setFormData({ id: "", classroom: "", subject: "", name: "", description: "", maximum_marks: "" });
    } catch (err) {
      console.error("Save failed:", err);
      alert(err.response?.data ? JSON.stringify(err.response.data, null, 2) : "Could not save learning outcome!");
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE HANDLER
  // =====================================================
  const deleteOutcome = async (id) => {
    if (!id) return alert("This learning outcome does not have a valid ID.");
    if (!window.confirm("Delete this learning outcome?")) return;
    try {
      await api.delete(`results/learning-outcomes/${id}/`);
      await fetchOutcomes();
    } catch (err) {
      console.error("Delete failed:", err);
      alert(err.response?.data ? JSON.stringify(err.response.data, null, 2) : "Could not delete learning outcome!");
    }
  };

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* HEADER — Responsive */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Learning Outcomes</h1>
          <p className="text-gray-500 text-sm sm:text-base">Manage CBC learning outcomes by classroom and subject</p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="milk-btn w-full sm:w-auto justify-center flex items-center gap-2"
        >
          <i className="bi bi-plus-circle"></i> Add Outcome
        </button>
      </div>

      {/* SEARCH */}
      <div className="card">
        <div className="relative w-full max-w-md">
          <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            type="text"
            placeholder="Search classroom, subject, outcome or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="milk-input pl-10 w-full"
          />
        </div>
      </div>

      {/* TABLE / CARDS VIEW */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="text-center py-10 sm:py-16 text-gray-500">
            <i className="bi bi-arrow-repeat animate-spin text-2xl mb-2"></i>
            <p>Loading learning outcomes...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 sm:py-10 text-gray-500">
            {search ? "No matching outcomes found." : "No learning outcomes defined yet."}
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE (md+) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead>
                  <tr className="border-b-2 border-green-200">
                    <th className="px-3 sm:px-4 py-3 text-green-700 font-semibold">Classroom</th>
                    <th className="px-3 sm:px-4 py-3 text-green-700 font-semibold">Subject</th>
                    <th className="px-3 sm:px-4 py-3 text-green-700 font-semibold">Outcome</th>
                    <th className="px-3 sm:px-4 py-3 text-green-700 font-semibold">Description</th>
                    <th className="px-3 sm:px-4 py-3 text-green-700 font-semibold text-center">Max</th>
                    <th className="px-3 sm:px-4 py-3 text-green-700 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((outcome, index) => {
                    const classroom = getClassroomById(outcome.classroom);
                    return (
                      <tr
                        key={outcome.id ?? `lo-${index}`}
                        className="border-b border-gray-100 hover:bg-green-50 transition-colors"
                      >
                        <td className="px-3 sm:px-4 py-3 font-medium whitespace-nowrap">
                          {getClassroomName(classroom)}
                        </td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap">{getSubjectName(outcome)}</td>
                        <td className="px-3 sm:px-4 py-3 font-medium">{outcome.name}</td>
                        <td className="px-3 sm:px-4 py-3 text-sm max-w-xs truncate">
                          {outcome.description || "—"}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-center font-medium">
                          {outcome.maximum_marks}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-center">
                          <div className="flex justify-center gap-3">
                            <button
                              onClick={() => openEditModal(outcome)}
                              className="text-green-600 hover:text-green-800 text-lg"
                              title="Edit"
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                            <button
                              onClick={() => deleteOutcome(outcome.id)}
                              className="text-red-600 hover:text-red-800 text-lg"
                              title="Delete"
                            >
                              <i className="bi bi-trash-fill"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS (< md) */}
            <div className="md:hidden space-y-3">
              {filtered.map((outcome, index) => {
                const classroom = getClassroomById(outcome.classroom);
                return (
                  <div
                    key={outcome.id ?? `lo-card-${index}`}
                    className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-green-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-bold text-lg text-green-700">
                          {getClassroomName(classroom)}
                        </span>
                        <span className="mx-2 text-gray-400">•</span>
                        <span className="text-sm font-medium text-gray-700">
                          {getSubjectName(outcome)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(outcome)}
                          className="text-green-600 text-lg"
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>
                        <button
                          onClick={() => deleteOutcome(outcome.id)}
                          className="text-red-600 text-lg"
                        >
                          <i className="bi bi-trash-fill"></i>
                        </button>
                      </div>
                    </div>
                    <h4 className="font-semibold text-gray-800 mb-1">{outcome.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {outcome.description || "No description"}
                    </p>
                    <div className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-sm rounded font-medium">
                      Max Marks: {outcome.maximum_marks}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ADD/EDIT MODAL — Fully Responsive */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* MODAL HEADER */}
            <div className="flex justify-between items-center border-b border-green-200 px-4 sm:px-6 py-3 sm:py-4">
              <h3 className="text-lg sm:text-xl font-semibold">
                {editing ? "Edit Learning Outcome" : "Add New Outcome"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-red-500 hover:text-red-700"
                disabled={saving}
              >
                <i className="bi bi-x-circle-fill text-xl sm:text-2xl"></i>
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              {/* CLASSROOM */}
              <div>
                <label className="form-label">
                  Classroom <span className="text-red-500">*</span>
                </label>
                <select
                  name="classroom"
                  value={formData.classroom}
                  onChange={handleChange}
                  required
                  className="milk-input"
                >
                  <option value="">-- Select Classroom --</option>
                  {classrooms.map((c, i) => (
                    <option key={c.id ?? `c-${i}`} value={c.id}>
                      {getClassroomName(c)}
                    </option>
                  ))}
                </select>
                {classrooms.length === 0 && (
                  <p className="text-sm text-red-500 mt-1">
                    No classrooms found. Check API.
                  </p>
                )}
              </div>

              {/* SUBJECT */}
              <div>
                <label className="form-label">
                  Subject <span className="text-red-500">*</span>
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="milk-input"
                >
                  <option value="">-- Select Subject --</option>
                  {subjects.map((s, i) => (
                    <option key={s.id ?? `s-${i}`} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {subjects.length === 0 && (
                  <p className="text-sm text-red-500 mt-1">
                    No subjects found. Check API.
                  </p>
                )}
              </div>

              {/* NAME */}
              <div>
                <label className="form-label">
                  Learning Outcome Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="milk-input"
                  placeholder="e.g. Fractions"
                />
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="form-label">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  required
                  className="milk-input"
                  placeholder="e.g. Understanding simple fractions"
                />
              </div>

              {/* MAX MARKS */}
              <div>
                <label className="form-label">
                  Maximum Marks <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="maximum_marks"
                  value={formData.maximum_marks}
                  onChange={handleChange}
                  required
                  min="1"
                  step="0.01"
                  className="milk-input"
                  placeholder="e.g. 20"
                />
              </div>

              {/* BUTTONS */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 order-2 sm:order-1"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="milk-btn px-5 order-1 sm:order-2"
                  disabled={saving || classrooms.length === 0 || subjects.length === 0}
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <i className="bi bi-arrow-repeat animate-spin"></i> Saving...
                    </span>
                  ) : editing ? (
                    "Update"
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningOutcomes;