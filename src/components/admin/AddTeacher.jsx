import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/api";

const AddTeacher = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    password: "",
    role: "TEACHER",
    employee_number: "",
    national_id: "",
    gender: "",
    date_of_birth: "",
    qualification: "",
    employment_date: "",
  });

  const [submitting, setSubmitting] = useState(false);

  // =====================================================
  // HANDLE INPUT CHANGE
  // =====================================================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // SUBMIT FORM
  //
  // NOTE: Which subjects/classes this teacher teaches is NOT
  // set here. Once the teacher account exists, the Academic
  // Coordinator assigns them to classes and subjects from the
  // Teachers page — a teacher can be assigned to any number of
  // classes and subjects, so it doesn't belong on the
  // registration form.
  // =====================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitting(true);

    try {
      await api.post("accounts/register/", form);

      toast.success("Teacher registered successfully!");

      navigate("/admin-dashboard/teachers");
    } catch (err) {
      console.error("Teacher registration error:", err);

      let msg = "Failed to register teacher";

      if (err.response?.data) {
        const data = err.response.data;

        if (typeof data === "object") {
          msg = Object.entries(data)
            .map(([field, errors]) => {
              const errorText = Array.isArray(errors)
                ? errors.join(", ")
                : errors;

              return `${field}: ${errorText}`;
            })
            .join(" | ");
        } else {
          msg = data;
        }
      }

      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => navigate("/admin-dashboard/teachers")}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          ← Back
        </button>

        <h2 className="text-3xl font-bold">Add New Teacher</h2>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* ACCOUNT DETAILS */}
        <div>
          <p className="text-xs uppercase tracking-widest text-teal-600 font-semibold mb-4">
            Account Details
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Username *</label>
              <input
                type="text"
                name="username"
                className="milk-input"
                value={form.username}
                onChange={handleChange}
                placeholder="e.g. teacher14"
                required
              />
            </div>

            <div>
              <label className="form-label">Password *</label>
              <input
                type="password"
                name="password"
                className="milk-input"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter password"
                required
              />
            </div>

            <div>
              <label className="form-label">Email *</label>
              <input
                type="email"
                name="email"
                className="milk-input"
                value={form.email}
                onChange={handleChange}
                placeholder="teacher14@luma2000.ac.ke"
                required
              />
            </div>
          </div>
        </div>

        {/* PERSONAL DETAILS */}
        <div>
          <p className="text-xs uppercase tracking-widest text-teal-600 font-semibold mb-4">
            Personal Details
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">First Name *</label>
              <input
                type="text"
                name="first_name"
                className="milk-input"
                value={form.first_name}
                onChange={handleChange}
                placeholder="e.g. Beatrice"
                required
              />
            </div>

            <div>
              <label className="form-label">Last Name *</label>
              <input
                type="text"
                name="last_name"
                className="milk-input"
                value={form.last_name}
                onChange={handleChange}
                placeholder="e.g. Chepkemoi"
                required
              />
            </div>

            <div>
              <label className="form-label">Phone Number *</label>
              <input
                type="tel"
                name="phone_number"
                className="milk-input"
                value={form.phone_number}
                onChange={handleChange}
                placeholder="e.g. 0711000012"
                required
              />
            </div>

            <div>
              <label className="form-label">National ID *</label>
              <input
                type="text"
                name="national_id"
                className="milk-input"
                value={form.national_id}
                onChange={handleChange}
                placeholder="e.g. 10345680"
                required
              />
            </div>

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
              <label className="form-label">Date of Birth *</label>
              <input
                type="date"
                name="date_of_birth"
                className="milk-input"
                value={form.date_of_birth}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        {/* PROFESSIONAL DETAILS */}
        <div>
          <p className="text-xs uppercase tracking-widest text-teal-600 font-semibold mb-4">
            Professional Details
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Employee Number *</label>
              <input
                type="text"
                name="employee_number"
                className="milk-input"
                value={form.employee_number}
                onChange={handleChange}
                placeholder="e.g. T014"
                required
              />
            </div>

            <div>
              <label className="form-label">Qualification *</label>
              <input
                type="text"
                name="qualification"
                className="milk-input"
                value={form.qualification}
                onChange={handleChange}
                placeholder="e.g. Bachelor of Education"
                required
              />
            </div>

            <div>
              <label className="form-label">Employment Date *</label>
              <input
                type="date"
                name="employment_date"
                className="milk-input"
                value={form.employment_date}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
          After registering this teacher, go to the Academic
          Coordinator&apos;s Teachers page to assign them to classes and
          subjects.
        </div>

        {/* SUBMIT */}
        <div className="pt-4">
          <button type="submit" disabled={submitting} className="milk-btn w-full">
            {submitting ? "Registering Teacher..." : "Register Teacher"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTeacher;
