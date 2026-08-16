import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/api";

const AddFeeStructure = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    class_name: "",
    term: "",
    academic_year: new Date().getFullYear(),
    tuition_fee: 0,
    uniform_fee: 0,
    boarding_fee: 0,
    activity_fee: 0,
    other_charges: 0,
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);

  // Auto compute total
  const total = Object.values(form).reduce((sum, val) => typeof val === "number" ? sum+val : sum, 0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({...prev, [name]: name.includes("fee")||name.includes("charges") ? Number(value) : value}));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
await api.post("fees/fee-structures/", {...form, total_fee: total});
      toast.success("✅ Fee structure created successfully!");
      navigate("/admin-dashboard/fees/structures");
    } catch (err) {
      const msg = err.response?.data ? Object.values(err.response.data).flat().join(" ") : "Failed to create fee structure";
      toast.error(msg);
    } finally { setSubmitting(false); }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate("/admin-dashboard/fees/structures")} className="text-gray-500 hover:text-gray-700 text-sm">← Back</button>
        <h2 className="text-3xl font-bold">New Fee Structure</h2>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        <p className="text-xs uppercase tracking-widest text-teal-600 font-semibold">Class & Period</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div><label className="form-label">Class *</label><input name="class_name" className="milk-input" value={form.class_name} onChange={handleChange} required /></div>
          <div><label className="form-label">Term *</label><select name="term" className="milk-input" value={form.term} onChange={handleChange} required><option value="">Select Term</option><option value="Term 1">Term 1</option><option value="Term 2">Term 2</option><option value="Term 3">Term 3</option></select></div>
          <div><label className="form-label">Year *</label><input type="number" name="academic_year" className="milk-input" value={form.academic_year} onChange={handleChange} required /></div>
        </div>

        <p className="text-xs uppercase tracking-widest text-teal-600 font-semibold pt-2">Fee Breakdown (KES)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="form-label">Tuition Fee *</label><input type="number" name="tuition_fee" className="milk-input" value={form.tuition_fee} onChange={handleChange} required /></div>
          <div><label className="form-label">Uniform Fee</label><input type="number" name="uniform_fee" className="milk-input" value={form.uniform_fee} onChange={handleChange} /></div>
          <div><label className="form-label">Boarding Fee</label><input type="number" name="boarding_fee" className="milk-input" value={form.boarding_fee} onChange={handleChange} /></div>
          <div><label className="form-label">Activity Fee</label><input type="number" name="activity_fee" className="milk-input" value={form.activity_fee} onChange={handleChange} /></div>
        </div>
        <div><label className="form-label">Other Charges</label><input type="number" name="other_charges" className="milk-input" value={form.other_charges} onChange={handleChange} /></div>

        <div className="p-3 bg-teal-50 rounded">
          <p className="text-lg font-bold text-teal-700">Total Fee: KES {total.toLocaleString()}</p>
        </div>

        <div><label className="form-label">Notes / Description</label><textarea name="notes" className="milk-input resize-none" rows={2} value={form.notes} onChange={handleChange} /></div>

        <button type="submit" disabled={submitting} className="milk-btn w-full">{submitting ? "Saving..." : "Save Fee Structure"}</button>
      </form>
    </div>
  );
};

export default AddFeeStructure;