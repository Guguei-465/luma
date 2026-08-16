import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/api";

const AddTeacher = () => {
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

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
    subjects: [],
  });

  const [submitting, setSubmitting] = useState(false);

  // =====================================================
  // FETCH SUBJECTS
  // =====================================================
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoadingSubjects(true);

        const response = await api.get("subjects/");

        // Handles both normal array and paginated DRF response
        const data = response.data.results || response.data;

        setSubjects(data);
      } catch (error) {
        console.error("Failed to fetch subjects:", error);
        toast.error("Failed to load subjects");
      } finally {
        setLoadingSubjects(false);
      }
    };

    fetchSubjects();
  }, []);

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
  // HANDLE SUBJECT SELECTION
  // =====================================================
  const handleSubjectChange = (e) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => Number(option.value)
    );

    setForm((prev) => ({
      ...prev,
      subjects: selectedOptions,
    }));
  };

  // =====================================================
  // SUBMIT FORM
  // =====================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.subjects.length === 0) {
      toast.error("Please select at least one subject");
      return;
    }

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

      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="flex items-center gap-4 mb-6">

        <button
          type="button"
          onClick={() =>
            navigate("/admin-dashboard/teachers")
          }
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          ← Back
        </button>

        <h2 className="text-3xl font-bold">
          Add New Teacher
        </h2>

      </div>

      <form
        onSubmit={handleSubmit}
        className="card space-y-6"
      >

        {/* =====================================================
            ACCOUNT DETAILS
        ===================================================== */}
        <div>
          <p className="text-xs uppercase tracking-widest text-teal-600 font-semibold mb-4">
            Account Details
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Username */}
            <div>
              <label className="form-label">
                Username *
              </label>

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

            {/* Password */}
            <div>
              <label className="form-label">
                Password *
              </label>

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

            {/* Role */}
            <div>
              <label className="form-label">
                Role *
              </label>

              <select
                name="role"
                className="milk-input"
                value={form.role}
                onChange={handleChange}
                required
              >
                <option value="TEACHER">
                  Teacher
                </option>

                <option value="ACADEMIC_COORDINATOR">
                  Academic Coordinator
                </option>

                <option value="ACCOUNTANT">
                  Accountant
                </option>

                <option value="PARENT">
                  Parent
                </option>

                <option value="SUPER_ADMIN">
                  Super Admin
                </option>
              </select>
            </div>

            {/* Email */}
            <div>
              <label className="form-label">
                Email *
              </label>

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

        {/* =====================================================
            PERSONAL DETAILS
        ===================================================== */}
        <div>

          <p className="text-xs uppercase tracking-widest text-teal-600 font-semibold mb-4">
            Personal Details
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* First Name */}
            <div>
              <label className="form-label">
                First Name *
              </label>

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

            {/* Last Name */}
            <div>
              <label className="form-label">
                Last Name *
              </label>

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

            {/* Phone */}
            <div>
              <label className="form-label">
                Phone Number *
              </label>

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

            {/* National ID */}
            <div>
              <label className="form-label">
                National ID *
              </label>

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

            {/* Gender */}
            <div>
              <label className="form-label">
                Gender *
              </label>

              <select
                name="gender"
                className="milk-input"
                value={form.gender}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select Gender
                </option>

                <option value="Male">
                  Male
                </option>

                <option value="Female">
                  Female
                </option>
              </select>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="form-label">
                Date of Birth *
              </label>

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

        {/* =====================================================
            PROFESSIONAL DETAILS
        ===================================================== */}
        <div>

          <p className="text-xs uppercase tracking-widest text-teal-600 font-semibold mb-4">
            Professional Details
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Employee Number */}
            <div>
              <label className="form-label">
                Employee Number *
              </label>

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

            {/* Qualification */}
            <div>
              <label className="form-label">
                Qualification *
              </label>

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

            {/* Employment Date */}
            <div>
              <label className="form-label">
                Employment Date *
              </label>

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

        {/* =====================================================
            SUBJECTS
        ===================================================== */}
        <div>

          <p className="text-xs uppercase tracking-widest text-teal-600 font-semibold mb-4">
            Subjects Taught
          </p>

          <label className="form-label">
            Select Subjects *
          </label>

          {loadingSubjects ? (
            <div className="text-sm text-gray-500 py-3">
              Loading subjects...
            </div>
          ) : subjects.length === 0 ? (
            <div className="text-sm text-red-500 py-3">
              No subjects available.
            </div>
          ) : (
            <>
              <select
                multiple
                name="subjects"
                className="milk-input min-h-[160px]"
                value={form.subjects.map(String)}
                onChange={handleSubjectChange}
                required
              >
                {subjects.map((subject) => (
                  <option
                    key={subject.id}
                    value={subject.id}
                  >
                    {subject.name}
                  </option>
                ))}
              </select>

              <p className="text-xs text-gray-500 mt-2">
                Hold Ctrl (Windows) or Command (Mac) to select
                multiple subjects.
              </p>
            </>
          )}

          {/* Selected Subjects */}
          {form.subjects.length > 0 && (
            <div className="mt-3">

              <p className="text-sm font-medium text-gray-700 mb-2">
                Selected Subjects:
              </p>

              <div className="flex flex-wrap gap-2">

                {form.subjects.map((subjectId) => {
                  const subject = subjects.find(
                    (item) => item.id === subjectId
                  );

                  return subject ? (
                    <span
                      key={subjectId}
                      className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm"
                    >
                      {subject.name}
                    </span>
                  ) : null;
                })}

              </div>
            </div>
          )}

        </div>

        {/* =====================================================
            SUBMIT
        ===================================================== */}
        <div className="pt-4">

          <button
            type="submit"
            disabled={submitting || loadingSubjects}
            className="milk-btn w-full"
          >
            {submitting
              ? "Registering Teacher..."
              : "Register Teacher"}
          </button>

        </div>

      </form>
    </div>
  );
};

export default AddTeacher;