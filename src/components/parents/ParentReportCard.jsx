import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import UserAvatar from "../UseAvata";
import api from "../api/api";

const Spinner = () => (
  <div className="flex justify-center items-center py-12">
    <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-green-600"></div>
  </div>
);

const getArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const ParentReportCard = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const academicYear = "2026";
  const term = "Term 1";

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      console.log("📤 Fetching parent children...");
      const childrenResponse = await api.get("dashboard/parent/children/");
      console.log("✅ RAW children response:", childrenResponse.data);
      const children = getArray(childrenResponse.data);
      console.log("👶 Children extracted:", children);

      if (children.length === 0) {
        setReports([]);
        return;
      }

      const reportRequests = children.map(async (child) => {
        try {
          const studentId = child.id;
          const response = await api.get(
            `results/report-card/${studentId}/${academicYear}/${encodeURIComponent(term)}/`
          );
          return {
            child,
            report: response.data,
            hasResults: Array.isArray(response.data?.subjects) && response.data.subjects.length > 0,
          };
        } catch {
          return { child, report: null, hasResults: false };
        }
      });

      const results = await Promise.all(reportRequests);
      const normalizedReports = results.map(({ child, report, hasResults }) => {
        const student = report?.student || child;
        return {
          student_id: child.id,
          first_name: child.first_name || student.first_name || "",
          last_name: child.last_name || student.last_name || "",
          admission_number: child.admission_number || student.admission_number || "—",
          classroom: child.classroom_name || student.classroom || "—",
          academic_year: academicYear,
          term: term,
          subjects: report?.subjects || [],
          summary: report?.summary || {},
          hasResults,
        };
      });
      setReports(normalizedReports);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  if (loading) return <Spinner />;
  if (error) return (
    <div className="p-4">
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
        <p className="font-medium">Failed to load report cards.</p>
        <button onClick={fetchReports} className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg">Try Again</button>
      </div>
    </div>
  );

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <div className="mb-4 md:mb-6">
        <h3 className="text-lg md:text-xl font-bold text-gray-800">Report Cards</h3>
        <p className="text-sm text-gray-500 mt-1">View report cards for your children.</p>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-6 sm:p-10 text-center">
          <h4 className="font-semibold text-gray-700">No children found</h4>
          <p className="text-sm text-gray-500 mt-1">No students linked to your account yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-gray-600">Student</th>
                  <th className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-gray-600">Year</th>
                  <th className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-gray-600">Term</th>
                  <th className="px-3 md:px-4 py-3 text-left text-xs font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.student_id} className="hover:bg-gray-50">
                    <td className="px-3 md:px-4 py-3 md:py-4">
                      <div className="flex items-center">
                        <UserAvatar user={{ username: report.first_name }} size={40} />
                        <div className="ml-3">
                          <div className="font-semibold text-gray-900 text-sm">
                            {report.first_name} {report.last_name}
                          </div>
                          <div className="text-xs text-gray-500">{report.classroom}</div>
                          <div className="text-xs text-gray-400">Adm: {report.admission_number}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 md:px-4 py-3 md:py-4 text-gray-600 text-sm">{report.academic_year}</td>
                    <td className="px-3 md:px-4 py-3 md:py-4 text-gray-600 text-sm">{report.term}</td>
                    <td className="px-3 md:px-4 py-3 md:py-4">
                      <Link
                        to={`/parent-dashboard/report-card/${report.student_id}/${report.academic_year}/${encodeURIComponent(report.term)}`}
                        className="bg-blue-600 text-white rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {reports.map((report) => (
              <div key={report.student_id} className="p-4">
                <div className="flex items-start gap-3">
                  <UserAvatar user={{ username: report.first_name }} size={45} />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900">
                      {report.first_name} {report.last_name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">{report.classroom}</p>
                    <p className="text-xs text-gray-400">Adm: {report.admission_number}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {report.academic_year} • {report.term}
                    </p>
                  </div>
                  <Link
                    to={`/parent-dashboard/report-card/${report.student_id}/${report.academic_year}/${encodeURIComponent(report.term)}`}
                    className="bg-blue-600 text-white rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap self-center"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentReportCard;