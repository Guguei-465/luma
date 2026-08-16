import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/api";

const AddExam = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    exam_name: "",
    term: "",
    academic_year: new Date().getFullYear(),
    max_score: 100,
    target_classes: "",
    status: "Active",
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({...prev, [name]: name==="max_score"?Number(value):value}));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
await api.post("exams/create/", form);
      toast.success("✅ Exam created successfully! Ready for marks entry");
      navigate("/admin-dashboard/exams");
    } catch (err) {
      const msg = err.response?.data ? Object.values(err.response.data).flat().join(" ") : "Failed to create exam";
      toast.error(msg);
    } finally { setSubmitting(false); }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate("/admin-dashboard/exams")} className="text-gray-500 hover:text-gray-700 text-sm">← Back to Exams</button>
        <h2 className="text-3xl font-bold">Create New Exam / Assessment</h2>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="form-label">Exam Name *</label><input name="exam_name" className="milk-input" value={form.exam_name} onChange={handleChange} required placeholder="e.g. End of Term 1 Exam" /></div>
          <div><label className="form-label">Term *</label><select name="term" className="milk-input" value={form.term} onChange={handleChange} required><option value="">Select Term</option><option value="Term 1">Term 1</option><option value="Term 2">Term 2</option><option value="Term 3">Term 3</option></select></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="form-label">Academic Year *</label><input type="number" name="academic_year" className="milk-input" value={form.academic_year} onChange={handleChange} required /></div>
          <div><label className="form-label">Max Score Per Subject *</label><input type="number" name="max_score" className="milk-input" value={form.max_score} onChange={handleChange} required min="10" /></div>
        </div>
        <div><label className="form-label">Target Classes</label><input name="target_classes" className="milk-input" value={form.target_classes} onChange={handleChange} placeholder="e.g. Form 1, Form 2 — leave empty for all" /></div>
        <div><label className="form-label">Notes / Description</label><textarea name="notes" className="milk-input resize-none" rows={2} value={form.notes} onChange={handleChange} /></div>
        <button type="submit" disabled={submitting} className="milk-btn w-full">{submitting ? "Saving..." : "Save Exam"}</button>
      </form>
    </div>
  );
};

export default AddExam;