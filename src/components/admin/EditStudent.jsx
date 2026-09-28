import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/api";

const getArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const EditStudent = () => {
  const { id } = useParams(); // Student ID from URL
  const navigate = useNavigate();

  // Matches the real Student model / StudentSerializer fields.
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    admission_number: "",
    assessment_number: "",
    gender: "",
    date_of_birth: "",
    classroom: "",
    status: "Active",
  });

  // Read-only context, shown but not editable here.
  const [parentName, setParentName] = useState("");
  const [classroomName, setClassroomName] = useState("");

  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // ── Load classrooms for the dropdown ──
  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const { data } = await api.get("classes/");
        setClassrooms(getArray(data));
      } catch {
        toast.error("Failed to load classes list");
      }
    };
    fetchClassrooms();
  }, []);

  // ── Load existing student data ──
  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const { data } = await api.get(`students/${id}/`);
        setForm({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          admission_number: data.admission_number || "",
          assessment_number: data.assessment_number || "",
          gender: data.gender || "",
          date_of_birth: data.date_of_birth || "",
          classroom: data.classroom || "",
          status: data.status || "Active",
        });
        setParentName(data.parent_name || "");
        setClassroomName(data.classroom_name || "");
      } catch (err) {
        toast.error("Failed to load student details.");
      } finally {
        setFetching(false);
      }
    };

    fetchStudent();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = { ...form };
      // Don't send an empty assessment_number — it's
      // unique-when-set on the backend.
      if (!payload.assessment_number.trim()) {
        delete payload.assessment_number;
      }

      await api.patch(`students/update/${id}/`, payload);
      toast.success("Student updated successfully!");
      setTimeout(() => navigate("/admin-dashboard/students"), 1200);
    } catch (err) {
      const errors = err.response?.data;
      const firstError = errors
        ? Object.values(errors).flat().join(" ")
        : "Failed to update student.";
      toast.error(firstError);
    } finally {
      setLoading(false);
    }
  };

  if (fetching)
    return <p className="p-6 text-gray-500">Loading student details...</p>;

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
            <label className="form-label">Gender *</label>
            <select
              name="gender"
              className="milk-input"
              value={form.gender}
              onChange={handleChange}
              required
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
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
            <label className="form-label">Assessment Number</label>
            <input
              name="assessment_number"
              className="milk-input"
              value={form.assessment_number}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Class & Status */}
        <p className="text-xs uppercase tracking-widest text-teal-600 font-semibold pt-2">
          Class & Status
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Class *</label>
            <select
              name="classroom"
              className="milk-input"
              value={form.classroom}
              onChange={handleChange}
              required
            >
              <option value="">Select a class</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.grade} {c.stream}
                </option>
              ))}
            </select>
            {classroomName && (
              <p className="text-xs text-gray-400 mt-1">
                Currently: {classroomName}
              </p>
            )}
          </div>
          <div>
            <label className="form-label">Status</label>
            <select
              name="status"
              className="milk-input"
              value={form.status}
              onChange={handleChange}
            >
              <option value="Active">Active</option>
              <option value="Transferred">Transferred</option>
              <option value="Graduated">Graduated</option>
            </select>
          </div>
        </div>

        {/* Parent (read-only — linked at registration time) */}
        <div>
          <label className="form-label">Parent / Guardian</label>
          <input
            className="milk-input bg-gray-50"
            value={parentName || "—"}
            readOnly
            disabled
          />
          <p className="text-xs text-gray-400 mt-1">
            To change the linked parent, delete and re-register the student
            with the correct parent phone number.
          </p>
        </div>

        <button type="submit" disabled={loading} className="milk-btn w-full">
          {loading ? "Saving Changes..." : "Save All Changes"}
        </button>
      </form>
    </div>
  );
};

export default EditStudent;
