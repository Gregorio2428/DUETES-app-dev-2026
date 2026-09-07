"use strict";

/* ==========================================================
   tasque — script.js
   Sections:
     1. State (single source of truth)
     2. DOM references
     3. Persistence (Local Storage)
     4. Rendering
     5. Task operations (add / toggle / delete)
     6. Form handling + validation
     7. Delete All (async, simulated loading)
     8. Init
   ========================================================== */

/* ---------- 1. State ---------- */
const STORAGE_KEY = "tasque:tasks";
let tasks = [];

/* ---------- 2. DOM references ---------- */
const form = document.getElementById("task-form");
const input = document.getElementById("task-input");
const errorMsg = document.getElementById("error-msg");
const list = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");
const taskCount = document.getElementById("task-count");
const deleteAllBtn = document.getElementById("delete-all-btn");

/* ---------- 3. Persistence (Local Storage) ---------- */
function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    tasks = raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load tasks from storage:", e);
    tasks = [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error("Failed to save tasks to storage:", e);
  }
}

/* ---------- 4. Rendering ---------- */
function render() {
  list.innerHTML = "";

  emptyState.style.display = tasks.length === 0 ? "block" : "none";

  tasks.forEach(function (task) {
    list.appendChild(buildTaskElement(task));
  });

  updateTaskCount();
}

function buildTaskElement(task) {
  const li = document.createElement("li");
  li.className = "task-item";
  li.dataset.id = task.id;

  const checkBtn = document.createElement("button");
  checkBtn.type = "button";
  checkBtn.className = "task-check" + (task.done ? " checked" : "");
  checkBtn.setAttribute("aria-label", task.done ? "Mark as not done" : "Mark as done");
  checkBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="4 12 9 18 20 6"/></svg>';
  checkBtn.addEventListener("click", function () { toggleDone(task.id); });

  const span = document.createElement("span");
  span.className = "task-text" + (task.done ? " done" : "");
  span.textContent = task.text;

  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.className = "task-delete";
  delBtn.setAttribute("aria-label", "Delete task");
  delBtn.textContent = "✕";
  delBtn.addEventListener("click", function () { deleteTask(task.id); });

  li.appendChild(checkBtn);
  li.appendChild(span);
  li.appendChild(delBtn);
  return li;
}

function updateTaskCount() {
  const count = tasks.length;
  const doneCount = tasks.filter(function (t) { return t.done; }).length;
  taskCount.textContent = count === 0
    ? "0 tasks"
    : count + " task" + (count === 1 ? "" : "s") + " · " + doneCount + " done";
}

/* ---------- 5. Task operations ---------- */
function addTask(text) {
  const task = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    text: text,
    done: false
  };
  tasks.push(task);
  saveTasks();
  render();
}

function toggleDone(id) {
  const task = tasks.find(function (t) { return t.id === id; });
  if (!task) return;
  task.done = !task.done;
  saveTasks();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter(function (t) { return t.id !== id; });
  saveTasks();
  render();
}

/* ---------- 6. Form handling + validation ---------- */
function showError(message) {
  errorMsg.textContent = message;
  input.classList.remove("shake");
  void input.offsetWidth; // restart animation
  input.classList.add("shake");
  setTimeout(function () { input.classList.remove("shake"); }, 400);
}

function clearError() {
  errorMsg.textContent = "";
}

form.addEventListener("submit", function (event) {
  event.preventDefault(); // stop default browser form submission (page reload)

  const value = input.value.trim();

  if (value === "") {
    showError("Type something before adding a task.");
    return;
  }

  clearError();
  addTask(value);
  input.value = "";
  input.focus();
});

input.addEventListener("input", function () {
  if (input.value.trim() !== "") clearError();
});

/* ---------- 7. Delete All (async, simulated loading) ---------- */
function deleteAllTasks() {
  return new Promise(function (resolve) {
    setTimeout(function () {
      tasks = [];
      saveTasks();
      resolve();
    }, 2000);
  });
}

deleteAllBtn.addEventListener("click", async function () {
  if (tasks.length === 0 || deleteAllBtn.classList.contains("loading")) return;

  deleteAllBtn.classList.add("loading");
  deleteAllBtn.disabled = true;

  await deleteAllTasks();

  render();
  deleteAllBtn.classList.remove("loading");
  deleteAllBtn.disabled = false;
});

/* ---------- 8. Init ---------- */
loadTasks();
render();