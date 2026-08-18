import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/api";

// =====================================================
// SAFE ARRAY (handles paginated DRF responses too)
// =====================================================
const getArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const AddStudent = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    admission_number: "",
    assessment_number: "",
    first_name: "",
    last_name: "",
    gender: "",
    date_of_birth: "",
    classroom: "", // classroom ID, chosen from a dropdown of real classes
    phone_number: "", // parent's phone number -> links to an EXISTING parent
    status: "Active",
  });

  const [submitting, setSubmitting] = useState(false);

  // =====================================================
  // CLASSROOMS — sourced from the Academic Coordinator's
  // classes list. Admin cannot type a class in by hand.
  // =====================================================
  const [classrooms, setClassrooms] = useState([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(true);

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const { data } = await api.get("classes/");
        setClassrooms(getArray(data));
      } catch {
        toast.error("Failed to load classes list");
      } finally {
        setLoadingClassrooms(false);
      }
    };
    fetchClassrooms();
  }, []);

  // =====================================================
  // PARENTS — used only to give the admin live feedback on
  // whether the phone number they typed matches a
  // registered parent. The backend still re-validates this
  // on submit, so this is a convenience check, not the
  // source of truth.
  // =====================================================
  const [parents, setParents] = useState([]);

  useEffect(() => {
    const fetchParents = async () => {
      try {
        const { data } = await api.get("accounts/parents/");
        setParents(getArray(data));
      } catch {
        // Non-fatal — the backend still validates on submit.
      }
    };
    fetchParents();
  }, []);

  const matchedParent = useMemo(() => {
    const phone = formData.phone_number.trim();
    if (!phone) return null;
    return (
      parents.find((p) => (p.parent_phone || "").trim() === phone) || null
    );
  }, [formData.phone_number, parents]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Don't send an empty assessment_number as "" — the field
      // is unique-when-set on the backend, so an empty string
      // would collide with the next student who also leaves it
      // blank. Send it only if the admin actually typed one.
      const payload = { ...formData };
      if (!payload.assessment_number.trim()) {
        delete payload.assessment_number;
      }

      await api.post("students/create/", payload);
      toast.success("Student added successfully!");
      navigate("/admin-dashboard/students");
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
        <button
          onClick={() => navigate("/admin-dashboard/students")}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          ← Back to Students List
        </button>
        <h2 className="text-3xl font-bold">Add New Student</h2>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {/* Personal Details */}
        <p className="text-xs uppercase tracking-widest text-teal-600 font-semibold">
          Personal Information
        </p>
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
        <p className="text-xs uppercase tracking-widest text-teal-600 font-semibold pt-2">
          Official Details
        </p>
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

        {/* Class & Parent */}
        <p className="text-xs uppercase tracking-widest text-teal-600 font-semibold pt-2">
          Class & Parent Link
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Assign Class *</label>
            <select
              name="classroom"
              className="milk-input"
              value={formData.classroom}
              onChange={handleChange}
              required
              disabled={loadingClassrooms}
            >
              <option value="">
                {loadingClassrooms
                  ? "Loading classes..."
                  : classrooms.length === 0
                  ? "No classes exist yet"
                  : "Select a class"}
              </option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.grade} {c.stream}
                </option>
              ))}
            </select>
            {!loadingClassrooms && classrooms.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                No classes have been created yet. Ask the Academic
                Coordinator to create a class first.
              </p>
            )}
          </div>
          <div>
            <label className="form-label">Parent / Guardian Phone *</label>
            <input
              type="tel"
              name="phone_number"
              className="milk-input"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="Must match an existing parent account"
              required
            />
            {formData.phone_number.trim() && (
              <p
                className={`text-xs mt-1 ${
                  matchedParent ? "text-green-600" : "text-red-500"
                }`}
              >
                {matchedParent
                  ? `✓ Linked to parent: ${matchedParent.parent_name}`
                  : "No registered parent found with this phone number. Register the parent first."}
              </p>
            )}
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="form-label">Status</label>
          <select
            name="status"
            className="milk-input"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="Active">Active</option>
            <option value="Transferred">Transferred</option>
            <option value="Graduated">Graduated</option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || loadingClassrooms}
          className="milk-btn w-full"
        >
          {submitting ? "Saving Student..." : "Save Student"}
        </button>
      </form>
    </div>
  );
};

export default AddStudent;
