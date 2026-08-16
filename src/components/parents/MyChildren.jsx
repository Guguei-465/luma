import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import UserAvatar from "../UseAvata";
import api from "../api/api";

// Reusable Spinner
const Spinner = () => (
  <div className="flex justify-center items-center py-12">
    <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-green-600"></div>
  </div>
);

const MyChildren = () => {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchChildren = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);

      const res = await api.get("parents/children/");

      console.log("Children response:", res.data);

      setChildren(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load children:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          Failed to load your children. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h5 className="text-xl font-bold text-gray-800">
          My Children
        </h5>

        <p className="text-sm text-gray-500 mt-1">
          View all your registered children and their details.
        </p>
      </div>

      {/* Responsive Table / Card View */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

        {/* ================= DESKTOP / TABLE ================= */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Student
                </th>

                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Adm No.
                </th>

                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Assess No.
                </th>

                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Class
                </th>

                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Teacher
                </th>

                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Phone
                </th>

                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Attendance
                </th>

                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  CBC Grade
                </th>

                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Fee Balance
                </th>

                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Status
                </th>

                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {children.length === 0 ? (
                <tr>
                  <td
                    colSpan="11"
                    className="text-center py-10 text-gray-500"
                  >
                    No children registered under your account yet.
                  </td>
                </tr>
              ) : (
                children.map((child) => {
                  const studentId = child.student_id || child.id;

                  return (
                    <tr
                      key={studentId}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* Student */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            user={{
                              username: child.first_name,
                              profile_picture: child.photo,
                            }}
                            size={36}
                          />

                          <div>
                            <p className="font-medium text-gray-900">
                              {child.first_name} {child.last_name}
                            </p>

                            <p className="text-xs text-gray-500">
                              {child.grade} {child.stream}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Admission */}
                      <td className="px-3 py-3 text-gray-600">
                        {child.admission_number}
                      </td>

                      {/* Assessment */}
                      <td className="px-3 py-3 text-gray-600">
                        {child.assessment_number || "—"}
                      </td>

                      {/* Class */}
                      <td className="px-3 py-3 text-gray-600">
                        {child.grade} {child.stream}
                      </td>

                      {/* Teacher */}
                      <td className="px-3 py-3 text-gray-600">
                        {child.class_teacher || "—"}
                      </td>

                      {/* Phone */}
                      <td className="px-3 py-3 text-gray-600">
                        {child.teacher_phone || "—"}
                      </td>

                      {/* Attendance */}
                      <td className="px-3 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {child.attendance_percentage}%
                        </span>
                      </td>

                      {/* CBC Grade */}
                      <td className="px-3 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {child.latest_grade || "—"}
                        </span>
                      </td>

                      {/* Fee */}
                      <td className="px-3 py-3 font-semibold text-red-600">
                        KES{" "}
                        {Number(child.fee_balance || 0).toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            child.status === "Active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {child.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-3 py-3">
                        <Link
                          to={`/parent-dashboard/my-children/${studentId}`}
                          className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ================= MOBILE / CARD VIEW ================= */}
        <div className="md:hidden">
          {children.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No children registered under your account yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {children.map((child) => {
                const studentId = child.student_id || child.id;

                return (
                  <div
                    key={studentId}
                    className="p-4 space-y-3"
                  >
                    {/* Student Name & Avatar */}
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        user={{
                          username: child.first_name,
                          profile_picture: child.photo,
                        }}
                        size={40}
                      />

                      <div>
                        <p className="font-semibold text-gray-900">
                          {child.first_name} {child.last_name}
                        </p>

                        <p className="text-xs text-gray-500">
                          {child.grade} {child.stream} •{" "}
                          {child.admission_number}
                        </p>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">

                      {/* Assessment */}
                      <div>
                        <span className="text-gray-500">
                          Assess No:
                        </span>

                        <p className="font-medium">
                          {child.assessment_number || "—"}
                        </p>
                      </div>

                      {/* Teacher */}
                      <div>
                        <span className="text-gray-500">
                          Teacher:
                        </span>

                        <p className="font-medium">
                          {child.class_teacher || "—"}
                        </p>
                      </div>

                      {/* Attendance */}
                      <div>
                        <span className="text-gray-500">
                          Attendance:
                        </span>

                        <div className="mt-1">
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                            {child.attendance_percentage}%
                          </span>
                        </div>
                      </div>

                      {/* CBC Grade */}
                      <div>
                        <span className="text-gray-500">
                          CBC Grade:
                        </span>

                        <div className="mt-1">
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            {child.latest_grade || "—"}
                          </span>
                        </div>
                      </div>

                      {/* Fee Balance */}
                      <div>
                        <span className="text-gray-500">
                          Fee Balance:
                        </span>

                        <p className="font-semibold text-red-600">
                          KES{" "}
                          {Number(
                            child.fee_balance || 0
                          ).toLocaleString()}
                        </p>
                      </div>

                      {/* Status */}
                      <div>
                        <span className="text-gray-500">
                          Status:
                        </span>

                        <div className="mt-1">
                          <span
                            className={`px-2 py-0.5 rounded-full ${
                              child.status === "Active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {child.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Action Button */}
                    <Link
                      to={`/parent-dashboard/my-children/${studentId}`}
                      className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                    >
                      View Full Details
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyChildren;