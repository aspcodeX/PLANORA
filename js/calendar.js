
export function getCalendarTasks(tasks) {
  const grouped = {};

  tasks.forEach(task => {
    if (!task.dueDate) return;

    if (!grouped[task.dueDate]) {
      grouped[task.dueDate] = [];
    }

    grouped[task.dueDate].push(task);
  });

  return grouped;
}
