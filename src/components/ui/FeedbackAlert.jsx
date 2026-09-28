import { useEffect, useState } from "react";

/**
 * FeedbackAlert — reusable inline success/error banner with auto-dismiss.
 *
 * Props:
 *  - type: "success" | "error"
 *  - message: string (the text to display)
 *  - onDismiss: optional callback fired when the banner is dismissed
 *  - autoHide: number ms to auto-hide (default 4000, pass 0 to disable)
 */
const FeedbackAlert = ({ type = "success", message, onDismiss, autoHide = 4000 }) => {
  const [dismissed, setDismissed] = useState(false);

  // Auto-dismiss timer — only runs when a message is present
  useEffect(() => {
    if (!message || autoHide === 0) return;
    const timer = setTimeout(() => {
      setDismissed(true);
      if (onDismiss) onDismiss();
    }, autoHide);
    return () => clearTimeout(timer);
  }, [message, autoHide, onDismiss]);

  if (dismissed || !message) return null;

  const isSuccess = type === "success";
  const base = isSuccess
    ? "bg-green-50 border-green-200 text-green-700"
    : "bg-red-50 border-red-200 text-red-700";
  const icon = isSuccess ? "bi-check-circle-fill" : "bi-exclamation-circle-fill";

  return (
    <div className={`card flex items-start justify-between gap-3 border p-4 rounded ${base}`}>
      <div className="flex items-center gap-2">
        <i className={`bi ${icon}`}></i>
        <span className="font-medium">{message}</span>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="text-gray-400 hover:text-gray-700 text-xl leading-none ml-4"
        aria-label="Dismiss"
      >
        &times;
      </button>
    </div>
  );
};

export default FeedbackAlert;
