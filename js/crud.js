
import {
  createTask,
  updateTask,
  removeTask
} from "./storage.js";

export async function saveTask(uid, id, data) {
  if (id) {
    await updateTask(uid, id, data);
  } else {
    await createTask(uid, data);
  }
}

export async function deleteTask(uid, id) {
  await removeTask(uid, id);
}

export async function toggleTask(uid, task) {
  const completed = task.status !== "completed";

  await updateTask(uid, task.id, {
    status: completed ? "completed" : "pending"
  });
}
