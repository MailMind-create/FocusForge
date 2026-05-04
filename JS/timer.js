// ======================
// SUPABASE SETUP
// ======================

const SUPABASE_URL = "https://eztflaqhcamoftvosegx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6dGZsYXFoY2Ftb2Z0dm9zZWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzUzNDAsImV4cCI6MjA5MzQxMTM0MH0.beBy1rIxqy0Y70IkB8-tZCs9RlZcMFn4bPaYL_Rqw14";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ======================
// ELEMENTS
// ======================

const timerDisplay = document.getElementById("timer");
const mainBtn = document.getElementById("mainBtn");
const taskInput = document.querySelector(".task-input");
const endState = document.getElementById("endState");

const yesBtn = document.querySelector(".yes");
const noBtn = document.querySelector(".no");

const streakEl = document.getElementById("streak");
const sessionsEl = document.getElementById("sessions");
const xpEl = document.getElementById("xp");
const levelEl = document.getElementById("level");

const popup = document.getElementById("popup");
const popupText = document.getElementById("popupText");
const popupBtn = document.getElementById("popupBtn");

const timeButtons = document.querySelectorAll(".time-select button");

const canvas = document.getElementById("confetti");
const ctx = canvas ? canvas.getContext("2d") : null;

// ======================
// STATE
// ======================

let selectedTime = 1500;
let time = selectedTime;
let interval = null;
let isRunning = false;

let userData = null;
let currentUser = null;

// ======================
// INIT (PROTECTED)
// ======================

async function init() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = "auth.html";
    return;
  }

  currentUser = session.user;
  await loadUser();
}

// ======================
// LOAD USER
// ======================

async function loadUser() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .single();

  if (error) {
    console.error(error);
    return;
  }

  userData = data;
  updateStatsUI();
}

// ======================
// BASIC
// ======================

function formatTime(s) {
  let m = Math.floor(s / 60);
  let sec = s % 60;
  return `${m}:${sec < 10 ? "0" : ""}${sec}`;
}

function updateDisplay() {
  timerDisplay.textContent = formatTime(time);
}

function updateStatsUI() {
  if (!userData) return;

  streakEl.textContent = `🔥 Streak: ${userData.streak}`;
  sessionsEl.textContent = `Sessions: ${userData.sessions}`;
  xpEl.textContent = `XP: ${userData.xp}`;
  levelEl.textContent = `Level: ${Math.floor(userData.xp / 100)}`;
}

// ======================
// XP SYSTEM
// ======================

function getXP() {
  if (selectedTime === 900) return 30;
  if (selectedTime === 1500) return 50;
  if (selectedTime === 2700) return 90;
  return 50;
}

// ======================
// POPUP
// ======================

function showPopup(text) {
  if (!popup) return;
  popupText.textContent = text;
  popup.classList.add("show");
}

if (popupBtn) {
  popupBtn.onclick = () => popup.classList.remove("show");
}

// ======================
// SOUND
// ======================

function playSound() {
  new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg").play();
}

// ======================
// TIME SELECT
// ======================

timeButtons.forEach(btn => {
  btn.onclick = () => {
    if (isRunning) return;

    timeButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    selectedTime = parseInt(btn.dataset.time);
    time = selectedTime;

    updateDisplay();
  };
});

// ======================
// TIMER
// ======================

function startTimer() {
  if (!taskInput.value.trim()) {
    showPopup("Enter a task first");
    return;
  }

  isRunning = true;
  mainBtn.textContent = "End Session";

  interval = setInterval(() => {
    time--;
    updateDisplay();

    if (time <= 0) showEndState();
  }, 1000);
}

function showEndState() {
  clearInterval(interval);
  interval = null;

  isRunning = false;
  mainBtn.style.display = "none";
  endState.style.display = "block";
}

mainBtn.onclick = () => {
  if (!isRunning) startTimer();
  else showEndState();
};

// ======================
// YES (COMPLETE SESSION)
// ======================

yesBtn.onclick = async () => {
  clearInterval(interval);

  let today = new Date().toDateString();
  let earnedXP = getXP();

  let { sessions, streak, xp, last_date } = userData;

  // 🔥 LEVEL CHECK (before update)
  let prevLevel = Math.floor(xp / 100);

  if (last_date !== today) {
    sessions++;

    let y = new Date();
    y.setDate(y.getDate() - 1);

    streak = (last_date === y.toDateString()) ? streak + 1 : 1;

    xp += earnedXP;
    last_date = today;
  }

  // 🔥 LEVEL AFTER
  let newLevel = Math.floor(xp / 100);

  await supabase
    .from("profiles")
    .update({
      sessions,
      streak,
      xp,
      last_date
    })
    .eq("id", currentUser.id);

  // update local state
  Object.assign(userData, { sessions, streak, xp, last_date });

  updateStatsUI();

  // 🔥 FEEDBACK
  if (newLevel > prevLevel) {
    showPopup("🔥 LEVEL UP!");
  } else {
    showPopup(`🔥 +${earnedXP} XP`);
  }

  playSound();

  resetSession();
};

// ======================
// NO (FAIL)
// ======================

noBtn.onclick = async () => {
  await supabase
    .from("profiles")
    .update({ streak: 0 })
    .eq("id", currentUser.id);

  userData.streak = 0;

  updateStatsUI();
  showPopup("Streak reset");

  resetSession();
};

// ======================
// RESET
// ======================

function resetSession() {
  clearInterval(interval);

  isRunning = false;
  time = selectedTime;

  updateDisplay();

  mainBtn.style.display = "block";
  mainBtn.textContent = "Start Session";
  endState.style.display = "none";

  taskInput.value = "";
}

// ======================
// INIT
// ======================

updateDisplay();
init();