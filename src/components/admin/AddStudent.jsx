import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/api";

const AddStudent = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    admission_number: "",
    assessment_number: "",
    first_name: "",
    last_name: "",
    gender: "",
    date_of_birth: "",
    classroom: "", // send ID, backend gets classroom_name
    phone_number: "", // send phone_number to identify the parent
    status: "Active",
    date_admitted: new Date().toISOString().split('T')[0] // default today
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("students/create/", formData);
      toast.success("Student added successfully!");
      navigate("/admin-dashboard/students"); // go back to list
    } catch (err) {
      const msg = err.response?.data
        ? Object.values(err.response.data).flat().join(" ")
        : "Failed to add student";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate("/admin-dashboard/students")} className="text-gray-500 hover:text-gray-700 text-sm">
          ← Back to Students List
        </button>
        <h2 className="text-3xl font-bold">Add New Student</h2>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {/* Personal Details */}
        <p className="text-xs uppercase tracking-widest text-teal-600 font-semibold">Personal Information</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">First Name *</label>
            <input
              type="text"
              name="first_name"
              className="milk-input"
              value={formData.first_name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="form-label">Last Name *</label>
            <input
              type="text"
              name="last_name"
              className="milk-input"
              value={formData.last_name}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Gender *</label>
            <select
              name="gender"
              className="milk-input"
              value={formData.gender}
              onChange={handleChange}
              required
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="form-label">Date of Birth *</label>
            <input
              type="date"
              name="date_of_birth"
              className="milk-input"
              value={formData.date_of_birth}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Official Numbers */}
        <p className="text-xs uppercase tracking-widest text-teal-600 font-semibold pt-2">Official Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Admission Number *</label>
            <input
              type="text"
              name="admission_number"
              className="milk-input"
              value={formData.admission_number}
              onChange={handleChange}
              placeholder="e.g. LUMA-2026-00051"
              required
            />
          </div>
          <div>
            <label className="form-label">Assessment Number</label>
            <input
              type="text"
              name="assessment_number"
              className="milk-input"
              value={formData.assessment_number}
              onChange={handleChange}
              placeholder="e.g. KCPE20260001"
            />
          </div>
        </div>

        {/* Class & phone_number */}
        <p className="text-xs uppercase tracking-widest text-teal-600 font-semibold pt-2">Class & phone_number</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Assign Class *</label>
            <input
              type="number"
              name="classroom"
              className="milk-input"
              value={formData.classroom}
              onChange={handleChange}
              placeholder="Enter Class ID"
              required
            />
            {/* Or use <select> if you fetch classrooms list */}
          </div>
          <div>
            <label className="form-label">Parent / Guardian Phone *</label>
            <input
              type="phone"
              name="phone_number"
              className="milk-input"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="Enter Phone number"
              required
            />
          </div>
        </div>

        {/* Status & Admission Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Status</label>
            <select
              name="status"
              className="milk-input"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Left">Left</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
          <div>
            <label className="form-label">Date Admitted *</label>
            <input
              type="date"
              name="date_admitted"
              className="milk-input"
              value={formData.date_admitted}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Submit Button */}
        <button type="submit" disabled={submitting} className="milk-btn w-full">
          {submitting ? "Saving Student..." : "Save Student"}
        </button>
      </form>
    </div>
  );
};

export default AddStudent;