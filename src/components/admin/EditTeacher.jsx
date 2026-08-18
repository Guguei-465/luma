import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/api";

const getArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const EditTeacher = () => {
  const { id } = useParams(); // CustomUser ID
  const navigate = useNavigate();

  // Only real, admin-editable CustomUser fields.
  const [form, setForm] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    is_active: true,
  });

  // Read-only professional details + live assignments, sourced
  // from the TeacherProfile / TeacherAssignment records — these
  // are managed by the teacher themselves and the Academic
  // Coordinator, not edited here.
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [assignments, setAssignments] = useState([]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const { data } = await api.get(`accounts/users/${id}/`);
        setForm({
          username: data.username || "",
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          phone_number: data.phone_number || "",
          is_active: data.is_active ?? true,
        });
      } catch (err) {
        toast.error("Failed to load teacher details.");
      } finally {
        setFetching(false);
      }
    };

    const fetchProfileAndAssignments = async () => {
      try {
        const { data } = await api.get("accounts/teacher-profiles/");
        const profile = getArray(data).find(
          (p) => String(p.user?.id) === String(id)
        );
        setTeacherProfile(profile || null);

        if (profile) {
          const assignRes = await api.get(`assignments/?teacher=${profile.id}`);
          setAssignments(
            getArray(assignRes.data).filter((a) => a.is_active !== false)
          );
        }
      } catch {
        // Non-fatal — read-only section just stays empty.
      }
    };

    fetchTeacher();
    fetchProfileAndAssignments();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.put(`accounts/users/${id}/update/`, {
        ...form,
        role: "TEACHER",
      });
      toast.success("Teacher details updated successfully!");
      setTimeout(() => navigate("/admin-dashboard/teachers"), 1200);
    } catch (err) {
      const errors = err.response?.data;
      const errorMsg = errors
        ? Object.values(errors).flat().join(" ")
        : "Failed to update teacher.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <p className="p-6 text-gray-500">Loading teacher record...</p>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
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
        <p className="text-xs uppercase tracking-widest text-teal-600 font-semibold">
          Account Details
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
            Teacher is Active / Can Log In
          </label>
        </div>

        <button type="submit" disabled={loading} className="milk-btn w-full">
          {loading ? "Saving Changes..." : "Save Account Changes"}
        </button>

        {/* READ-ONLY PROFESSIONAL DETAILS */}
        <div className="border-t pt-5">
          <p className="text-xs uppercase tracking-widest text-teal-600 font-semibold mb-3">
            Professional Details (read-only)
          </p>
          {teacherProfile ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <p><span className="text-gray-500">Employee No:</span> {teacherProfile.employee_number}</p>
              <p><span className="text-gray-500">Qualification:</span> {teacherProfile.qualification}</p>
              <p><span className="text-gray-500">Gender:</span> {teacherProfile.gender}</p>
              <p><span className="text-gray-500">Employed:</span> {teacherProfile.employment_date}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No teacher profile record found.</p>
          )}

          <p className="text-xs uppercase tracking-widest text-teal-600 font-semibold mt-5 mb-3">
            Current Assignments (read-only)
          </p>
          {assignments.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {assignments.map((a) => (
                <span key={a.id} className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs">
                  {a.subject_name} — {a.classroom_name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              Not yet assigned to any class or subject. This is done from the
              Academic Coordinator's Teachers page.
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default EditTeacher;
