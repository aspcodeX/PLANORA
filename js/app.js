
import { auth } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

import { listenTasks } from "./storage.js";

import {
  saveTask,
  deleteTask,
  toggleTask
} from "./crud.js";

import { renderStats } from "./dashboard.js";
import { filterTasks } from "./filters.js";
import { getCalendarTasks } from "./calendar.js";
import { formatDate, escapeHTML, showToast } from "./utils.js";

const $ = id => document.getElementById(id);

let currentUser = null;
let tasks = [];
let currentView = "overview";
let unsubscribe = null;

let searchText = "";
let statusFilter = "all";
let priorityFilter = "all";

const app = $("app");
const taskList = $("task-list");
const modal = $("task-modal");
const form = $("task-form");

// IMPORTANT: Keep modal closed when page loads.
modal.style.display = "none";

// AUTHENTICATION

onAuthStateChanged(auth, user => {
  if (!user) {
    if (unsubscribe) unsubscribe();
    window.location.replace("login.html");
    return;
  }

  currentUser = user;
  app.hidden = false;

  $("user-name").textContent = user.displayName || user.email;

  $("user-avatar").textContent =
    (user.displayName || user.email || "P")[0].toUpperCase();

  const hour = new Date().getHours();

  $("greeting").textContent =
    hour < 12 ? "Good morning." :
    hour < 17 ? "Good afternoon." :
    "Good evening.";

  startApp();
});

// START APPLICATION

function startApp() {
  if (unsubscribe) unsubscribe();

  unsubscribe = listenTasks(
    currentUser.uid,
    newTasks => {
      tasks = newTasks;
      render();
    },
    error => {
      console.error("Firestore error:", error);
      showToast("Unable to load your tasks.");
    }
  );
}

// RENDER TASKS

function render() {
  renderStats(tasks);

  const visibleTasks = filterTasks(tasks, {
    search: searchText,
    status: statusFilter,
    priority: priorityFilter,
    view: currentView
  });

  const titles = {
    overview: "Today's focus.",
    tasks: "All your tasks.",
    today: "Today's tasks.",
    upcoming: "Coming up.",
    completed: "Little wins."
  };

  $("view-title").textContent =
    titles[currentView] || "Your tasks.";

  if (currentView === "calendar") {
    renderCalendar();
    return;
  }

  if (!visibleTasks.length) {
    taskList.innerHTML = `
      <div class="empty-state">
        <span>✳</span>
        <h3>Nothing here yet.</h3>
        <p>Enjoy the space or create a new task.</p>
      </div>
    `;
    return;
  }

  taskList.innerHTML = visibleTasks.map(task => {
    const title = escapeHTML(task.title);
    const description = escapeHTML(task.description || "");

    return `
      <article class="task-card">

        <input
          class="task-check"
          type="checkbox"
          data-complete="${task.id}"
          ${task.status === "completed" ? "checked" : ""}
          aria-label="Mark task completed"
        >

        <div class="task-info">
          <h3>${title}</h3>
          <p>
            ${description || "No description"}
            · ${formatDate(task.dueDate)}
          </p>
        </div>

        <div class="task-meta">
          <span class="task-badge priority-${task.priority}">
            ${task.priority}
          </span>

          <span class="task-badge status-${task.status}">
            ${task.status}
          </span>
        </div>

        <div class="task-actions">
          <button data-edit="${task.id}">Edit</button>
          <button data-delete="${task.id}">Delete</button>
        </div>

      </article>
    `;
  }).join("");
}

// CALENDAR VIEW

function renderCalendar() {
  const grouped = getCalendarTasks(tasks);
  const dates = Object.keys(grouped).sort();

  if (!dates.length) {
    taskList.innerHTML = `
      <div class="empty-state">
        <span>▦</span>
        <h3>Your calendar is open.</h3>
        <p>Add due dates to see your schedule.</p>
      </div>
    `;
    return;
  }

  taskList.innerHTML = dates.map(date => `
    <div class="calendar-day">
      <h3>${formatDate(date)}</h3>

      ${grouped[date].map(task => `
        <article class="task-card">
          <div class="task-info">
            <h3>${escapeHTML(task.title)}</h3>
            <p>${escapeHTML(task.description || "")}</p>
          </div>

          <span class="task-badge status-${task.status}">
            ${task.status}
          </span>
        </article>
      `).join("")}
    </div>
  `).join("");
}

// MODAL FUNCTIONS

function openModal(task = null) {
  form.reset();

  $("task-id").value = task?.id || "";
  $("task-title").value = task?.title || "";
  $("task-description").value = task?.description || "";
  $("task-date").value = task?.dueDate || "";
  $("task-priority").value = task?.priority || "medium";
  $("task-status").value = task?.status || "pending";

  $("modal-title").textContent =
    task ? "Edit your task." : "Create a task.";

  modal.classList.remove("hidden");
  modal.style.display = "flex";

  $("task-title").focus();
}

function closeModal() {
  modal.classList.add("hidden");
  modal.style.display = "none";
  form.reset();
}

// New task button

$("add-task-btn").addEventListener("click", () => {
  openModal();
});

// Cross button

$("close-modal").addEventListener("click", closeModal);

// Outside click

modal.addEventListener("click", event => {
  if (event.target === modal) {
    closeModal();
  }
});

// Escape key

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && modal.style.display !== "none") {
    closeModal();
  }
});

// CREATE / UPDATE TASK

form.addEventListener("submit", async event => {
  event.preventDefault();

  if (!currentUser) return;

  const id = $("task-id").value;

  const data = {
    title: $("task-title").value.trim(),
    description: $("task-description").value.trim(),
    dueDate: $("task-date").value,
    priority: $("task-priority").value,
    status: $("task-status").value
  };

  if (!data.title) {
    showToast("Enter a task title.");
    return;
  }

  try {
    await saveTask(currentUser.uid, id, data);

    closeModal();
    showToast(id ? "Task updated!" : "Task created!");
  } catch (error) {
    console.error(error);
    showToast("Unable to save task.");
  }
});

// TASK ACTIONS

taskList.addEventListener("click", async event => {
  const button = event.target.closest("button");

  if (!button) return;

  const editId = button.dataset.edit;
  const deleteId = button.dataset.delete;

  if (editId) {
    const task = tasks.find(item => item.id === editId);

    if (task) openModal(task);
  }

  if (deleteId) {
    if (!confirm("Delete this task permanently?")) return;

    try {
      await deleteTask(currentUser.uid, deleteId);
      showToast("Task deleted.");
    } catch (error) {
      console.error(error);
      showToast("Unable to delete task.");
    }
  }
});

taskList.addEventListener("change", async event => {
  const id = event.target.dataset.complete;

  if (!id) return;

  const task = tasks.find(item => item.id === id);

  if (!task) return;

  try {
    await toggleTask(currentUser.uid, task);
    showToast("Task status updated.");
  } catch (error) {
    console.error(error);
    showToast("Unable to update task.");
  }
});

// SEARCH AND FILTERS

$("search-input").addEventListener("input", event => {
  searchText = event.target.value;
  render();
});

$("status-filter").addEventListener("change", event => {
  statusFilter = event.target.value;
  render();
});

$("priority-filter").addEventListener("change", event => {
  priorityFilter = event.target.value;
  render();
});

$("clear-search").addEventListener("click", () => {
  searchText = "";
  statusFilter = "all";
  priorityFilter = "all";

  $("search-input").value = "";
  $("status-filter").value = "all";
  $("priority-filter").value = "all";

  render();
});

// NAVIGATION

document.querySelectorAll("[data-view]").forEach(button => {
  button.addEventListener("click", () => {
    currentView = button.dataset.view;

    document.querySelectorAll("[data-view]").forEach(item => {
      item.classList.remove("active");
    });

    button.classList.add("active");
    render();
  });
});

document.querySelectorAll("[data-filter]").forEach(button => {
  button.addEventListener("click", () => {
    currentView = button.dataset.filter;

    document.querySelectorAll("[data-view]").forEach(item => {
      item.classList.remove("active");
    });

    render();
  });
});

// LOGOUT

$("logout-btn").addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.replace("login.html");
  } catch (error) {
    console.error(error);
    showToast("Logout failed.");
  }
});

// DARK MODE

$("theme-toggle").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

// PLANORA — SUBTLE CURSOR GLOW

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
);

const supportsFinePointer = window.matchMedia(
  "(hover: hover) and (pointer: fine)"
);

if (!prefersReducedMotion.matches && supportsFinePointer.matches) {
  const cursorGlow = document.createElement("div");

  cursorGlow.className = "planora-cursor-glow";
  cursorGlow.setAttribute("aria-hidden", "true");

  document.body.appendChild(cursorGlow);

  document.addEventListener("pointermove", event => {
    cursorGlow.style.left = `${event.clientX}px`;
    cursorGlow.style.top = `${event.clientY}px`;
  }, { passive: true });
}
