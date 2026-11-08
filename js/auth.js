
import { auth, googleProvider } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

const $ = (id) => document.getElementById(id);

const loginForm = $("login-form");
const signupForm = $("signup-form");
const resetForm = $("reset-form");

let authActionInProgress = false;


// ======================================
// MESSAGE HANDLER
// ======================================

function showMessage(message, type = "error") {
  const box = $("message");

  box.textContent = message;
  box.className = `message ${type}`;
}


// ======================================
// REDIRECT
// ======================================

function goToDashboard() {
  window.location.replace("index.html");
}


// ======================================
// AUTH MODE SWITCHER
// ======================================

function setMode(mode) {

  loginForm.classList.toggle("hidden", mode !== "login");
  signupForm.classList.toggle("hidden", mode !== "signup");
  resetForm.classList.toggle("hidden", mode !== "reset");

  $("divider").classList.toggle("hidden", mode === "reset");
  $("google-btn").classList.toggle("hidden", mode === "reset");
  $("switch-text").classList.toggle("hidden", mode === "reset");

  $("auth-title").textContent =
    mode === "login"
      ? "Welcome back."
      : mode === "signup"
        ? "Join PLANORA."
        : "Reset password.";

  $("auth-subtitle").textContent =
    mode === "login"
      ? "Let's get things done today."
      : mode === "signup"
        ? "Create your personal workspace."
        : "We'll send you a password reset link.";

  $("message").textContent = "";

  if (mode === "login") {
    $("switch-text").innerHTML =
      `Don't have an account?
       <button type="button" id="switch-auth">Create account</button>`;
  }

  if (mode === "signup") {
    $("switch-text").innerHTML =
      `Already have an account?
       <button type="button" id="switch-auth">Sign in</button>`;
  }

  const switchButton = $("switch-auth");

  if (switchButton) {
    switchButton.addEventListener("click", () => {
      setMode(mode === "login" ? "signup" : "login");
    });
  }
}


// ======================================
// INITIAL MODE
// ======================================

setMode("login");


// ======================================
// FORGOT PASSWORD NAVIGATION
// ======================================

$("forgot-btn").addEventListener("click", () => {

  $("reset-email").value = $("login-email").value.trim();

  setMode("reset");

});

$("back-login").addEventListener("click", () => {
  setMode("login");
});


// ======================================
// SIGNUP
// ======================================

signupForm.addEventListener("submit", async (e) => {

  e.preventDefault();

  if (authActionInProgress) return;

  const name = $("signup-name").value.trim();
  const email = $("signup-email").value.trim();
  const password = $("signup-password").value;

  if (!name) {
    return showMessage("Please enter your name.");
  }

  if (password.length < 8) {
    return showMessage("Password must be at least 8 characters.");
  }

  authActionInProgress = true;

  try {

    const credential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    await updateProfile(credential.user, {
      displayName: name
    });

    showMessage("Account created! Opening PLANORA...", "success");

    goToDashboard();

  } catch (error) {

    authActionInProgress = false;

    showMessage(getAuthError(error));

  }

});


// ======================================
// LOGIN
// ======================================

loginForm.addEventListener("submit", async (e) => {

  e.preventDefault();

  if (authActionInProgress) return;

  const email = $("login-email").value.trim();
  const password = $("login-password").value;

  authActionInProgress = true;

  try {

    await setPersistence(
      auth,
      $("remember").checked
        ? browserLocalPersistence
        : browserSessionPersistence
    );

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    showMessage("Login successful! Opening PLANORA...", "success");

    goToDashboard();

  } catch (error) {

    authActionInProgress = false;

    showMessage(getAuthError(error));

  }

});


// ======================================
// GOOGLE LOGIN
// ======================================

$("google-btn").addEventListener("click", async () => {

  if (authActionInProgress) return;

  authActionInProgress = true;

  try {

    await signInWithPopup(auth, googleProvider);

    showMessage("Google login successful!", "success");

    goToDashboard();

  } catch (error) {

    authActionInProgress = false;

    showMessage(getAuthError(error));

  }

});


// ======================================
// FORGOT PASSWORD
// ======================================

resetForm.addEventListener("submit", async (e) => {

  e.preventDefault();

  const email = $("reset-email").value.trim();

  try {

    await sendPasswordResetEmail(auth, email);

    showMessage(
      "If an account exists for that email, a reset link will be sent.",
      "success"
    );

  } catch (error) {

    if (error.code === "auth/invalid-email") {
      showMessage("Please enter a valid email address.");
    } else {
      showMessage("Unable to process request. Please try again.");
    }

  }

});


// ======================================
// LOGOUT
// ======================================

export async function logoutUser() {

  try {

    await signOut(auth);

    window.location.replace("login.html");

  } catch (error) {

    console.error("Logout error:", error);

  }

}


// ======================================
// FRIENDLY FIREBASE ERRORS
// ======================================

function getAuthError(error) {

  const errors = {

    "auth/invalid-email":
      "Please enter a valid email address.",

    "auth/email-already-in-use":
      "This email is already registered.",

    "auth/weak-password":
      "Please choose a stronger password.",

    "auth/invalid-credential":
      "Incorrect email or password.",

    "auth/user-disabled":
      "This account has been disabled.",

    "auth/too-many-requests":
      "Too many attempts. Please try again later.",

    "auth/network-request-failed":
      "Check your internet connection.",

    "auth/popup-closed-by-user":
      "Google sign-in was cancelled.",

    "auth/popup-blocked":
      "Your browser blocked the Google sign-in popup.",

    "auth/unauthorized-domain":
      "This website domain is not authorized in Firebase."

  };

  return errors[error.code] ||
    "Something went wrong. Please try again.";

}


// ======================================
// AUTOMATIC LOGIN REDIRECT
// ======================================

onAuthStateChanged(auth, (user) => {

  const isLoginPage =
    window.location.pathname.endsWith("login.html");

  if (
    user &&
    isLoginPage &&
    !authActionInProgress
  ) {

    goToDashboard();

  }

});
