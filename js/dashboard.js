
export function renderStats(tasks) {
  const total = tasks.length;

  const completed = tasks.filter(
    task => task.status === "completed"
  ).length;

  const progress = tasks.filter(
    task => task.status === "progress"
  ).length;

  const overdue = tasks.filter(task =>
    task.dueDate &&
    task.dueDate < new Date().toLocaleDateString("en-CA") &&
    task.status !== "completed"
  ).length;

  document.getElementById("total-count").textContent = total;
  document.getElementById("completed-count").textContent = completed;
  document.getElementById("progress-count").textContent = progress;
  document.getElementById("overdue-count").textContent = overdue;
}
