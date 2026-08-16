import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/api";

const EditParent = () => {
  const { id } = useParams(); // Parent ID from URL: /parents/edit/5
  const navigate = useNavigate();

  //  EXACT same fields as AddParent — seamless consistency
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    alternative_phone: "",
    national_id: "",
    physical_address: "",
    occupation: "",
    is_active: true,
    notes: ""
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true); // Loading existing record

  // ── Load existing parent data into form ────────────────────────
  useEffect(() => {
    const fetchParent = async () => {
      try {
const { data } = await api.get(`accounts/users/${id}/`);
        // Pre-fill all fields safely with fallbacks
        setForm({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          phone_number: data.phone_number || "",
          alternative_phone: data.alternative_phone || "",
          national_id: data.national_id || "",
          physical_address: data.physical_address || "",
          occupation: data.occupation || "",
          is_active: data.is_active ?? true, // default true if missing
          notes: data.notes || ""
        });
      } catch (err) {
        toast.error("Failed to load parent details.");
      } finally {
        setFetching(false);
      }
    };

    fetchParent();
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
      // Use PATCH for partial updates (standard for edit)
await api.put(`accounts/users/${id}/update/`, form);
      toast.success("Parent details updated successfully!");
      setTimeout(() => navigate("/admin-dashboard/parents"), 1200); // back to list
    } catch (err) {
      const errors = err.response?.data;
      const errorMsg = errors
        ? Object.values(errors).flat().join(" ")
        : "❌ Failed to update parent. Please check your input.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ── Show loader while fetching record ───────────────────────────
  if (fetching) return <p className="p-6 text-gray-500">Loading parent record...</p>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Back Button + Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/admin-dashboard/parents")}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          ← Back to Parents List
        </button>
        <h2 className="text-3xl font-bold">Edit Parent / Guardian</h2>
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
            <label className="form-label">National ID Number *</label>
            <input
              name="national_id"
              className="milk-input"
              value={form.national_id}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Contact Information */}
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
            />
          </div>
          <div>
            <label className="form-label">Alternative Phone Number</label>
            <input
              name="alternative_phone"
              className="milk-input"
              value={form.alternative_phone}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Other Info */}
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
            />
          </div>
          <div>
            <label className="form-label">Physical Address</label>
            <input
              name="physical_address"
              className="milk-input"
              value={form.physical_address}
              onChange={handleChange}
            />
          </div>
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
            Active / Can Receive Notices & Alerts
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
          />
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

export default EditParent;