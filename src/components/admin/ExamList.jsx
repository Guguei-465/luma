import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/api";
import AdminSubNav from "./AdminSubNav";

const examTabs = [
  { to: "/admin-dashboard/exams", end: true, icon: "bi bi-pencil-square", label: "Exam Schedule" },
  { to: "/admin-dashboard/exams/add", icon: "bi bi-file-earmark-plus", label: "Create Exam" },
];

const getArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

// =====================================================
// NOTE
//
// This is the exam SCHEDULE (which class sits which
// paper, on what date, out of how many marks). Actual
// marks entry happens through the Results workflow, owned
// by each subject teacher for their assigned class — see
// the Teacher's "Marks Entry" page — so there is no "Enter
// Marks" action here.
// =====================================================
const ExamList = () => {
  const [exams, setExams] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterClassroom, setFilterClassroom] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterTerm, setFilterTerm] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const navigate = useNavigate();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [examsRes, classesRes, subjectsRes] = await Promise.all([
        api.get("exams/"),
        api.get("classes/"),
        api.get("subjects/"),
      ]);
      setExams(getArray(examsRes.data));
      setClassrooms(getArray(classesRes.data));
      setSubjects(getArray(subjectsRes.data));
    } catch {
      toast.error("Failed to load exams");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = useMemo(() => {
    return exams.filter((e) => {
      if (filterClassroom !== "all" && String(e.classroom) !== String(filterClassroom)) return false;
      if (filterSubject !== "all" && String(e.subject) !== String(filterSubject)) return false;
      if (filterTerm !== "all" && e.term !== filterTerm) return false;
      if (filterType !== "all" && e.exam_type !== filterType) return false;
      if (search) {
        const term = search.toLowerCase();
        const inSubject = (e.subject_name || "").toLowerCase().includes(term);
        const inClass = (e.classroom_name || "").toLowerCase().includes(term);
        const inType = (e.exam_type || "").toLowerCase().includes(term);
        if (!inSubject && !inClass && !inType) return false;
      }
      return true;
    });
  }, [exams, filterClassroom, filterSubject, filterTerm, filterType, search]);

  const handleDelete = async (id, label) => {
    if (!window.confirm(`Delete "${label}"?`)) return;
    try {
      await api.delete(`exams/delete/${id}/`);
      toast.success("Exam deleted");
      fetchAll();
    } catch {
      toast.error("Failed to delete exam");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Exam Schedule</h2>
        <p className="text-gray-500 mt-1">
          Plan which classes sit which papers, and when. Marks are entered
          by each subject teacher from their own dashboard.
        </p>
      </div>

      <AdminSubNav items={examTabs} title="Exams Overview" />

      {/* Filters */}
      <div className="card p-4 mb-5 grid grid-cols-1 md:grid-cols-5 gap-3">
        <input
          type="text" placeholder="Search subject / class / type..."
          className="milk-input" value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="milk-input" value={filterClassroom} onChange={(e) => setFilterClassroom(e.target.value)}>
          <option value="all">All Classes</option>
          {classrooms.map((c) => <option key={c.id} value={c.id}>{c.grade} {c.stream}</option>)}
        </select>
        <select className="milk-input" value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
          <option value="all">All Subjects</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="milk-input" value={filterTerm} onChange={(e) => setFilterTerm(e.target.value)}>
          <option value="all">All Terms</option>
          <option value="Term 1">Term 1</option>
          <option value="Term 2">Term 2</option>
          <option value="Term 3">Term 3</option>
        </select>
        <select className="milk-input" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="all">All Exam Types</option>
          <option value="CAT 1">CAT 1</option>
          <option value="CAT 2">CAT 2</option>
          <option value="Midterm">Midterm</option>
          <option value="End Term">End Term</option>
        </select>
      </div>

      <div className="flex justify-end mb-5">
        <button onClick={() => navigate("/admin-dashboard/exams/add")} className="milk-btn whitespace-nowrap">
          + Create New Exam
        </button>
      </div>

      {loading && <p className="text-gray-500">Loading exams...</p>}
      {!loading && filtered.length === 0 && (
        <p className="text-gray-500">{exams.length === 0 ? "No exams created yet" : "No exams match your filters"}</p>
      )}

      {filtered.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-gray-500">
              <tr>
                <th className="p-3 text-left">Subject</th>
                <th className="p-3 text-left">Class</th>
                <th className="p-3 text-left">Exam Type</th>
                <th className="p-3 text-left">Term / Year</th>
                <th className="p-3 text-left">Exam Date</th>
                <th className="p-3 text-left">Total Marks</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((exam) => (
                <tr key={exam.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{exam.subject_name}</td>
                  <td className="p-3">{exam.classroom_name}</td>
                  <td className="p-3">{exam.exam_type}</td>
                  <td className="p-3">{exam.term} • {exam.academic_year}</td>
                  <td className="p-3">{exam.exam_date ? new Date(exam.exam_date).toLocaleDateString("en-KE") : "—"}</td>
                  <td className="p-3">{exam.total_marks}</td>
                  <td className="p-3 space-x-2 text-xs">
                    <button
                      onClick={() => navigate(`/admin-dashboard/exams/edit/${exam.id}`)}
                      className="bg-blue-500 text-white px-2 py-1 rounded">Edit</button>
                    <button
                      onClick={() => handleDelete(exam.id, `${exam.subject_name} — ${exam.exam_type}`)}
                      className="bg-red-500 text-white px-2 py-1 rounded">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ExamList;
