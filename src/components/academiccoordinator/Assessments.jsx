import React, { useEffect, useState } from "react";
import { FaClipboardList, FaPlus, FaSearch, FaTrash, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import api from "../api/api";

const Assessments = () => {
  const [assessments, setAssessments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "", subject: "", classroom: "", assessment_type: "",
    academic_year: "", term: "", total_marks: "", assessment_date: "",
  });

  useEffect(() => {
    fetchAssessments();
    fetchSubjects();
    fetchClassrooms();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const res = await api.get("results/assessments/");
      setAssessments(Array.isArray(res.data) ? res.data : res.data?.results || []);
    } catch (err) {
      console.error("Failed to load assessments:", err.response?.data || err);
      toast.error("Failed to load assessments.");
    } finally { setLoading(false); }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get("subjects/");
      setSubjects(Array.isArray(res.data) ? res.data : res.data?.results || []);
    } catch (err) {
      console.error("Failed to load subjects:", err.response?.data || err);
      toast.error("Failed to load subjects.");
    }
  };

  const fetchClassrooms = async () => {
    try {
      const res = await api.get("classes/");
      setClassrooms(Array.isArray(res.data) ? res.data : res.data?.results || []);
    } catch (err) {
      console.error("Failed to load classes:", err.response?.data || err);
      toast.error("Failed to load classes.");
    }
  };

  const getSubjectName = (subject) => {
    if (!subject) return "-";
    if (typeof subject === "object")
      return subject.name || subject.subject_name || subject.title || "-";
    const found = subjects.find(s => String(s.id) === String(subject));
    return found ? (found.name || found.subject_name || found.title) : String(subject);
  };

  const getClassroomName = (room) => {
    if (!room) return "-";
    if (typeof room === "object") {
      if (room.classroom_name) return room.classroom_name;
      if (room.name && (room.name.includes("-") || /grade|pp/i.test(room.name))) return room.name;
      const grade = room.grade_name || room.grade || room.class_name || room.name || "";
      const stream = room.stream || room.stream_name || "";
      return grade && stream ? `${grade} - ${stream}` : grade || stream || "-";
    }
    const found = classrooms.find(c => String(c.id) === String(room));
    if (!found) return String(room);
    if (found.classroom_name) return found.classroom_name;
    const g = found.grade_name || found.grade || found.class_name || found.name || "";
    const s = found.stream || found.stream_name || "";
    return g && s ? `${g} - ${s}` : g || s || String(room);
  };

  const handleChange = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const clearForm = () => {
    setEditingId(null);
    setFormData({ name: "", subject: "", classroom: "", assessment_type: "",
      academic_year: "", term: "", total_marks: "", assessment_date: "" });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = { ...formData,
        subject: Number(formData.subject),
        classroom: Number(formData.classroom),
        academic_year: Number(formData.academic_year),
        total_marks: Number(formData.total_marks),
      };
      editingId
        ? await api.put(`results/assessments/${editingId}/`, payload)
        : await api.post("results/assessments/", payload);
      toast.success(editingId ? "Updated!" : "Created!");
      await fetchAssessments();
      clearForm();
    } catch (err) {
      console.error("Save error:", err.response?.data || err);
      const be = err.response?.data;
      be && typeof be === "object"
        ? Object.entries(be).forEach(([f, m]) =>
            (Array.isArray(m) ? m : [m]).forEach(x => toast.error(`${f}: ${x}`))
          )
        : toast.error("Failed to save.");
    } finally { setLoading(false); }
  };

  const handleEdit = a => {
    setEditingId(a.id);
    setFormData({
      name: a.name || "",
      subject: a.subject?.id || a.subject || "",
      classroom: a.classroom?.id || a.classroom || "",
      assessment_type: a.assessment_type || "",
      academic_year: a.academic_year || "",
      term: a.term || "",
      total_marks: a.total_marks || "",
      assessment_date: a.assessment_date || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async id => {
    if (!window.confirm("Delete this assessment?")) return;
    try {
      await api.delete(`results/assessments/${id}/`);
      toast.success("Deleted!");
      await fetchAssessments();
    } catch (err) {
      console.error("Delete error:", err.response?.data || err);
      toast.error("Failed to delete.");
    }
  };

  const filteredAssessments = assessments.filter(a => {
    const q = search.toLowerCase().trim();
    return !q ||
      a.name?.toLowerCase().includes(q) ||
      a.assessment_type?.toLowerCase().includes(q) ||
      a.term?.toLowerCase().includes(q) ||
      getSubjectName(a.subject)?.toLowerCase().includes(q) ||
      getClassroomName(a.classroom)?.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-gray-100 p-3 sm:p-4 md:p-6 overflow-x-hidden">
      {/* HEADER */}
      <div className="mb-5 sm:mb-6 flex items-center gap-3">
        <div className="bg-green-600 text-white p-2.5 sm:p-3 rounded-xl shrink-0">
          <FaClipboardList className="text-lg sm:text-xl" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Assessments</h1>
          <p className="text-gray-500 text-xs sm:text-sm md:text-base">
            Create and manage student assessments
          </p>
        </div>
      </div>

      {/* FORM */}
      <div className="card mb-5 sm:mb-6">
        <div className="flex items-center justify-between mb-5 gap-3">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800">
            {editingId ? "Edit Assessment" : "Create Assessment"}
          </h2>
          {editingId && (
            <button type="button" onClick={clearForm}
              className="flex items-center gap-1.5 sm:gap-2 text-gray-500 hover:text-red-600 text-xs sm:text-sm shrink-0">
              <FaTimes /> Cancel
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Name */}
          <div>
            <label className="form-label">Assessment Name</label>
            <input type="text" name="name" placeholder="e.g. Mathematics CAT 1" required
              value={formData.name} onChange={handleChange} className="milk-input" />
          </div>
          {/* Subject */}
          <div>
            <label className="form-label">Subject</label>
            <select name="subject" value={formData.subject} onChange={handleChange} required className="milk-input">
              <option value="">Select Subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{getSubjectName(s)}</option>)}
            </select>
            {subjects.length === 0 && <p className="text-xs sm:text-sm text-red-500 mt-1">No subjects found.</p>}
          </div>
          {/* Class */}
          <div>
            <label className="form-label">Class</label>
            <select name="classroom" value={formData.classroom} onChange={handleChange} required className="milk-input">
              <option value="">Select Class</option>
              {classrooms.map(c => <option key={c.id} value={c.id}>{getClassroomName(c)}</option>)}
            </select>
            {classrooms.length === 0 && <p className="text-xs sm:text-sm text-red-500 mt-1">No classes found.</p>}
          </div>
          {/* Type */}
          <div>
            <label className="form-label">Assessment Type</label>
            <input type="text" name="assessment_type" placeholder="e.g. CAT 1" required
              value={formData.assessment_type} onChange={handleChange} className="milk-input" />
          </div>
          {/* Year */}
          <div>
            <label className="form-label">Academic Year</label>
            <input type="number" name="academic_year" placeholder="e.g. 2026" required
              value={formData.academic_year} onChange={handleChange} className="milk-input" />
          </div>
          {/* Term */}
          <div>
            <label className="form-label">Term</label>
            <select name="term" value={formData.term} onChange={handleChange} required className="milk-input">
              <option value="">Select Term</option>
              <option>Term 1</option>
              <option>Term 2</option>
              <option>Term 3</option>
            </select>
          </div>
          {/* Marks */}
          <div>
            <label className="form-label">Total Marks</label>
            <input type="number" name="total_marks" min="1" max="999" step="1" placeholder="e.g. 100" required
              value={formData.total_marks} onChange={handleChange} className="milk-input" />
          </div>
          {/* Date */}
          <div>
            <label className="form-label">Assessment Date</label>
            <input type="date" name="assessment_date" required
              value={formData.assessment_date} onChange={handleChange} className="milk-input" />
          </div>
          {/* Submit */}
          <div className="md:col-span-2 lg:col-span-4">
            <button type="submit" disabled={loading}
              className="milk-btn w-full flex items-center justify-center gap-2">
              <FaPlus />
              {loading ? "Saving..." : editingId ? "Update Assessment" : "Create Assessment"}
            </button>
          </div>
        </form>
      </div>

      {/* SEARCH */}
      <div className="card mb-5 sm:mb-6">
        <div className="relative w-full max-w-md">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search assessments..." value={search}
            onChange={e => setSearch(e.target.value)} className="milk-input pl-10 w-full" />
        </div>
      </div>

      {/* TABLE */}
      <div className="card w-full max-w-full min-w-0 overflow-hidden p-0">
        {loading ? (
          <p className="py-10 sm:py-12 text-center text-gray-500 text-sm">Loading assessments...</p>
        ) : filteredAssessments.length === 0 ? (
          <p className="py-10 sm:py-12 text-center text-gray-500 text-sm">No assessments found.</p>
        ) : (
          <table className="w-full max-w-full table-fixed border-collapse">
            <colgroup>
              <col className="w-[17%]" />
              <col className="w-[17%]" />
              <col className="w-[15%]" />
              <col className="w-[11%]" />
              <col className="w-[13%]" />
              <col className="w-[10%]" />
              <col className="w-[17%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead>
              <tr className="bg-green-600 text-white">
                {["Subject", "Class", "Type", "Year", "Term", "Marks", "Date", "Action"].map((h, i) => (
                  <th key={i} className={`px-1 sm:px-${i<4?2:3} py-2 sm:py-3 text-${i>=3?'center':'left'} text-[8px] sm:text-sm font-semibold ${i<7?'break-words leading-tight':''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAssessments.map(a => (
                <tr key={a.id} className="border-b border-gray-100 hover:bg-green-50 transition">
                  <td className="px-1 sm:px-3 py-2 sm:py-4 align-middle min-w-0">
                    <div className="text-gray-800 font-medium text-[8px] sm:text-sm break-words">
                      {getSubjectName(a.subject)}
                    </div>
                  </td>
                  <td className="px-1 sm:px-3 py-2 sm:py-4 align-middle min-w-0">
                    <div className="text-gray-600 text-[8px] sm:text-sm break-words">
                      {getClassroomName(a.classroom)}
                    </div>
                  </td>
                  <td className="px-1 sm:px-3 py-2 sm:py-4 align-middle min-w-0">
                    <div className="text-gray-600 text-[8px] sm:text-sm break-words">{a.assessment_type}</div>
                  </td>
                  <td className="px-1 sm:px-2 py-2 sm:py-4 text-center">
                    <span className="text-gray-600 text-[8px] sm:text-sm">{a.academic_year}</span>
                  </td>
                  <td className="px-1 sm:px-2 py-2 sm:py-4 text-center">
                    <span className="text-gray-600 text-[8px] sm:text-sm break-words">{a.term}</span>
                  </td>
                  <td className="px-1 sm:px-2 py-2 sm:py-4 text-center">
                    <span className="font-semibold text-gray-700 text-[8px] sm:text-sm">{a.total_marks}</span>
                  </td>
                  <td className="px-1 sm:px-3 py-2 sm:py-4 align-middle min-w-0">
                    <div className="text-gray-600 text-[7px] sm:text-sm break-words">{a.assessment_date}</div>
                  </td>
                  <td className="px-0 sm:px-2 py-2 sm:py-4 text-center">
                    <button onClick={() => handleDelete(a.id)} title="Delete Assessment"
                      className="inline-flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-md sm:rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition text-[10px] sm:text-base">
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Assessments;