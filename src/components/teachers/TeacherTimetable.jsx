import { useEffect, useState, useCallback } from "react";
import api from "../api/api";

// ─── SPINNER ───
const Spinner = () => (
  <div className="flex justify-center items-center h-80">
    <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-green-600"></div>
  </div>
);

// ─── Helper: Format time (remove seconds) ───
const formatTime = (timeStr) => {
  if (!timeStr) return "—";
  return timeStr.slice(0, 5); // "08:20:00" → "08:20"
};

// ─── TEACHER TIMETABLE ───
const TeacherTimetable = () => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTimetable = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("timetable/my-timetable/");
      const list = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
      setTimetable(list);
    } catch (err) {
      console.error("Timetable error:", err.response?.data || err.message);
      setError("Failed to load your timetable. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  if (loading) return <Spinner />;

  if (error)
    return (
      <div className="p-4 md:p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          {error}
        </div>
      </div>
    );

  const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const groupedByDay = {};

  timetable.forEach((lesson) => {
    const day = String(lesson.day_display || lesson.day || "").trim();
    if (!day) return;
    if (!groupedByDay[day]) groupedByDay[day] = [];
    groupedByDay[day].push(lesson);
  });

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="card">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">My Timetable</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Weekly schedule created by Academic Coordinator
        </p>
      </div>

      {timetable.length === 0 ? (
        <div className="card text-center py-10 text-gray-500">
          No timetable entries have been assigned yet.
        </div>
      ) : (
        <div className="space-y-4">
          {daysOrder.map((day) => {
            const lessons = groupedByDay[day];
            if (!lessons || lessons.length === 0) return null;

            return (
              <div key={day} className="card">
                <h2 className="text-lg font-semibold text-green-700 mb-3 border-b pb-2 border-gray-100">
                  {day}
                </h2>
                <div className="space-y-3">
                  {lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                    >
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {lesson.subject_name || "—"}
                        </h3>
                        {/* ✅ Uses EXACT fields from your API — no more "Room: —" */}
                        <p className="text-sm text-gray-500">
                          Class: {lesson.classroom_name || "—"}
                          {" • "}Term: {lesson.term || "—"}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="font-medium text-gray-700">
                          {formatTime(lesson.start_time)} – {formatTime(lesson.end_time)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeacherTimetable;