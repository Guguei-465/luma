import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";

const ParentPayment = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [loadingChild, setLoadingChild] = useState(true);
  const [error, setError] = useState("");
  const [student, setStudent] = useState(null);

  const [formData, setFormData] = useState({
    amount: "",
    phone: "",
    description: "School Fees",
  });

  // =====================================================
  // LOAD SPECIFIC CHILD
  // =====================================================

  useEffect(() => {
    const fetchChild = async () => {
      if (!studentId) {
        setError("No child was selected.");
        setLoadingChild(false);
        return;
      }

      try {
        setLoadingChild(true);
        setError("");

        const response = await api.get(
          `dashboard/parent/children/${studentId}/`
        );

        setStudent(response.data);
      } catch (err) {
        console.error(
          "Failed to load child:",
          err.response?.status,
          err.response?.data
        );

        if (err.response?.status === 404) {
          setError(
            "This child was not found or does not belong to your account."
          );
        } else {
          setError("Failed to load child details. Please try again.");
        }

        setStudent(null);
      } finally {
        setLoadingChild(false);
      }
    };

    fetchChild();
  }, [studentId]);

  // =====================================================
  // PHONE FORMAT
  // =====================================================

  const formatPhoneNumber = (phone) => {
    let cleaned = phone.replace(/\D/g, "");

    if (cleaned.startsWith("0")) {
      cleaned = "254" + cleaned.substring(1);
    } else if (cleaned.startsWith("7")) {
      cleaned = "254" + cleaned;
    } else if (cleaned.startsWith("254")) {
      cleaned = cleaned;
    }

    return cleaned;
  };

  // =====================================================
  // HANDLE INPUT
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // SUBMIT PAYMENT
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!student) {
      alert("Child information is not available.");
      return;
    }

    if (!studentId) {
      alert("No child was selected.");
      return;
    }

    const amount = Number(formData.amount);

    if (!amount || amount < 100) {
      alert("Amount must be at least KES 100.");
      return;
    }

    const phone = formatPhoneNumber(formData.phone);

    if (!/^2547\d{8}$/.test(phone)) {
      alert(
        "Please enter a valid Kenyan M-Pesa number.\n\nExample: 0712345678"
      );
      return;
    }

    setLoading(true);

    try {
      const payload = {
        student_id: Number(studentId),
        amount: amount,
        phone: phone,
        description: formData.description.trim() || "School Fees",
      };

      console.log("Payment payload:", payload);

      const response = await api.post(
        "fees/payments/stk-push/",
        payload
      );

      console.log("Payment response:", response.data);

      alert(
        `Payment initiated successfully!\n\n` +
          `Child: ${student.first_name} ${student.last_name}\n` +
          `Amount: KES ${amount.toLocaleString()}\n\n` +
          `Please check your phone and enter your M-Pesa PIN.`
      );

      setFormData({
        amount: "",
        phone: "",
        description: "School Fees",
      });

      setTimeout(() => {
        navigate(
          `/parent-dashboard/my-children/${studentId}?tab=fees`
        );
      }, 1500);
    } catch (err) {
      console.error(
        "Payment error:",
        err.response?.status,
        err.response?.data
      );

      const backendError = err.response?.data;

      let message =
        backendError?.detail ||
        backendError?.message ||
        backendError?.error ||
        "Unable to start payment. Please try again.";

      if (typeof backendError === "object" && !message) {
        message = Object.values(backendError).flat().join("\n");
      }

      alert(`Payment failed.\n\n${message}`);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOADING CHILD
  // =====================================================

  if (loadingChild) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex justify-center items-center py-16">
          <div className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-green-600 animate-spin"></div>
        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error || !student) {
    return (
      <div className="p-4 md:p-6">
        <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
            {error || "Child information could not be loaded."}
          </div>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-4 w-full bg-gray-700 hover:bg-gray-800 text-white py-3 rounded-xl font-medium transition-all duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAYMENT PAGE
  // =====================================================

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-800">
          Make Payment
        </h3>

        <p className="text-sm text-gray-500 mt-1">
          Pay school fees for this child via M-Pesa.
        </p>
      </div>

      <div className="max-w-lg mx-auto">
        {/* =====================================================
            PAYING FEES FOR
        ===================================================== */}

        <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-5 mb-5">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-3">
            Paying Fees For
          </p>

          <div className="flex items-center gap-4">
            {student.photo ? (
              <img
                src={student.photo}
                alt={`${student.first_name} ${student.last_name}`}
                className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                {student.first_name?.charAt(0)}
                {student.last_name?.charAt(0)}
              </div>
            )}

            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-base">
                {student.first_name} {student.last_name}
              </p>

              <p className="text-sm text-gray-600 mt-0.5">
                {student.grade} {student.stream}
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Admission No:{" "}
                <span className="font-medium text-gray-600">
                  {student.admission_number}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            PAYMENT FORM
        ===================================================== */}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* AMOUNT */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Amount (KES)
              </label>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                  KES
                </span>

                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  min="100"
                  step="1"
                  placeholder="e.g. 5000"
                  className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* PHONE */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                M-Pesa Phone Number
              </label>

              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0712345678"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                required
              />

              <p className="text-xs text-gray-400 mt-2">
                Enter the phone number that will receive the M-Pesa prompt.
              </p>
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>

              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="e.g. Term 1 Fees"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
              />
            </div>

            {/* PAYMENT SUMMARY */}
            {formData.amount && Number(formData.amount) >= 100 && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex justify-between items-center text-sm mb-3">
                  <span className="text-gray-500">
                    Child
                  </span>

                  <span className="font-semibold text-gray-800 text-right">
                    {student.first_name} {student.last_name}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm mb-3">
                  <span className="text-gray-500">
                    Description
                  </span>

                  <span className="font-medium text-gray-800 text-right">
                    {formData.description || "School Fees"}
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-3 mt-1 flex justify-between items-center">
                  <span className="font-semibold text-gray-700">
                    Amount
                  </span>

                  <span className="font-bold text-green-600 text-lg">
                    KES {Number(formData.amount).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>

                  Sending M-Pesa Prompt...
                </>
              ) : (
                "Pay via M-Pesa"
              )}
            </button>

            {/* CANCEL */}
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={loading}
              className="w-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ParentPayment;