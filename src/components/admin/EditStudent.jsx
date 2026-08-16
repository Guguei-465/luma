import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/api";

const EditStudent = () => {
  const { id } = useParams(); // Student ID from URL
  const navigate = useNavigate();

  // ✅ Matches AddStudentRegister form exactly
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    admission_number: "",
    date_of_birth: "",
    current_class: "",
    stream: "",
    parent_id: "",
    parent_name: "",
    parent_phone: "",
    school_name: "",
    is_active: true,
    notes: ""
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // ── Load existing student data ────────────────────────
  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const { data } = await api.get(`students/${id}/`);
        setForm({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          admission_number: data.admission_number || "",
          date_of_birth: data.date_of_birth || "",
          current_class: data.current_class || "",
          stream: data.stream || "",
          parent_id: data.parent_id || "",
          parent_name: data.parent_name || "",
          parent_phone: data.parent_phone || "",
          school_name: data.school_name || "",
          is_active: data.is_active ?? true,
          notes: data.notes || ""
        });
      } catch (err) {
        toast.error("❌ Failed to load student details.");
      } finally {
        setFetching(false);
      }
    };

    fetchStudent();
  }, [id]);

  // ── Unified input handler ──────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  // ── Save updated data ─────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
await api.patch(`students/update/${id}/`, form);
      toast.success("✅ Student updated successfully!");
      setTimeout(() => navigate("/admin-dashboard/students"), 1200);
    } catch (err) {
      const errors = err.response?.data;
      const firstError = errors
        ? Object.values(errors).flat().join(" ")
        : "❌ Failed to update student.";
      toast.error(firstError);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <p className="p-6 text-gray-500">Loading student details...</p>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Back Button + Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/admin-dashboard/students")}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          ← Back to Students List
        </button>
        <h2 className="text-3xl font-bold">Edit Student</h2>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {/* Personal Details */}
        <p className="text-xs uppercase tracking-widest text-teal-600 font-semibold">
          Student Personal Details
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">First Name *</label>
            <input
              name="first_name"
              className="milk-input"
              value={form.first_name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="form-label">Last Name *</label>
            <input
              name="last_name"
              className="milk-input"
              value={form.last_name}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Admission Number *</label>
            <input
              name="admission_number"
              className="milk-input"
              value={form.admission_number}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="form-label">Date of Birth</label>
            <input
              type="date"
              name="date_of_birth"
              className="milk-input"
              value={form.date_of_birth}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Class & School */}
        <p className="text-xs uppercase tracking-widest text-teal-600 font-semibold pt-2">
          Class & School Information
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Current Class *</label>
            <input
              name="current_class"
              className="milk-input"
              value={form.current_class}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="form-label">Stream / Section</label>
            <input
              name="stream"
              className="milk-input"
              value={form.stream}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label className="form-label">School Name</label>
          <input
            name="school_name"
            className="milk-input"
            value={form.school_name}
            onChange={handleChange}
            placeholder="Leave empty for current school"
          />
        </div>

        {/* Parent / Guardian */}
        <p className="text-xs uppercase tracking-widest text-teal-600 font-semibold pt-2">
          Parent / Guardian Details
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Parent Full Name</label>
            <input
              name="parent_name"
              className="milk-input"
              value={form.parent_name}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="form-label">Parent Phone Number</label>
            <input
              name="parent_phone"
              className="milk-input"
              value={form.parent_phone}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Status & Notes */}
        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            name="is_active"
            id="is_active"
            checked={form.is_active}
            onChange={handleChange}
            className="w-4 h-4 accent-teal-600"
          />
          <label htmlFor="is_active" className="form-label mb-0">
            Student is Active / Enrolled
          </label>
        </div>

        <div>
          <label className="form-label">Admin Notes / Transfer History</label>
          <textarea
            name="notes"
            className="milk-input resize-none"
            rows={3}
            value={form.notes}
            onChange={handleChange}
          />
        </div>

        <button type="submit" disabled={loading} className="milk-btn w-full">
          {loading ? "Saving Changes..." : "Save All Changes"}
        </button>
      </form>
    </div>
  );
};

export default EditStudent;