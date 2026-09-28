import React, { useEffect, useState, useMemo } from "react";
import api from "../api/api";

// =====================================================
// SPINNER
// =====================================================

const Spinner = () => (
  <div className="flex justify-center items-center py-20">
    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-600"></div>
  </div>
);

// =====================================================
// MONEY
// =====================================================

const formatMoney = (value) => {
  const amount = Number(value || 0);
  if (isNaN(amount)) return "KES 0";
  return `KES ${amount.toLocaleString()}`;
};

// =====================================================
// FEE STRUCTURES
// =====================================================

const FeeStructures = () => {
  const [feeStructures, setFeeStructures] = useState([]);
  const [classes, setClasses] = useState([]);
  const [studentFees, setStudentFees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ===================================================
  // ✅ FORM — MATCHES DJANGO MODEL EXACTLY!
  // ===================================================

  const [form, setForm] = useState({
    classroom: "",
    academic_year: "2026",
    term: "",
    tuition_fee: "",     // ✅ Matches Django
    activity_fee: "",    // ✅ Matches Django
    exam_fee: "",        // ✅ Matches Django
    other_fee: "",       // ✅ Matches Django
    description: "",
  });

  // ===================================================
  // ✅ AUTO-CALCULATE TOTAL FEE
  // ===================================================
  const totalFee = useMemo(() => {
    const tuition = Number(form.tuition_fee) || 0;
    const activity = Number(form.activity_fee) || 0;
    const exam = Number(form.exam_fee) || 0;
    const other = Number(form.other_fee) || 0;
    return tuition + activity + exam + other;
  }, [form.tuition_fee, form.activity_fee, form.exam_fee, form.other_fee]);

  // ===================================================
  // GET ARRAY FROM RESPONSE
  // ===================================================

  const extractArray = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.results)) return response.results;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.fee_structures)) return response.fee_structures;
    if (Array.isArray(response?.student_fees)) return response.student_fees;
    if (Array.isArray(response?.classes)) return response.classes;
    return [];
  };

  // ===================================================
  // LOAD ALL DATA
  // ===================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        feeStructureResponse,
        studentFeeResponse,
        classResponse,
      ] = await Promise.all([
        api.get("fees/fee-structures/"),
        api.get("fees/student-fees/"),
        api.get("classes/"),
      ]);

      setFeeStructures(extractArray(feeStructureResponse.data));
      setStudentFees(extractArray(studentFeeResponse.data));
      setClasses(extractArray(classResponse.data));

    } catch (err) {
      console.error("LOAD ERROR:", err.response?.data || err.message);
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    loadData();
  }, []);

  // ===================================================
  // FORM CHANGE
  // ===================================================

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  // ===================================================
  // GET STUDENT CLASS NAME
  // ===================================================

  const getStudentClassName = (studentFee) => {
    if (studentFee.classroom && studentFee.classroom !== "—") {
      return studentFee.classroom;
    }
    return "—";
  };

  // ===================================================
  // CLASS COLOR MAP
  // ===================================================

  const getClassColorMap = useMemo(() => {
    const uniqueClasses = [...new Set(studentFees.map(sf => sf.classroom).filter(Boolean))];
    const colorClasses = [
      "bg-blue-100 text-blue-800",
      "bg-green-100 text-green-800",
      "bg-purple-100 text-purple-800",
      "bg-orange-100 text-orange-800",
      "bg-pink-100 text-pink-800",
      "bg-teal-100 text-teal-800",
      "bg-indigo-100 text-indigo-800",
      "bg-yellow-100 text-yellow-800",
    ];
    const map = {};
    uniqueClasses.forEach((className, idx) => {
      map[className] = colorClasses[idx % colorClasses.length];
    });
    return map;
  }, [studentFees]);

  // ===================================================
  // GET TERM
  // ===================================================

  const getTerm = (studentFee) => {
    if (studentFee.term) return studentFee.term;
    return "—";
  };

  // ===================================================
  // GET CLASS NAME for FEE STRUCTURES
  // ===================================================

  const getClassName = (item) => {
    if (item.classroom_name) return item.classroom_name;
    if (item.class_name) return item.class_name;
    if (item.classroom && typeof item.classroom === "string") return item.classroom;
    if (item.classroom?.name) return item.classroom.name;

    const classroomId = typeof item.classroom === "object" ? item.classroom?.id : item.classroom;
    if (classroomId) {
      const found = classes.find((c) => Number(c.id) === Number(classroomId));
      if (found) {
        return (
          found.name ||
          found.class_name ||
          found.classroom_name ||
          (found.grade && found.stream ? `${found.grade} ${found.stream}` : "") ||
          `Class ${found.id}`
        );
      }
    }
    return "—";
  };

  // ===================================================
  // ✅ GET TOTAL FEE FROM DJANGO RESPONSE
  // ===================================================

  const getTotalFee = (fee) => {
    // Django auto-calculates total_fee — use that!
    if (fee.total_fee) return Number(fee.total_fee);
    // Fallback: sum individual fields
    return (
      Number(fee.tuition_fee || 0) +
      Number(fee.activity_fee || 0) +
      Number(fee.exam_fee || 0) +
      Number(fee.other_fee || 0)
    );
  };

  // ===================================================
  // ✅ CHECK DUPLICATE BEFORE SUBMIT
  // ===================================================
  const findDuplicateFeeStructure = (classroomId, year, termName) => {
    return feeStructures.find(fs =>
      Number(fs.classroom) === Number(classroomId) &&
      Number(fs.academic_year) === Number(year) &&
      fs.term === termName
    );
  };

  // ===================================================
  // ✅ CREATE FEE STRUCTURE — PERFECT FIELD NAMES!
  // ===================================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.classroom) { setError("Please select a class."); return; }
    if (!form.academic_year) { setError("Please enter the academic year."); return; }
    if (!form.term) { setError("Please select a term."); return; }

    // ✅ At least one fee type must be filled
    const hasAmount = form.tuition_fee || form.activity_fee || form.exam_fee || form.other_fee;
    if (!hasAmount) {
      setError("Please enter at least one fee amount.");
      return;
    }

    // ✅ PREVENT DUPLICATE
    const duplicate = findDuplicateFeeStructure(form.classroom, form.academic_year, form.term);
    if (duplicate) {
      const className = getClassName(duplicate);
      setError(
        `⚠️ A Fee Structure already exists for: ${className} | ${form.term} | ${form.academic_year}. ` +
        "Edit the existing one instead."
      );
      return;
    }

    try {
      setSaving(true);

      // ✅ SENDING EXACT FIELD NAMES FROM YOUR DJANGO MODEL!
      const payload = {
        classroom: Number(form.classroom),
        academic_year: Number(form.academic_year),
        term: form.term,
        
        tuition_fee: Number(form.tuition_fee) || 0,
        activity_fee: Number(form.activity_fee) || 0,
        exam_fee: Number(form.exam_fee) || 0,
        other_fee: Number(form.other_fee) || 0,
        
        description: form.description.trim(),
      };

      console.log("📤 CREATING FEE STRUCTURE:", payload);
      const res = await api.post("fees/fee-structures/", payload);
      console.log("✅ FEE STRUCTURE CREATED:", res.data);

      setSuccess("✅ Fee structure created successfully.");
      setForm({ classroom: "", academic_year: "2026", term: "", tuition_fee: "", activity_fee: "", exam_fee: "", other_fee: "", description: "" });
      await loadData();

    } catch (err) {
      console.error("❌ CREATE ERROR:", err.response?.data || err.message);

      const data = err.response?.data;
      if (data?.non_field_errors) {
        setError(
          "⚠️ This Fee Structure already exists! " +
          "Same Class, Year & Term is not allowed."
        );
      } else if (typeof data === "string") setError(data);
      else if (data?.detail) setError(data.detail);
      else if (data?.message) setError(data.message);
      else if (data) {
        const msgs = Object.entries(data)
          .map(([f, m]) => `${f}: ${Array.isArray(m) ? m.join(", ") : m}`)
          .join(" | ");
        setError(msgs);
      } else {
        setError("Failed to create fee structure.");
      }
    } finally {
      setSaving(false);
    }
  };

  // ===================================================
  // GENERATE STUDENT ACCOUNTS
  // ===================================================

  const generateAccounts = async (feeStructure) => {
    const className = getClassName(feeStructure);
    const confirmed = window.confirm(
      `Generate fee accounts for students in ${className} for ${feeStructure.term}?`
    );
    if (!confirmed) return;

    setGenerating(feeStructure.id);
    setError("");
    setSuccess("");

    try {
      const res = await api.post(`fees/fee-structures/${feeStructure.id}/generate_accounts/`);
      console.log("GENERATE RESPONSE:", res.data);
      setSuccess(res.data?.message || "✅ Student fee accounts generated successfully.");
      await loadData();
    } catch (err) {
      console.error("GENERATE ERROR:", err.response?.data || err.message);
      const data = err.response?.data;
      if (typeof data === "string") setError(data);
      else if (data?.detail) setError(data.detail);
      else if (data?.message) setError(data.message);
      else setError("Failed to generate student fee accounts.");
    } finally {
      setGenerating(null);
    }
  };

  // ===================================================
  // DELETE FEE STRUCTURE
  // ===================================================

  const deleteFeeStructure = async (fee) => {
    if (!window.confirm("Delete this fee structure?")) return;
    try {
      setError(""); setSuccess("");
      await api.delete(`fees/fee-structures/${fee.id}/`);
      setSuccess("✅ Fee structure deleted successfully.");
      await loadData();
    } catch (err) {
      console.error("DELETE ERROR:", err.response?.data || err.message);
      setError("Failed to delete fee structure.");
    }
  };

  // ===================================================
  // TOTALS
  // ===================================================

  const totalFeeStructures = feeStructures.length;
  const totalStudentAccounts = studentFees.length;
  const totalExpected = studentFees.reduce(
    (sum, sf) => sum + Number(sf.total_fee ?? sf.total_expected ?? 0), 0
  );
  const totalPaid = studentFees.reduce(
    (sum, sf) => sum + Number(sf.amount_paid ?? sf.total_paid ?? 0), 0
  );
  const totalBalance = totalExpected - totalPaid;

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) return <Spinner />;

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">

      {/* HEADER */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-800">Fee Structures</h1>
        <p className="text-gray-500 mt-1">Create and manage school fee structures.</p>
      </div>

      {/* SUCCESS / ERROR */}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4">{success}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">{error}</div>}

      {/* SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Fee Structures</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{totalFeeStructures}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">Student Fee Accounts</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{totalStudentAccounts}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-purple-500">
          <p className="text-sm text-gray-500">Total Expected</p>
          <p className="text-xl font-bold text-gray-800 mt-1">{formatMoney(totalExpected)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-orange-500">
          <p className="text-sm text-gray-500">Total Collected</p>
          <p className="text-xl font-bold text-green-600 mt-1">{formatMoney(totalPaid)}</p>
        </div>
      </div>

      {/* CREATE FORM */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Create Fee Structure</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Class & Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class *</label>
            <select
              name="classroom"
              value={form.classroom}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select Class</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name ||
                    item.class_name ||
                    item.classroom_name ||
                    (item.grade && item.stream ? `${item.grade} ${item.stream}` : "") ||
                    item.title ||
                    `Class ${item.id}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year *</label>
            <input
              type="number"
              name="academic_year"
              value={form.academic_year}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Term */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Term *</label>
            <select
              name="term"
              value={form.term}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select Term</option>
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
          </div>

          {/* Auto-Calculated Total */}
          <div className="flex items-end">
            <div className="w-full bg-green-50 rounded-lg px-4 py-3 border border-green-200">
              <label className="block text-sm font-medium text-green-700 mb-1">Total Fee (Auto)</label>
              <p className="text-xl font-bold text-green-700">{formatMoney(totalFee)}</p>
            </div>
          </div>

          {/* Fee Type Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tuition Fee (KES)</label>
            <input
              type="number"
              name="tuition_fee"
              value={form.tuition_fee}
              onChange={handleChange}
              min="0"
              step="1"
              placeholder="e.g. 20000"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Activity Fee (KES)</label>
            <input
              type="number"
              name="activity_fee"
              value={form.activity_fee}
              onChange={handleChange}
              min="0"
              step="1"
              placeholder="e.g. 5000"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Exam Fee (KES)</label>
            <input
              type="number"
              name="exam_fee"
              value={form.exam_fee}
              onChange={handleChange}
              min="0"
              step="1"
              placeholder="e.g. 3000"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Other Fee (KES)</label>
            <input
              type="number"
              name="other_fee"
              value={form.other_fee}
              onChange={handleChange}
              min="0"
              step="1"
              placeholder="e.g. 1000"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="3"
              placeholder="e.g. Grade 1 Term 1 School Fees"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Submit Button */}
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold transition"
            >
              {saving ? "Creating Fee Structure..." : "Create Fee Structure"}
            </button>
          </div>
        </form>
      </div>

      {/* EXISTING FEE STRUCTURES */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Existing Fee Structures</h2>
          <p className="text-sm text-gray-500 mt-1">
            ✅ You cannot create duplicates — same Class + Year + Term is not allowed.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-4 py-3">#</th>
                <th className="text-left px-4 py-3">Class</th>
                <th className="text-left px-4 py-3">Year</th>
                <th className="text-left px-4 py-3">Term</th>
                <th className="text-left px-4 py-3">Tuition</th>
                <th className="text-left px-4 py-3">Activity</th>
                <th className="text-left px-4 py-3">Exam</th>
                <th className="text-left px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {feeStructures.length === 0 ? (
                <tr><td colSpan="9" className="text-center py-12 text-gray-500">No fee structures found.</td></tr>
              ) : (
                feeStructures.map((fee, index) => (
                  <tr key={fee.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{index + 1}</td>
                    <td className="px-4 py-3 font-semibold">{getClassName(fee)}</td>
                    <td className="px-4 py-3">{fee.academic_year || "—"}</td>
                    <td className="px-4 py-3">{fee.term || "—"}</td>
                    <td className="px-4 py-3">{formatMoney(fee.tuition_fee)}</td>
                    <td className="px-4 py-3">{formatMoney(fee.activity_fee)}</td>
                    <td className="px-4 py-3">{formatMoney(fee.exam_fee)}</td>
                    <td className="px-4 py-3 font-bold text-green-600">{formatMoney(getTotalFee(fee))}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => generateAccounts(fee)}
                          disabled={generating === fee.id}
                          className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm"
                        >
                          {generating === fee.id ? "..." : "Accounts"}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteFeeStructure(fee)}
                          className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* STUDENT FEE ACCOUNTS */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Student Fee Accounts</h2>
          <p className="text-sm text-gray-500 mt-1">Class names show directly from records.</p>
        </div>
        {studentFees.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No student fee accounts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-4 py-3">#</th>
                  <th className="text-left px-4 py-3">Student</th>
                  <th className="text-left px-4 py-3">Class</th>
                  <th className="text-left px-4 py-3">Term</th>
                  <th className="text-left px-4 py-3">Total Fee</th>
                  <th className="text-left px-4 py-3">Paid</th>
                  <th className="text-left px-4 py-3">Balance</th>
                </tr>
              </thead>
              <tbody>
                {studentFees.map((studentFee, index) => {
                  const expected = Number(studentFee.total_fee ?? studentFee.total_expected ?? 0);
                  const paid = Number(studentFee.amount_paid ?? studentFee.total_paid ?? 0);
                  const balance = Number(studentFee.balance ?? expected - paid);
                  const className = getStudentClassName(studentFee);
                  const colorClass = getClassColorMap[studentFee.classroom] || "bg-gray-100 text-gray-800";

                  return (
                    <tr key={studentFee.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{index + 1}</td>
                      <td className="px-4 py-3 font-semibold">{studentFee.student_name || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                          {className}
                        </span>
                      </td>
                      <td className="px-4 py-3">{getTerm(studentFee)}</td>
                      <td className="px-4 py-3 font-semibold">{formatMoney(expected)}</td>
                      <td className="px-4 py-3 text-green-600 font-semibold">{formatMoney(paid)}</td>
                      <td className="px-4 py-3 text-red-600 font-semibold">{formatMoney(balance)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeeStructures;