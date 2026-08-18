import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/api";

const getArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const currentYear = new Date().getFullYear();

const AddExam = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // present only when editing an existing exam

  const isEditMode = Boolean(id);

  const [form, setForm] = useState({
    classroom: "",
    subject: "",
    exam_type: "",
    term: "",
    academic_year: currentYear,
    exam_date: "",
    total_marks: 100,
  });

  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [fetchingExam, setFetchingExam] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadLists = async () => {
      try {
        const [classesRes, subjectsRes] = await Promise.all([
          api.get("classes/"),
          api.get("subjects/"),
        ]);
        setClassrooms(getArray(classesRes.data));
        setSubjects(getArray(subjectsRes.data));
      } catch {
        toast.error("Failed to load classes / subjects list");
      } finally {
        setLoadingLists(false);
      }
    };
    loadLists();
  }, []);

  useEffect(() => {
    if (!isEditMode) return;
    const loadExam = async () => {
      try {
        const { data } = await api.get(`exams/${id}/`);
        setForm({
          classroom: data.classroom || "",
          subject: data.subject || "",
          exam_type: data.exam_type || "",
          term: data.term || "",
          academic_year: data.academic_year || currentYear,
          exam_date: data.exam_date || "",
          total_marks: data.total_marks || 100,
        });
      } catch {
        toast.error("Failed to load exam details");
      } finally {
        setFetchingExam(false);
      }
    };
    loadExam();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "total_marks" || name === "academic_year" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEditMode) {
        await api.patch(`exams/update/${id}/`, form);
        toast.success("Exam updated successfully!");
      } else {
        await api.post("exams/create/", form);
        toast.success("Exam created successfully!");
      }
      navigate("/admin-dashboard/exams");
    } catch (err) {
      const msg = err.response?.data
        ? Object.values(err.response.data).flat().join(" ")
        : "Failed to save exam";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (fetchingExam) return <p className="p-6 text-gray-500">Loading exam details...</p>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate("/admin-dashboard/exams")} className="text-gray-500 hover:text-gray-700 text-sm">
          ← Back to Exam Schedule
        </button>
        <h2 className="text-3xl font-bold">{isEditMode ? "Edit Exam" : "Create New Exam"}</h2>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Class *</label>
            <select name="classroom" className="milk-input" value={form.classroom} onChange={handleChange} required disabled={loadingLists}>
              <option value="">{loadingLists ? "Loading..." : "Select a class"}</option>
              {classrooms.map((c) => <option key={c.id} value={c.id}>{c.grade} {c.stream}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Subject *</label>
            <select name="subject" className="milk-input" value={form.subject} onChange={handleChange} required disabled={loadingLists}>
              <option value="">{loadingLists ? "Loading..." : "Select a subject"}</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Exam Type *</label>
            <select name="exam_type" className="milk-input" value={form.exam_type} onChange={handleChange} required>
              <option value="">Select Type</option>
              <option value="CAT 1">CAT 1</option>
              <option value="CAT 2">CAT 2</option>
              <option value="Midterm">Midterm</option>
              <option value="End Term">End Term</option>
            </select>
          </div>
          <div>
            <label className="form-label">Term *</label>
            <select name="term" className="milk-input" value={form.term} onChange={handleChange} required>
              <option value="">Select Term</option>
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Academic Year *</label>
            <input type="number" name="academic_year" className="milk-input" value={form.academic_year} onChange={handleChange} required />
          </div>
          <div>
            <label className="form-label">Exam Date *</label>
            <input type="date" name="exam_date" className="milk-input" value={form.exam_date} onChange={handleChange} required />
          </div>
        </div>

        <div>
          <label className="form-label">Total Marks *</label>
          <input type="number" name="total_marks" className="milk-input" value={form.total_marks} onChange={handleChange} required min="1" />
        </div>

        <button type="submit" disabled={submitting || loadingLists} className="milk-btn w-full">
          {submitting ? "Saving..." : isEditMode ? "Save Changes" : "Create Exam"}
        </button>
      </form>
    </div>
  );
};

export default AddExam;
