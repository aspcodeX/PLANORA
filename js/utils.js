
export function formatDate(date) {
  if (!date) return "No deadline";

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) return "Invalid date";

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

export function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

export function showToast(text) {
  const toast = document.getElementById("toast");

  toast.textContent = text;
  toast.classList.add("show");

  setTimeout(() => toast.classList.remove("show"), 2500);
}
