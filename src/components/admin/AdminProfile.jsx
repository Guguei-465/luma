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
  // ✅ Matches same shape: top-level profile fields + nested user object
  const [profile, setProfile] = useState({
    id: null,
    department: "",
    employee_id: "",
    user: {
      first_name: "",
      last_name: "",
      email: "",
      phone_number: "",
      role: "",
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editMode, setEditMode] = useState(false);

  // --- Password states — EXACT same as Parent/Teacher ---
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
const [forgotEmail, setForgotEmail] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const { user: authUser } = useContext(AuthContext);

  // --- Fetch Profile — uses current user id from auth context ---
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const id = authUser?.id;
      const { data } = await api.get(id ? `accounts/users/${id}/` : "accounts/users/"); // ✅ Uses current user endpoint
      console.log("Raw Admin Profile data:", data);
      // Safe array-or-object handling
      const singleProfile = Array.isArray(data) ? data[0] : data;
      setProfile(singleProfile || {
        id: null, department:"", employee_id:"", user:{}
      });
    } catch (err) {
      console.error("Profile load error:", err.response?.data || err.message);
      setError("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Update handler: correctly update nested user fields ---
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    if(["first_name","last_name","email","phone_number","role"].includes(name)){
      setProfile(prev => ({
        ...prev,
        user: { ...prev.user, [name]: value }
      }));
    } else {
      setProfile(prev => ({ ...prev, [name]: value }));
    }
  };

  // --- Update Profile — same PUT logic ---
  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!profile.id) throw new Error("Profile ID missing — cannot update");
      console.log("Updating admin profile:", profile);

await api.put(
        profile.id ? `accounts/users/${profile.id}/update/` : "accounts/users/",
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

  // --- Change Password — identical logic ---
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

  // --- Forgot Password — identical logic ---
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
      {/* Header with Avatar — same usage */}
      <div className="card flex items-center gap-4">
        <UserAvatar user={profile.user} size={65} />
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Admin Profile</h1>
          <p className="text-gray-500 mt-1 text-sm">View and update your personal & official details</p>
        </div>
      </div>

      {/* Status messages — same styling */}
      {error && <div className="card bg-red-50 border border-red-200 text-red-700 p-4">{error}</div>}
      {success && <div className="card bg-green-50 border border-green-200 text-green-700 p-4">{success}</div>}

      {/* --- Main Profile Info — view & edit mode --- */}
      <div className="card">
        {!editMode ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">First Name</p>
                <p className="font-medium text-gray-800">{profile.user?.first_name || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Name</p>
                <p className="font-medium text-gray-800">{profile.user?.last_name || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email Address</p>
                <p className="font-medium text-gray-800">{profile.user?.email || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone Number</p>
                <p className="font-medium text-gray-800">{profile.user?.phone_number || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-medium text-gray-800">{profile.department || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Employee / Staff ID</p>
                <p className="font-medium text-gray-800">{profile.employee_id || "—"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">System Role</p>
                <p className="font-medium text-gray-800 capitalize">{profile.user?.role || "Admin"}</p>
              </div>
            </div>
            <button className="milk-btn mt-4" onClick={() => setEditMode(true)}>Edit Profile</button>
          </div>
        ) : (
          <form onSubmit={updateProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-lable">First Name</label>
                <input type="text" className="milk-input" 
                  name="first_name"
                  value={profile.user?.first_name || ""}
                  onChange={handleProfileChange} required />
              </div>
              <div>
                <label className="form-lable">Last Name</label>
                <input type="text" className="milk-input" 
                  name="last_name"
                  value={profile.user?.last_name || ""}
                  onChange={handleProfileChange} required />
              </div>
              <div>
                <label className="form-lable">Email Address</label>
                <input type="email" className="milk-input" 
                  name="email"
                  value={profile.user?.email || ""}
                  onChange={handleProfileChange} required />
              </div>
              <div>
                <label className="form-lable">Phone Number</label>
                <input type="tel" className="milk-input" 
                  name="phone_number"
                  value={profile.user?.phone_number || ""}
                  onChange={handleProfileChange} />
              </div>
              <div>
                <label className="form-lable">Department</label>
                <input type="text" className="milk-input" 
                  name="department"
                  value={profile.department || ""}
                  onChange={handleProfileChange} />
              </div>
              <div>
                <label className="form-lable">Employee / Staff ID</label>
                <input type="text" className="milk-input" 
                  name="employee_id"
                  value={profile.employee_id || ""}
                  onChange={handleProfileChange} />
              </div>
              <div className="md:col-span-2">
                <label className="form-lable">System Role</label>
                <input type="text" className="milk-input" 
                  name="role"
                  value={profile.user?.role || "Admin"} readOnly />
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

      {/* --- CHANGE PASSWORD — identical toggle & form --- */}
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

        {/* --- FORGOT PASSWORD — identical section --- */}
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