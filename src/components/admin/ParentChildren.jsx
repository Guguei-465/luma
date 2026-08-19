import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ParentChildren = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { parent, children } = location.state || {};

  if (!parent || !children) {
    return (
      <div className="p-6">
        <p className="text-gray-500">No data found. Go back and try again.</p>
        <button onClick={() => navigate(-1)} className="milk-btn mt-3">← Go Back</button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="text-teal-600 text-sm mb-3 inline-block">
          ← Back to Parents List
        </button>
        <h2 className="text-2xl font-bold text-gray-800">Children of {parent.first_name} {parent.last_name}</h2>
        <p className="text-gray-500 mt-1">{children.length} student{children.length !== 1 ? "s" : ""} linked</p>
      </div>

      {/* Children Table */}
      {children.length === 0 ? (
        <div className="card p-6 text-center text-gray-500">
          No students linked to this parent yet.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-600">Student Name</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-600">Admission No.</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-600">Class</th>
                  <th className="px-4 py-3 text-sm font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {children.map((child, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      {child.first_name} {child.last_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {child.admission_number || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded text-sm">
                        {child.classroom_name || "Not Assigned"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-0.5 rounded text-sm ${
                        child.status === "Active" 
                          ? "bg-green-50 text-green-700" 
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {child.status || "Unknown"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentChildren;