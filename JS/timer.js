document.addEventListener("DOMContentLoaded", () => {

// ======================
// SUPABASE
// ======================

const SUPABASE_URL = "https://eztflaqhcamoftvosegx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6dGZsYXFoY2Ftb2Z0dm9zZWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzUzNDAsImV4cCI6MjA5MzQxMTM0MH0.beBy1rIxqy0Y70IkB8-tZCs9RlZcMFn4bPaYL_Rqw14";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

// CANVAS
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
// INIT
// ======================

async function init() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = "auth.html";
    return;
  }

  currentUser = session.user;
  await loadUser();
  updateDisplay();
}

// ======================
// LOAD USER
// ======================

async function loadUser() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (error) {
    console.error("Load error:", error);
    return;
  }

  if (!data) {
    const { error: insertError } = await supabase.from("profiles").insert({
      id: currentUser.id,
      email: currentUser.email,
      sessions: 0,
      streak: 0,
      xp: 0,
      last_date: null,
      daily_sessions: 0
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      return;
    }

    return loadUser();
  }

  userData = data;
  updateStatsUI();
}

// ======================
// UI
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
// TIMER
// ======================

function startTimer() {
  if (interval) return;

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

// ======================
// BUTTONS
// ======================

mainBtn.onclick = () => {
  if (!isRunning) startTimer();
  else showEndState();
};

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
// CONFETTI
// ======================

function fireConfetti() {
  if (!canvas || !ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  let particles = [];

  for (let i = 0; i < 120; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 4 + 2,
      speedY: Math.random() * 4 + 2,
      speedX: Math.random() * 2 - 1
    });
  }

  let start = Date.now();

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      ctx.fillStyle = Math.random() > 0.5 ? "#4A6CFF" : "#6C3DFF";
      ctx.fillRect(p.x, p.y, p.size, p.size);
      p.y += p.speedY;
      p.x += p.speedX;
    });

    if (Date.now() - start < 1200) {
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  animate();
}

// ======================
// EFFECTS
// ======================

function showXP(amount) {
  const el = document.createElement("div");
  el.className = "xp-float";
  el.textContent = `+${amount} XP`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

function playSound() {
  const audio = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");
  audio.volume = 0.6;
  audio.play().catch(() => {});
}

// ======================
// YES (UPDATED)
// ======================

yesBtn.addEventListener("click", async () => {

  await loadUser();
  if (!userData) return;

  let today = new Date().toDateString();
  let earnedXP = getXP();

  let { sessions, streak, xp, last_date, daily_sessions = 0 } = userData;

  let prevLevel = Math.floor(xp / 100);

  sessions++;
  xp += earnedXP;
  daily_sessions++;

  if (last_date !== today) {
    let y = new Date();
    y.setDate(y.getDate() - 1);

    streak = (last_date === y.toDateString()) ? streak + 1 : 1;
    last_date = today;
    daily_sessions = 1;
  }

  const { error } = await supabase
    .from("profiles")
    .update({ sessions, streak, xp, last_date, daily_sessions })
    .eq("id", currentUser.id);

  if (error) {
    console.error(error);
    return;
  }

  // ======================
  // SAVE SESSION HISTORY
  // ======================

  const { error: sessionError } = await supabase
    .from("focus_sessions")
    .insert({
      user_id: currentUser.id,
      duration: selectedTime / 60,
      xp_earned: earnedXP
    });

  if (sessionError) {
    console.error("Session history error:", sessionError);
  }

  await loadUser();

  fireConfetti();
  showXP(earnedXP);
  playSound();

  showPopup(prevLevel < Math.floor(userData.xp / 100)
    ? "🔥 LEVEL UP!"
    : `🔥 +${earnedXP} XP`
  );

  resetSession();
});

// ======================
// NO
// ======================

noBtn.addEventListener("click", () => {

  endState.style.display = "none";
  mainBtn.style.display = "block";

  if (interval) clearInterval(interval);

  isRunning = true;
  mainBtn.textContent = "End Session";

  interval = setInterval(() => {
    time--;
    updateDisplay();

    if (time <= 0) showEndState();
  }, 1000);
});

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
// XP
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
  popupText.textContent = text;
  popup.classList.add("show");
}

popupBtn.onclick = () => popup.classList.remove("show");

// ======================
// START
// ======================

init();

});