import { useEffect, useState, useCallback, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/api";
import UserAvatar from "../UseAvata";

const Spinner = () => (
  <div className="flex justify-center items-center h-80">
    <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-green-600"></div>
  </div>
);

const ButtonSpinner = () => (
  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
);

const AdminProfile = () => {
  // accounts/users/<id>/ returns a FLAT CustomUser object —
  // there is no nested "profile" for SUPER_ADMIN, since
  // SUPER_ADMIN has no dedicated profile model on the backend.
  const [profile, setProfile] = useState({
    id: null,
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    role: "",
  });
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

  const { user: authUser } = useContext(AuthContext);

  // --- Fetch Profile ---
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const id = authUser?.id;
      if (!id) {
        setError("Could not determine the logged-in user.");
        return;
      }
      const { data } = await api.get(`accounts/users/${id}/`);
      setProfile(data);
    } catch (err) {
      console.error("Profile load error:", err.response?.data || err.message);
      setError("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  // --- Update Profile ---
  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!profile.id) throw new Error("Profile ID missing — cannot update");

      await api.put(`accounts/users/${profile.id}/update/`, {
        username: profile.username,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone_number: profile.phone_number,
        role: profile.role,
      });

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

  // --- Change Password ---
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (newPassword !== confirmPassword) return setError("New passwords do NOT match!");
    if (newPassword.length < 6) return setError("Password must be at least 6 characters");

    try {
      setSaving(true);
      await api.post("accounts/change-password/", {
        old_password: oldPassword,
        new_password: newPassword
      });
      setSuccess("Password changed successfully!");
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
      setShowChangePassword(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to change password. Check old password.");
    } finally {
      setSaving(false);
    }
  };

  // --- Forgot Password ---
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      setSaving(true);
      await api.post("accounts/password/reset/", { email: forgotEmail });
      setSuccess("If this email is registered, check your inbox/spam for reset link!");
      setForgotEmail("");
      setShowForgotPassword(false);
    } catch (err) {
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
      {/* Header with Avatar */}
      <div className="card flex items-center gap-4">
        <UserAvatar user={profile} size={65} />
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Admin Profile</h1>
          <p className="text-gray-500 mt-1 text-sm">View and update your personal details</p>
        </div>
      </div>

      {/* Status messages */}
      {error && <div className="card bg-red-50 border border-red-200 text-red-700 p-4">{error}</div>}
      {success && <div className="card bg-green-50 border border-green-200 text-green-700 p-4">{success}</div>}

      {/* Main Profile Info */}
      <div className="card">
        {!editMode ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">First Name</p>
                <p className="font-medium text-gray-800">{profile.first_name || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Name</p>
                <p className="font-medium text-gray-800">{profile.last_name || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Username</p>
                <p className="font-medium text-gray-800">{profile.username || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email Address</p>
                <p className="font-medium text-gray-800">{profile.email || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone Number</p>
                <p className="font-medium text-gray-800">{profile.phone_number || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">System Role</p>
                <p className="font-medium text-gray-800 capitalize">{profile.role || "Admin"}</p>
              </div>
            </div>
            <button className="milk-btn mt-4" onClick={() => setEditMode(true)}>Edit Profile</button>
          </div>
        ) : (
          <form onSubmit={updateProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">First Name</label>
                <input type="text" className="milk-input"
                  name="first_name"
                  value={profile.first_name || ""}
                  onChange={handleProfileChange} required />
              </div>
              <div>
                <label className="form-label">Last Name</label>
                <input type="text" className="milk-input"
                  name="last_name"
                  value={profile.last_name || ""}
                  onChange={handleProfileChange} required />
              </div>
              <div>
                <label className="form-label">Username</label>
                <input type="text" className="milk-input"
                  name="username"
                  value={profile.username || ""}
                  onChange={handleProfileChange} required />
              </div>
              <div>
                <label className="form-label">Email Address</label>
                <input type="email" className="milk-input"
                  name="email"
                  value={profile.email || ""}
                  onChange={handleProfileChange} required />
              </div>
              <div>
                <label className="form-label">Phone Number</label>
                <input type="tel" className="milk-input"
                  name="phone_number"
                  value={profile.phone_number || ""}
                  onChange={handleProfileChange} />
              </div>
              <div>
                <label className="form-label">System Role</label>
                <input type="text" className="milk-input"
                  value={profile.role || "Admin"} readOnly disabled />
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

      {/* CHANGE PASSWORD */}
      <div className="card">
        <button type="button" className="text-blue-600 font-medium"
          onClick={() => { setShowChangePassword(!showChangePassword); setShowForgotPassword(false); }}>
          {showChangePassword ? "Cancel Change Password" : "🔒 Change Password"}
        </button>

        {showChangePassword && (
          <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
            <div>
              <label className="form-label">Current Password</label>
              <input type="password" className="milk-input" value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)} required />
            </div>
            <div>
              <label className="form-label">New Password</label>
              <input type="password" className="milk-input" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            <div>
              <label className="form-label">Confirm New Password</label>
              <input type="password" className="milk-input" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <button type="submit" className="milk-btn" disabled={saving}>
              {saving && <ButtonSpinner />} Update Password
            </button>
          </form>
        )}

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

export default AdminProfile;
