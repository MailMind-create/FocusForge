document.addEventListener("DOMContentLoaded", () => {

// ======================
// SUPABASE
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

const weeklyHoursEl = document.getElementById("weeklyHours");
const todaySessionsEl = document.getElementById("todaySessions");
const weekSessionsEl = document.getElementById("weekSessions");
const bestDayEl = document.getElementById("bestDay");

const allTimeSessionsEl = document.getElementById("allTimeSessions");
const currentStreakEl = document.getElementById("currentStreak");
const totalXPEl = document.getElementById("totalXP");

const emptyState = document.getElementById("emptyState");

// ======================
// INIT
// ======================

init();

async function init() {

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = "auth.html";
    return;
  }

  const user = session.user;

  await loadAnalytics(user.id);
}

// ======================
// LOAD ANALYTICS
// ======================

async function loadAnalytics(userId) {

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  const { data: sessions, error } = await supabase
    .from("focus_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("completed_at", { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  if (!sessions || sessions.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  // ======================
  // PROFILE STATS
  // ======================

  allTimeSessionsEl.textContent = profile.sessions;
  currentStreakEl.textContent = profile.streak;
  totalXPEl.textContent = profile.xp;

  // ======================
  // DATE SETUP
  // ======================

  const now = new Date();
  const today = new Date();

  const weekAgo = new Date();
  weekAgo.setDate(now.getDate() - 7);

  // ======================
  // WEEK FILTER
  // ======================

  const weekSessions = sessions.filter(session => {
    return new Date(session.completed_at) >= weekAgo;
  });

  // ======================
  // TODAY SESSIONS
  // ======================

  const todaySessions = sessions.filter(session => {

    const d = new Date(session.completed_at);

    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  });

  todaySessionsEl.textContent = todaySessions.length;
  weekSessionsEl.textContent = weekSessions.length;

  // ======================
  // WEEKLY HOURS
  // ======================

  const totalMinutes = weekSessions.reduce((sum, session) => {
    return sum + session.duration;
  }, 0);

  const totalHours = (totalMinutes / 60).toFixed(1);

  weeklyHoursEl.textContent = `${totalHours}h`;

  // ======================
  // WEEKDAY DATA
  // ======================

  const days = [0,0,0,0,0,0,0];

  weekSessions.forEach(session => {

    const d = new Date(session.completed_at);

    let day = d.getDay();

    // convert sunday-start to monday-start
    day = day === 0 ? 6 : day - 1;

    days[day] += session.duration;
  });

  // ======================
  // CHART
  // ======================

  const max = Math.max(...days, 1);

  days.forEach((minutes, index) => {

    const height = (minutes / max) * 220;

    const bar = document.getElementById(`bar${index}`);

    bar.style.height = `${height}px`;
  });

  // ======================
  // BEST DAY
  // ======================

  const labels = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ];

  const bestIndex = days.indexOf(Math.max(...days));

  bestDayEl.textContent = labels[bestIndex];

}

});