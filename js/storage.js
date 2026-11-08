
import { db } from "./firebase.js";

import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

function taskCollection(uid) {
  return collection(db, "users", uid, "tasks");
}

export function listenTasks(uid, callback, onError) {
  const q = query(taskCollection(uid));

  return onSnapshot(q, snapshot => {
    const tasks = snapshot.docs.map(item => ({
      id: item.id,
      ...item.data()
    }));

    callback(tasks);
  }, onError);
}

export async function createTask(uid, data) {
  return addDoc(taskCollection(uid), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function updateTask(uid, id, data) {
  return updateDoc(doc(db, "users", uid, "tasks", id), {
    ...data,
    updatedAt: serverTimestamp()
  });
}

export async function removeTask(uid, id) {
  return deleteDoc(doc(db, "users", uid, "tasks", id));
}
