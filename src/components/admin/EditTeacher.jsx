import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/api";

const EditTeacher = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();

  // EXACT same fields as AddTeacher for perfect consistency
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    employee_id: "",
    subject_specialty: "",
    assigned_classes: "",
    is_active: true
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // ── Load existing teacher data ────────────────────────────────
  useEffect(() => {
    const fetchTeacher = async () => {
      try {
const { data } = await api.get(`accounts/users/${id}/`);
        setForm({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          phone_number: data.phone_number || "",
          employee_id: data.employee_id || "",
          subject_specialty: data.subject_specialty || "",
          assigned_classes: data.assigned_classes || "",
          is_active: data.is_active ?? true
        });
      } catch (err) {
        toast.error("Failed to load teacher details.");
      } finally {
        setFetching(false);
      }
    };

    fetchTeacher();
  }, [id]);

  // ── Universal input handler ─────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  // ── Submit updated data ────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
await api.put(`accounts/users/${id}/update/`, form);
      toast.success("✅ Teacher details updated successfully!");
      setTimeout(() => navigate("/admin-dashboard/teachers"), 1200);
    } catch (err) {
      const errors = err.response?.data;
      const errorMsg = errors
        ? Object.values(errors).flat().join(" ")
        : "❌ Failed to update teacher.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <p className="p-6 text-gray-500">Loading teacher record...</p>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Back Button + Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/admin-dashboard/teachers")}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          ← Back to Teachers List
        </button>
        <h2 className="text-3xl font-bold">Edit Teacher Details</h2>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {/* Personal Details */}
        <p className="text-xs uppercase tracking-widest text-teal-600 font-semibold">
          Personal Details
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
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              className="milk-input"
              value={form.email}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="form-label">Phone Number *</label>
            <input
              name="phone_number"
              className="milk-input"
              value={form.phone_number}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Work & Assignment Details */}
        <p className="text-xs uppercase tracking-widest text-teal-600 font-semibold pt-2">
          Work & Assignments
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Employee ID *</label>
            <input
              name="employee_id"
              className="milk-input"
              value={form.employee_id}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="form-label">Subject Specialty</label>
            <input
              name="subject_specialty"
              className="milk-input"
              value={form.subject_specialty}
              onChange={handleChange}
              placeholder="e.g. Mathematics, Chemistry"
            />
          </div>
        </div>

        <div>
          <label className="form-label">Assigned Classes / Streams</label>
          <input
            name="assigned_classes"
            className="milk-input"
            value={form.assigned_classes}
            onChange={handleChange}
            placeholder="e.g. Form 1A, Grade 5 Red"
          />
        </div>

        {/* Active Status */}
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
            Teacher is Active / Can Teach & Receive Notices
          </label>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={loading}
          className="milk-btn w-full"
        >
          {loading ? "Saving Changes..." : "Save All Changes"}
        </button>
      </form>
    </div>
  );
};

export default EditTeacher;