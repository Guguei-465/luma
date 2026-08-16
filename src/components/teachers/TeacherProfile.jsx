import { useEffect, useState, useCallback } from "react";
import api from "../api/api";

const Spinner = () => (
  <div className="flex justify-center items-center h-80">
    <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-green-600"></div>
  </div>
);

const ButtonSpinner = () => (
  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
);

const TeacherProfile = () => {
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editMode, setEditMode] = useState(false);

  // --- Password states ---
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("accounts/teacher-profile/");
      console.log("Raw data:", data);
      const singleProfile = Array.isArray(data) ? data[0] : data;
      setProfile(singleProfile || {});
    } catch (err) {
      console.error("Profile load error:", err.response?.data || err.message);
      setError("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!profile.id) throw new Error("Profile ID missing — cannot update");
      console.log("Updating profile with:", profile);

      await api.put(
        `assignments/teacher-profile/${profile.id}/`,
        profile
      );

      setSuccess("Profile updated successfully!");
      setEditMode(false);
    } catch (err) {
      console.error("Update error details:", err.response?.data || err.message);
      const serverMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      setError(`Failed to update: ${serverMsg}`);
    } finally {
      setSaving(false);
    }
  };

  // --- Change Password Handler ---
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (newPassword !== confirmPassword) return setError("New passwords do NOT match!");
    if (newPassword.length < 6) return setError("Password must be at least 6 characters");

    try {
      setSaving(true);
      await api.post("auth/change-password/", {
        old_password: oldPassword,
        new_password: newPassword
      });
      setSuccess("Password changed successfully!");
      // Reset fields
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
      setShowChangePassword(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to change password. Check old password.");
    } finally {
      setSaving(false);
    }
  };

  // --- UPDATED Forgot Password Handler (matches accounts/password/reset/) ---
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      setSaving(true);
      // Correct endpoint matching your new accounts urls
      await api.post("accounts/password/reset/", { email: forgotEmail });
      // django-rest-passwordreset always returns success to hide registered emails
      setSuccess("If this email is registered, check your inbox/spam for reset link!");
      setForgotEmail("");
      setShowForgotPassword(false);
    } catch (err) {
      console.error("Reset error:", err.response?.status, err.response?.data || err.message);
      setError(
        err.response?.data?.detail
          ? JSON.stringify(err.response.data.detail)
          : "Could not send reset email. Please try again later."
      );
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) return <Spinner />;

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="card">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">My Profile</h1>
        <p className="text-gray-500 mt-1 text-sm">View and update your personal details</p>
      </div>

      {error && <div className="card bg-red-50 border border-red-200 text-red-700 p-4">{error}</div>}
      {success && <div className="card bg-green-50 border border-green-200 text-green-700 p-4">{success}</div>}

      {/* --- Main Profile Info --- */}
      <div className="card">
        {!editMode ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Employee Number</p>
                <p className="font-medium text-gray-800">{profile.employee_number || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Gender</p>
                <p className="font-medium text-gray-800 capitalize">{profile.gender || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date of Birth</p>
                <p className="font-medium text-gray-800">{profile.date_of_birth || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Qualification</p>
                <p className="font-medium text-gray-800">{profile.qualification || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">National ID</p>
                <p className="font-medium text-gray-800">{profile.national_id || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Employment Date</p>
                <p className="font-medium text-gray-800">{profile.employment_date || "—"}</p>
              </div>
            </div>
            <button className="milk-btn mt-4" onClick={() => setEditMode(true)}>Edit Profile</button>
          </div>
        ) : (
          <form onSubmit={updateProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-lable">Employee Number</label>
                <input type="text" className="milk-input" value={profile.employee_number || ""}
                  onChange={(e) => setProfile(p => ({...p, employee_number: e.target.value}))} required />
              </div>
              <div>
                <label className="form-lable">Gender</label>
                <select className="milk-input" value={profile.gender || ""}
                  onChange={(e) => setProfile(p => ({...p, gender: e.target.value}))} required>
                  <option value="">-- Select --</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="form-lable">Date of Birth</label>
                <input type="date" className="milk-input" value={profile.date_of_birth || ""}
                  onChange={(e) => setProfile(p => ({...p, date_of_birth: e.target.value}))} required />
              </div>
              <div>
                <label className="form-lable">Qualification</label>
                <input type="text" className="milk-input" value={profile.qualification || ""}
                  onChange={(e) => setProfile(p => ({...p, qualification: e.target.value}))} required />
              </div>
              <div>
                <label className="form-lable">National ID</label>
                <input type="text" className="milk-input" value={profile.national_id || ""}
                  onChange={(e) => setProfile(p => ({...p, national_id: e.target.value}))} required />
              </div>
              <div>
                <label className="form-lable">Employment Date</label>
                <input type="date" className="milk-input" value={profile.employment_date || ""}
                  onChange={(e) => setProfile(p => ({...p, employment_date: e.target.value}))} required />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button type="button" className="bg-gray-200 text-gray-800 px-4 py-3 rounded-lg font-medium hover:bg-gray-300"
                onClick={() => setEditMode(false)}>Cancel</button>
              <button type="submit" className="milk-btn" disabled={saving}>
                {saving && <ButtonSpinner />} Save Changes
              </button>
            </div>
          </form>
        )}
      </div>

      {/* --- CHANGE PASSWORD --- */}
      <div className="card">
        <button type="button" className="text-blue-600 font-medium"
          onClick={() => { setShowChangePassword(!showChangePassword); setShowForgotPassword(false); }}>
          {showChangePassword ? "Cancel Change Password" : "🔒 Change Password"}
        </button>

        {showChangePassword && (
          <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
            <div>
              <label className="form-lable">Current Password</label>
              <input type="password" className="milk-input" value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)} required />
            </div>
            <div>
              <label className="form-lable">New Password</label>
              <input type="password" className="milk-input" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            <div>
              <label className="form-lable">Confirm New Password</label>
              <input type="password" className="milk-input" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <button type="submit" className="milk-btn" disabled={saving}>
              {saving && <ButtonSpinner />} Update Password
            </button>
          </form>
        )}

        {/* --- FORGOT PASSWORD --- */}
        <div className="mt-3">
          <button type="button" className="text-sm text-gray-600 underline"
            onClick={() => { setShowForgotPassword(!showForgotPassword); setShowChangePassword(false); }}>
            Forgot password?
          </button>

          {showForgotPassword && (
            <form onSubmit={handleForgotPassword} className="mt-3 p-3 bg-gray-50 rounded-lg border">
              <p className="text-sm text-gray-600 mb-2">Enter your email — we’ll send a reset link:</p>
              <input type="email" className="milk-input mb-3" placeholder="Your email address"
                value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required />
              <button type="submit" className="milk-btn" disabled={saving}>
                {saving && <ButtonSpinner />} Send Reset Link
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;