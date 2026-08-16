import { useEffect, useState } from "react";
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

  const fetchOutcomes = async () => {
    try {
      setLoading(true);

      const res = await api.get(
        "results/learning-outcomes/"
      );

      const data =
        res.data?.results ??
        res.data ??
        [];

      const outcomeData = Array.isArray(data)
        ? data
        : [];

      console.log(
        "Learning outcomes loaded:",
        outcomeData
      );

      setOutcomes(outcomeData);
      setFiltered(outcomeData);
    } catch (error) {
      console.error(
        "Failed to load learning outcomes:",
        error
      );

      console.error(
        "Backend response:",
        error.response?.data
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FETCH SUBJECTS
  // =====================================================

  const fetchSubjects = async () => {
    try {
      const res = await api.get(
        "subjects/"
      );

      const data =
        res.data?.results ??
        res.data ??
        [];

      const subjectData = Array.isArray(data)
        ? data
        : [];

      console.log(
        "Subjects loaded:",
        subjectData
      );

      setSubjects(subjectData);
    } catch (error) {
      console.error(
        "Failed to load subjects:",
        error
      );

      console.error(
        "Backend response:",
        error.response?.data
      );

      setSubjects([]);
    }
  };

  // =====================================================
  // FETCH CLASSROOMS FROM BACKEND
  // =====================================================

  const fetchClassrooms = async () => {
    try {
      console.log(
        "Fetching classrooms from classes/ ..."
      );

      const res = await api.get(
        "classes/"
      );

      console.log(
        "Classrooms API response:",
        res.data
      );

      const data =
        res.data?.results ??
        res.data ??
        [];

      const classroomData = Array.isArray(data)
        ? data
        : [];

      console.log(
        "Classrooms loaded from backend:",
        classroomData
      );

      setClassrooms(
        classroomData
      );
    } catch (error) {
      console.error(
        "Failed to load classrooms:",
        error
      );

      console.error(
        "Status:",
        error.response?.status
      );

      console.error(
        "Backend response:",
        error.response?.data
      );

      setClassrooms([]);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchOutcomes();
    fetchSubjects();
    fetchClassrooms();
  }, []);

  // =====================================================
  // GET CLASSROOM NAME
  // =====================================================
  //
  // Your backend returns:
  //
  // {
  //   id: 1,
  //   grade: "Grade 1",
  //   stream: "A"
  // }
  //
  // Therefore we display:
  //
  // Grade 1 A
  //
  // =====================================================

  const getClassroomName = (classroom) => {
    if (!classroom) {
      return "Unknown Classroom";
    }

    // Backend's actual fields
    if (
      classroom.grade &&
      classroom.stream
    ) {
      return `${classroom.grade} ${classroom.stream}`;
    }

    if (classroom.grade) {
      return classroom.grade;
    }

    // Extra fallback in case backend changes later
    if (classroom.name) {
      return classroom.name;
    }

    if (classroom.class_name) {
      return classroom.class_name;
    }

    if (classroom.classroom_name) {
      return classroom.classroom_name;
    }

    return `Classroom ${classroom.id ?? ""}`;
  };

  // =====================================================
  // GET CLASSROOM BY ID
  // =====================================================

  const getClassroomById = (classroomId) => {
    if (
      classroomId === null ||
      classroomId === undefined ||
      classroomId === ""
    ) {
      return null;
    }

    return classrooms.find(
      (classroom) =>
        Number(classroom.id) ===
        Number(classroomId)
    );
  };

  // =====================================================
  // GET SUBJECT NAME
  // =====================================================

  const getSubjectName = (outcome) => {
    // If serializer already provides subject_name
    if (outcome.subject_name) {
      return outcome.subject_name;
    }

    const subject =
      subjects.find(
        (item) =>
          Number(item.id) ===
          Number(outcome.subject)
      );

    return (
      subject?.name ||
      `Subject ${outcome.subject ?? ""}`
    );
  };

  // =====================================================
  // SEARCH
  // =====================================================

  useEffect(() => {
    const searchText =
      search
        .toLowerCase()
        .trim();

    if (!searchText) {
      setFiltered(outcomes);
      return;
    }

    const filteredData =
      outcomes.filter(
        (outcome) => {
          const classroom =
            getClassroomById(
              outcome.classroom
            );

          const classroomName =
            getClassroomName(
              classroom
            );

          const subjectName =
            getSubjectName(
              outcome
            );

          const outcomeName =
            outcome.name || "";

          const description =
            outcome.description || "";

          return (
            classroomName
              .toLowerCase()
              .includes(searchText) ||

            subjectName
              .toLowerCase()
              .includes(searchText) ||

            outcomeName
              .toLowerCase()
              .includes(searchText) ||

            description
              .toLowerCase()
              .includes(searchText)
          );
        }
      );

    setFiltered(
      filteredData
    );
  }, [
    search,
    outcomes,
    subjects,
    classrooms,
  ]);

  // =====================================================
  // OPEN ADD MODAL
  // =====================================================

  const openAddModal = () => {
    setEditing(false);

    setFormData({
      id: "",
      classroom: "",
      subject: "",
      name: "",
      description: "",
      maximum_marks: "",
    });

    setShowModal(true);
  };

  // =====================================================
  // OPEN EDIT MODAL
  // =====================================================

  const openEditModal = (outcome) => {
    setEditing(true);

    setFormData({
      id: outcome.id ?? "",

      classroom:
        outcome.classroom ?? "",

      subject:
        outcome.subject ?? "",

      name:
        outcome.name ?? "",

      description:
        outcome.description ?? "",

      maximum_marks:
        outcome.maximum_marks ?? "",
    });

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
    setEditing(false);

    setFormData({
      id: "",
      classroom: "",
      subject: "",
      name: "",
      description: "",
      maximum_marks: "",
    });
  };

  // =====================================================
  // HANDLE CHANGE
  // =====================================================

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setFormData(
      (prev) => ({
        ...prev,
        [name]: value,
      })
    );
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // -------------------------------------------------
    // VALIDATE CLASSROOM
    // -------------------------------------------------

    if (!formData.classroom) {
      alert(
        "Please select a classroom."
      );
      return;
    }

    // -------------------------------------------------
    // VALIDATE SUBJECT
    // -------------------------------------------------

    if (!formData.subject) {
      alert(
        "Please select a subject."
      );
      return;
    }

    // -------------------------------------------------
    // VALIDATE NAME
    // -------------------------------------------------

    if (
      !formData.name ||
      !formData.name.trim()
    ) {
      alert(
        "Please enter the learning outcome name."
      );
      return;
    }

    // -------------------------------------------------
    // VALIDATE DESCRIPTION
    // -------------------------------------------------

    if (
      !formData.description ||
      !formData.description.trim()
    ) {
      alert(
        "Please enter the description."
      );
      return;
    }

    // -------------------------------------------------
    // VALIDATE MAXIMUM MARKS
    // -------------------------------------------------

    if (
      !formData.maximum_marks ||
      Number(formData.maximum_marks) <= 0
    ) {
      alert(
        "Please enter valid maximum marks."
      );
      return;
    }

    setSaving(true);

    try {
      // -------------------------------------------------
      // PAYLOAD
      // -------------------------------------------------

      const payload = {
        classroom:
          Number(formData.classroom),

        subject:
          Number(formData.subject),

        name:
          formData.name.trim(),

        description:
          formData.description.trim(),

        maximum_marks:
          Number(
            formData.maximum_marks
          ),
      };

      console.log(
        "Learning Outcome Payload:",
        payload
      );

      // -------------------------------------------------
      // UPDATE
      // -------------------------------------------------

      if (editing) {
        await api.put(
          `results/learning-outcomes/${formData.id}/`,
          payload
        );
      }

      // -------------------------------------------------
      // CREATE
      // -------------------------------------------------

      else {
        await api.post(
          "results/learning-outcomes/",
          payload
        );
      }

      // -------------------------------------------------
      // REFRESH
      // -------------------------------------------------

      await fetchOutcomes();

      // -------------------------------------------------
      // CLOSE
      // -------------------------------------------------

      setShowModal(false);
      setEditing(false);

      // -------------------------------------------------
      // RESET
      // -------------------------------------------------

      setFormData({
        id: "",
        classroom: "",
        subject: "",
        name: "",
        description: "",
        maximum_marks: "",
      });

    } catch (err) {
      console.error(
        "Save learning outcome failed:",
        err
      );

      console.error(
        "Status:",
        err.response?.status
      );

      console.error(
        "Backend response:",
        err.response?.data
      );

      alert(
        err.response?.data
          ? JSON.stringify(
              err.response.data,
              null,
              2
            )
          : "Could not save learning outcome!"
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const deleteOutcome = async (id) => {
    if (!id) {
      alert(
        "This learning outcome does not have a valid ID."
      );
      return;
    }

    if (
      !window.confirm(
        "Delete this learning outcome?"
      )
    ) {
      return;
    }

    try {
      await api.delete(
        `results/learning-outcomes/${id}/`
      );

      await fetchOutcomes();

    } catch (err) {
      console.error(
        "Delete failed:",
        err
      );

      console.error(
        "Status:",
        err.response?.status
      );

      console.error(
        "Backend response:",
        err.response?.data
      );

      alert(
        err.response?.data
          ? JSON.stringify(
              err.response.data,
              null,
              2
            )
          : "Could not delete learning outcome!"
      );
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
          <h1 className="text-3xl font-bold text-gray-800">
            Learning Outcomes
          </h1>

          <p className="text-gray-500 mt-1">
            Manage CBC learning outcomes by classroom and subject
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="milk-btn mt-4 md:mt-0"
        >
          <i className="bi bi-plus-circle mr-2"></i>

          Add Outcome
        </button>

      </div>

      {/* =================================================
          SEARCH
      ================================================= */}

      <div className="card mb-6">

        <div className="relative max-w-md">

          <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>

          <input
            type="text"
            placeholder="Search classroom, subject, outcome or description..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            className="milk-input pl-10"
          />

        </div>

      </div>

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="card overflow-x-auto">

        {loading ? (

          <div className="text-center py-16 text-gray-500">

            <i className="bi bi-arrow-repeat animate-spin text-2xl mb-2"></i>

            <p>
              Loading learning outcomes...
            </p>

          </div>

        ) : filtered.length === 0 ? (

          <div className="text-center py-10 text-gray-500">

            {search
              ? "No matching outcomes found."
              : "No learning outcomes defined yet."}

          </div>

        ) : (

          <table className="w-full text-left">

            <thead>

              <tr className="border-b-2 border-green-200">

                {/* CLASSROOM */}

                <th className="px-4 py-3 text-green-700 font-semibold">
                  Classroom
                </th>

                {/* SUBJECT */}

                <th className="px-4 py-3 text-green-700 font-semibold">
                  Subject
                </th>

                {/* LEARNING OUTCOME */}

                <th className="px-4 py-3 text-green-700 font-semibold">
                  Learning Outcome
                </th>

                {/* DESCRIPTION */}

                <th className="px-4 py-3 text-green-700 font-semibold">
                  Description
                </th>

                {/* MAX MARKS */}

                <th className="px-4 py-3 text-green-700 font-semibold text-center">
                  Max Marks
                </th>

                {/* ACTIONS */}

                <th className="px-4 py-3 text-green-700 font-semibold text-center">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {filtered.map(
                (
                  outcome,
                  index
                ) => {

                  const classroom =
                    getClassroomById(
                      outcome.classroom
                    );

                  return (
                    <tr
                      key={
                        outcome.id ??
                        `learning-outcome-${index}`
                      }
                      className="border-b border-gray-100 hover:bg-green-50"
                    >

                      {/* CLASSROOM */}

                      <td className="px-4 py-3 font-medium">

                        {getClassroomName(
                          classroom
                        )}

                      </td>

                      {/* SUBJECT */}

                      <td className="px-4 py-3">

                        {getSubjectName(
                          outcome
                        )}

                      </td>

                      {/* LEARNING OUTCOME */}

                      <td className="px-4 py-3 font-medium">

                        {outcome.name}

                      </td>

                      {/* DESCRIPTION */}

                      <td className="px-4 py-3">

                        {outcome.description ||
                          "—"}

                      </td>

                      {/* MAXIMUM MARKS */}

                      <td className="px-4 py-3 text-center">

                        {outcome.maximum_marks}

                      </td>

                      {/* ACTIONS */}

                      <td className="px-4 py-3 text-center">

                        <div className="flex justify-center gap-4">

                          {/* EDIT */}

                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                outcome
                              )
                            }
                            className="text-green-600 hover:text-green-800 text-lg"
                            title="Edit learning outcome"
                          >
                            <i className="bi bi-pencil-square"></i>
                          </button>

                          {/* DELETE */}

                          <button
                            type="button"
                            onClick={() =>
                              deleteOutcome(
                                outcome.id
                              )
                            }
                            className="text-red-600 hover:text-red-800 text-lg"
                            title="Delete learning outcome"
                          >
                            <i className="bi bi-trash-fill"></i>
                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                }
              )}

            </tbody>

          </table>

        )}

      </div>

      {/* =================================================
          ADD / EDIT MODAL
      ================================================= */}

      {showModal && (

        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">

          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div className="flex justify-between items-center border-b border-green-200 px-6 py-4">

              <h3 className="text-xl font-semibold">

                {editing
                  ? "Edit Learning Outcome"
                  : "Add New Outcome"}

              </h3>

              <button
                type="button"
                onClick={closeModal}
                className="text-red-500 hover:text-red-700"
                disabled={saving}
              >
                <i className="bi bi-x-circle-fill text-2xl"></i>
              </button>

            </div>

            {/* =================================================
                FORM
            ================================================= */}

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-4"
            >

              {/* =================================================
                  CLASSROOM
              ================================================= */}

              <div>

                <label className="form-lable">
                  Classroom{" "}

                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <select
                  name="classroom"
                  value={
                    formData.classroom
                  }
                  onChange={
                    handleChange
                  }
                  required
                  className="milk-input"
                >

                  <option value="">
                    -- Select Classroom --
                  </option>

                  {classrooms.map(
                    (
                      classroom,
                      index
                    ) => (

                      <option
                        key={
                          classroom.id ??
                          `classroom-${index}`
                        }
                        value={
                          classroom.id
                        }
                      >
                        {getClassroomName(
                          classroom
                        )}
                      </option>

                    )
                  )}

                </select>

                {classrooms.length === 0 && (
                  <p className="text-sm text-red-500 mt-1">
                    No classrooms were found. Please check the classes API.
                  </p>
                )}

              </div>

              {/* =================================================
                  SUBJECT
              ================================================= */}

              <div>

                <label className="form-lable">
                  Subject{" "}

                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <select
                  name="subject"
                  value={
                    formData.subject
                  }
                  onChange={
                    handleChange
                  }
                  required
                  className="milk-input"
                >

                  <option value="">
                    -- Select Subject --
                  </option>

                  {subjects.map(
                    (
                      subject,
                      index
                    ) => (

                      <option
                        key={
                          subject.id ??
                          `subject-${index}`
                        }
                        value={
                          subject.id
                        }
                      >
                        {subject.name}
                      </option>

                    )
                  )}

                </select>

                {subjects.length === 0 && (
                  <p className="text-sm text-red-500 mt-1">
                    No subjects were found. Please check the subjects API.
                  </p>
                )}

              </div>

              {/* =================================================
                  LEARNING OUTCOME NAME
              ================================================= */}

              <div>

                <label className="form-lable">
                  Learning Outcome Name{" "}

                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  name="name"
                  value={
                    formData.name
                  }
                  onChange={
                    handleChange
                  }
                  required
                  className="milk-input"
                  placeholder="e.g. Fractions"
                />

              </div>

              {/* =================================================
                  DESCRIPTION
              ================================================= */}

              <div>

                <label className="form-lable">
                  Description{" "}

                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <textarea
                  name="description"
                  rows={4}
                  value={
                    formData.description
                  }
                  onChange={
                    handleChange
                  }
                  required
                  className="milk-input"
                  placeholder="e.g. Understanding simple fractions"
                />

              </div>

              {/* =================================================
                  MAXIMUM MARKS
              ================================================= */}

              <div>

                <label className="form-lable">
                  Maximum Marks{" "}

                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="number"
                  name="maximum_marks"
                  value={
                    formData.maximum_marks
                  }
                  onChange={
                    handleChange
                  }
                  required
                  min="1"
                  step="0.01"
                  className="milk-input"
                  placeholder="e.g. 20"
                />

              </div>

              {/* =================================================
                  BUTTONS
              ================================================= */}

              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="milk-btn px-5"
                  disabled={
                    saving ||
                    classrooms.length === 0 ||
                    subjects.length === 0
                  }
                >

                  {saving ? (

                    <span className="flex items-center gap-2">

                      <i className="bi bi-arrow-repeat animate-spin"></i>

                      Saving...

                    </span>

                  ) : (

                    editing
                      ? "Update"
                      : "Save"

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