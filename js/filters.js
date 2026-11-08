
export function filterTasks(tasks, options = {}) {
  const {
    search = "",
    status = "all",
    priority = "all",
    view = "overview"
  } = options;

  const today = new Date().toLocaleDateString("en-CA");

  return tasks.filter(task => {

    const searchMatch =
      `${task.title} ${task.description || ""}`
        .toLowerCase()
        .includes(search.toLowerCase());

    const statusMatch =
      status === "all" || task.status === status;

    const priorityMatch =
      priority === "all" || task.priority === priority;

    let viewMatch = true;

    if (view === "today") {
      viewMatch = task.dueDate === today;
    }

    if (view === "upcoming") {
      viewMatch =
        task.dueDate &&
        task.dueDate > today &&
        task.status !== "completed";
    }

    if (view === "completed") {
      viewMatch = task.status === "completed";
    }

    return searchMatch && statusMatch && priorityMatch && viewMatch;
  });
}
