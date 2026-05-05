document.addEventListener("DOMContentLoaded", () => {

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

  const streakEl = document.getElementById("streak");
  const sessionsEl = document.getElementById("sessions");
  const xpEl = document.getElementById("xp");
  const levelEl = document.getElementById("level");
  const lastSessionEl = document.getElementById("lastSession");

  const goalText = document.getElementById("goalText");
  const progress = document.getElementById("progress");

  const levelFill = document.getElementById("levelFill");
  const levelProgress = document.getElementById("levelProgress");

  const logoutBtn = document.querySelector(".logout-btn");

  // ======================
  // INIT
  // ======================

  async function init() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      window.location.href = "auth.html";
      return;
    }

    await loadUserData(session.user);
  }

  // ======================
  // LOAD USER
  // ======================

  async function loadUserData(user) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error(error);
      return;
    }

    // ======================
    // BASIC UI
    // ======================

    streakEl.textContent = data.streak;
    sessionsEl.textContent = data.sessions;
    xpEl.textContent = data.xp + " XP";

    // ======================
    // LEVEL
    // ======================

    let level = Math.floor(data.xp / 100);
    let currentXP = data.xp % 100;

    levelEl.textContent = "Level " + level;
    levelFill.style.width = currentXP + "%";
    levelProgress.textContent = `${currentXP} / 100 XP`;

    // ======================
    // LAST SESSION
    // ======================

    let today = new Date().toDateString();

    if (data.last_date) {
      let yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (data.last_date === today) {
        lastSessionEl.textContent = "Last session: Today";
      } else if (data.last_date === yesterday.toDateString()) {
        lastSessionEl.textContent = "Last session: Yesterday";
      } else {
        lastSessionEl.textContent = "Last session: " + data.last_date;
      }
    }

    // ======================
    // 🔥 DAILY GOAL (SUPABASE)
    // ======================

    let dailySessions = data.daily_sessions || 0;

    // reset if new day
    if (data.last_date !== today) {
      dailySessions = 0;

      await supabase
        .from("profiles")
        .update({ daily_sessions: 0 })
        .eq("id", user.id);
    }

    let goal = 2;
    let percent = Math.min((dailySessions / goal) * 100, 100);

    goalText.textContent = `${dailySessions} / ${goal} sessions`;
    progress.style.width = percent + "%";
  }

  // ======================
  // LOGOUT
  // ======================

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Logout error:", error.message);
        return;
      }

      window.location.replace("/");
    });
  }

  // ======================
  // START
  // ======================

  init();

});