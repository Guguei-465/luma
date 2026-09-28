import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/api";

const AddParent = () => {
  const navigate = useNavigate();

  // Form fields match your parent model exactly
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "",
    username: "",
    password: "",
    phone_number: "",
    alternative_phone: "", // optional second contact
    national_id: "",       // national ID / ID number
    physical_address: "",  // home/residential address
    occupation: "",        // job/work info
    is_active: true,       // active by default
    notes: ""              // extra admin notes
  });

  const [submitting, setSubmitting] = useState(false);

  // Unified input handler — supports text, select, checkboxes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  // Submit to API
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

try {
      await api.post("accounts/register/", { ...form, role: "PARENT" });
      toast.success("Parent/Guardian registered successfully!");
      navigate("/admin-dashboard/parents"); // go back to list
    } catch (err) {
      // Clean error message from API or fallback
      const errors = err.response?.data;
      const errorMsg = errors
        ? Object.values(errors).flat().join(" ")
        : "❌ Failed to register parent. Please try again.";
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Back Button + Page Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/admin-dashboard/parents")}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          ← Back to Parents List
        </button>
        <h2 className="text-3xl font-bold">Add New Parent / Guardian</h2>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="card space-y-5">
        {/* ── Personal Details ── */}
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
              placeholder="optional@example.com"
            />
          </div>
          <div>
            <label className="form-label">National ID Number *</label>
            <input
              type="text"
              name="national_id"
              className="milk-input"
              value={form.national_id}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* ── Contact Details ── */}
        <p className="text-xs uppercase tracking-widest text-teal-600 font-semibold pt-2">
          Contact Information
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Primary Phone Number *</label>
            <input
              name="phone_number"
              className="milk-input"
              value={form.phone_number}
              onChange={handleChange}
              required
              placeholder="e.g. 07######"
            />
          </div>
          <div>
            <label className="form-label">Alternative Phone Number</label>
            <input
              name="alternative_phone"
              className="milk-input"
              value={form.alternative_phone}
              onChange={handleChange}
              placeholder="optional secondary contact"
            />
          </div>
           <div>
            <label className="form-label">Username</label>
            <input
              name="username"
              className="milk-input"
              value={form.username}
              onChange={handleChange}
              placeholder="Input your username"
            />
          </div>
           <div>
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              className="milk-input"
              value={form.password}
              onChange={handleChange}
              placeholder="input you passord"
            />
          </div>
           <div>
            <label className="form-label">Role</label>
            <input
              name="role"
              className="milk-input"
              value={form.role}
              onChange={handleChange}
              placeholder="Parent"
            />
          </div>
        </div>

        {/* ── Additional Info ── */}
        <p className="text-xs uppercase tracking-widest text-teal-600 font-semibold pt-2">
          Other Information
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Occupation / Job</label>
            <input
              name="occupation"
              className="milk-input"
              value={form.occupation}
              onChange={handleChange}
              placeholder="what they do for work"
            />
          </div>
          <div>
            <label className="form-label">Physical Address</label>
            <input
              name="physical_address"
              className="milk-input"
              value={form.physical_address}
              onChange={handleChange}
              placeholder="home/village/town"
            />
          </div>
        </div>

        {/* Active Status Toggle */}
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
            Parent is Active / Can Receive Notices
          </label>
        </div>

        {/* Admin Notes */}
        <div>
          <label className="form-label">Admin Remarks / Notes</label>
          <textarea
            name="notes"
            className="milk-input resize-none"
            rows={3}
            value={form.notes}
            onChange={handleChange}
            placeholder="any extra info: linked children, special details..."
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="milk-btn w-full"
        >
          {submitting ? "Registering..." : "Register Parent / Guardian"}
        </button>
      </form>
    </div>
  );
};

export default AddParent;