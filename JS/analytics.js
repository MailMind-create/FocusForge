document.addEventListener("DOMContentLoaded", () => {

// ======================
// SUPABASE
// ======================

const SUPABASE_URL =
  "https://eztflaqhcamoftvosegx.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6dGZsYXFoY2Ftb2Z0dm9zZWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzUzNDAsImV4cCI6MjA5MzQxMTM0MH0.beBy1rIxqy0Y70IkB8-tZCs9RlZcMFn4bPaYL_Rqw14";

const supabase =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

// ======================
// PREMIUM
// ======================

let isMax = false;

// ======================
// ELEMENTS
// ======================

const weeklyHoursEl =
  document.getElementById(
    "weeklyHours"
  );

const todaySessionsEl =
  document.getElementById(
    "todaySessions"
  );

const weekSessionsEl =
  document.getElementById(
    "weekSessions"
  );

const bestDayEl =
  document.getElementById(
    "bestDay"
  );

const allTimeSessionsEl =
  document.getElementById(
    "allTimeSessions"
  );

const currentStreakEl =
  document.getElementById(
    "currentStreak"
  );

const totalXPEl =
  document.getElementById(
    "totalXP"
  );

const emptyState =
  document.getElementById(
    "emptyState"
  );

// ======================
// MAX ELEMENTS
// ======================

const maxWrapper =
  document.querySelector(
    ".max-wrapper"
  );

const lockOverlay =
  document.querySelector(
    ".lock-overlay"
  );

const consistencyScoreEl =
  document.getElementById(
    "consistencyScore"
  );

const peakFocusDayEl =
  document.getElementById(
    "peakFocusDay"
  );

const momentumTrendEl =
  document.getElementById(
    "momentumTrend"
  );

const heatmapCells =
  document.querySelectorAll(
    ".heatmap-cell"
  );

// ======================
// INIT
// ======================

init();

async function init() {

  const {
    data: { session }
  } =
    await supabase.auth.getSession();

  if (!session) {

    window.location.href =
      "auth.html";

    return;
  }

  const user = session.user;

  await loadAnalytics(user.id);
}

// ======================
// LOAD ANALYTICS
// ======================

async function loadAnalytics(userId) {

  // ======================
  // PROFILE
  // ======================

  const {
    data: profile,
    error: profileError
  } =
    await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

  if (
    profileError ||
    !profile
  ) {

    console.error(profileError);

    return;
  }

  // ======================
  // MAX CHECK
  // ======================

  isMax =
    profile.plan === "max";

  // ======================
  // LOCK SYSTEM
  // ======================

  if (isMax) {

    maxWrapper?.classList.remove(
      "locked"
    );

    if (lockOverlay) {

      lockOverlay.style.display =
        "none";
    }

  } else {

    maxWrapper?.classList.add(
      "locked"
    );
  }

  // ======================
  // SESSIONS
  // ======================

  const {
    data: sessions,
    error
  } =
    await supabase
      .from("focus_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("completed_at", {
        ascending: true
      });

  if (error) {

    console.error(error);

    return;
  }

  // ======================
  // EMPTY STATE
  // ======================

  if (
    !sessions ||
    sessions.length === 0
  ) {

    emptyState.style.display =
      "block";

    return;
  }

  // ======================
  // PROFILE STATS
  // ======================

  allTimeSessionsEl.textContent =
    profile.sessions || 0;

  currentStreakEl.textContent =
    profile.streak || 0;

  totalXPEl.textContent =
    profile.xp || 0;

  // ======================
  // DATE SETUP
  // ======================

  const now =
    new Date();

  const today =
    new Date();

  const weekAgo =
    new Date();

  weekAgo.setDate(
    now.getDate() - 7
  );

  // ======================
  // WEEK SESSIONS
  // ======================

  const weekSessions =
    sessions.filter(session => {

      return (
        new Date(
          session.completed_at
        ) >= weekAgo
      );
    });

  // ======================
  // TODAY SESSIONS
  // ======================

  const todaySessions =
    sessions.filter(session => {

      const d =
        new Date(
          session.completed_at
        );

      return (

        d.getDate() ===
        today.getDate()

        &&

        d.getMonth() ===
        today.getMonth()

        &&

        d.getFullYear() ===
        today.getFullYear()

      );
    });

  todaySessionsEl.textContent =
    todaySessions.length;

  weekSessionsEl.textContent =
    weekSessions.length;

  // ======================
  // WEEKLY HOURS
  // ======================

  const totalMinutes =
    weekSessions.reduce(
      (sum, session) => {

        return (
          sum +
          (session.duration || 0)
        );

      }, 0
    );

  const totalHours =
    (
      totalMinutes / 60
    ).toFixed(1);

  weeklyHoursEl.textContent =
    `${totalHours}h`;

  // ======================
  // WEEKDAY DATA
  // ======================

  const days =
    [0,0,0,0,0,0,0];

  weekSessions.forEach(session => {

    const d =
      new Date(
        session.completed_at
      );

    let day =
      d.getDay();

    day =
      day === 0
        ? 6
        : day - 1;

    days[day] +=
      session.duration || 0;
  });

  // ======================
  // CHART
  // ======================

  const max =
    Math.max(...days, 1);

  days.forEach(
    (minutes, index) => {

      const height =
        (minutes / max) * 220;

      const bar =
        document.getElementById(
          `bar${index}`
        );

      if (bar) {

        bar.style.height =
          `${height}px`;
      }
    }
  );

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

  const bestIndex =
    days.indexOf(
      Math.max(...days)
    );

  bestDayEl.textContent =
    labels[bestIndex];

  // ======================
  // MAX ANALYTICS
  // ======================

  if (isMax) {

    loadAdvancedAnalytics(
      sessions,
      days,
      labels
    );
  }

  console.log(
    "Analytics loaded"
  );
}

// ======================
// ADVANCED ANALYTICS
// ======================

function loadAdvancedAnalytics(
  sessions,
  days,
  labels
) {

  // ======================
  // CONSISTENCY SCORE
  // ======================

  let activeDays = 0;

  days.forEach(day => {

    if (day > 0) {

      activeDays++;
    }
  });

  const consistency =
    Math.floor(
      (activeDays / 7) * 100
    );

  if (
    consistencyScoreEl
  ) {

    consistencyScoreEl.textContent =
      `${consistency}%`;
  }

  // ======================
  // PEAK DAY
  // ======================

  const peakIndex =
    days.indexOf(
      Math.max(...days)
    );

  if (
    peakFocusDayEl
  ) {

    peakFocusDayEl.textContent =
      labels[peakIndex];
  }

  // ======================
  // MOMENTUM
  // ======================

  const firstHalf =
    days[0] +
    days[1] +
    days[2];

  const secondHalf =
    days[4] +
    days[5] +
    days[6];

  let momentum =
    "Stable";

  if (
    secondHalf >
    firstHalf + 30
  ) {

    momentum =
      "Rising";
  }

  if (
    secondHalf <
    firstHalf - 30
  ) {

    momentum =
      "Dropping";
  }

  if (
    momentumTrendEl
  ) {

    momentumTrendEl.textContent =
      momentum;
  }

  // ======================
  // HEATMAP
  // ======================

  heatmapCells.forEach(cell => {

    cell.classList.remove(
      "active",
      "medium",
      "low"
    );
  });

  const recentSessions =
    sessions.slice(-21);

  recentSessions.forEach(
    (session, index) => {

      if (
        !heatmapCells[index]
      ) return;

      const minutes =
        session.duration || 0;

      if (minutes >= 45) {

        heatmapCells[index]
          .classList.add(
            "active"
          );

      } else if (
        minutes >= 20
      ) {

        heatmapCells[index]
          .classList.add(
            "medium"
          );

      } else {

        heatmapCells[index]
          .classList.add(
            "low"
          );
      }
    }
  );
}

});