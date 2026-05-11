document.addEventListener("DOMContentLoaded", () => {

  // ======================
  // SUPABASE SETUP
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
  // STATE
  // ======================

  let isMax = false;

  let currentUser = null;

  // ======================
  // ELEMENTS
  // ======================

  const streakEl =
    document.getElementById(
      "streak"
    );

  const sessionsEl =
    document.getElementById(
      "sessions"
    );

  const xpEl =
    document.getElementById(
      "xp"
    );

  const levelEl =
    document.getElementById(
      "level"
    );

  const lastSessionEl =
    document.getElementById(
      "lastSession"
    );

  const goalText =
    document.getElementById(
      "goalText"
    );

  const progress =
    document.getElementById(
      "progress"
    );

  const levelFill =
    document.getElementById(
      "levelFill"
    );

  const levelProgress =
    document.getElementById(
      "levelProgress"
    );

  const streakFreezeEl =
    document.getElementById(
      "streakFreeze"
    );

  const logoutBtn =
    document.querySelector(
      ".logout-btn"
    );

  const usernameDisplay =
    document.getElementById(
      "usernameDisplay"
    );

  // ======================
  // MENU
  // ======================

  const menuBtn =
    document.getElementById(
      "menuBtn"
    );

  const dropdownMenu =
    document.getElementById(
      "dropdownMenu"
    );

  // ======================
  // MAX LINKS
  // ======================

  const plannerLink =
    document.getElementById(
      "plannerLink"
    );

  const historyLink =
    document.getElementById(
      "historyLink"
    );

  const insightsLink =
    document.getElementById(
      "insightsLink"
    );

  // ======================
  // MENU TOGGLE
  // ======================

  if (
    menuBtn &&
    dropdownMenu
  ) {

    menuBtn.addEventListener(
      "click",
      () => {

        dropdownMenu.classList.toggle(
          "show"
        );
      }
    );

    document.addEventListener(
      "click",
      event => {

        const clickedInside =
          dropdownMenu.contains(
            event.target
          ) ||
          menuBtn.contains(
            event.target
          );

        if (
          !clickedInside
        ) {

          dropdownMenu.classList.remove(
            "show"
          );
        }
      }
    );
  }

  // ======================
  // INIT
  // ======================

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

    currentUser =
      session.user;

    await loadUserData(
      currentUser
    );

    setupMaxLinks();
  }

  // ======================
  // LOAD USER
  // ======================

  async function loadUserData(
    user
  ) {

    const {
      data,
      error
    } =
      await supabase
        .from("profiles")
        .select("*")
        .eq(
          "id",
          user.id
        )
        .single();

    if (error) {

      console.error(
        error
      );

      return;
    }

    // ======================
    // PLAN
    // ======================

    isMax =
      data.plan === "max";

    // ======================
    // USERNAME
    // ======================

    if (
      usernameDisplay
    ) {

      usernameDisplay.textContent =
        data.username ||
        "User";
    }

    // ======================
    // STATS
    // ======================

    streakEl.textContent =
      data.streak || 0;

    sessionsEl.textContent =
      data.sessions || 0;

    xpEl.textContent =
      `${data.xp || 0} XP`;

    // ======================
    // STREAK FREEZES
    // ======================

    if (
      streakFreezeEl
    ) {

      streakFreezeEl.textContent =
        data.streak_freezes || 0;
    }

    // ======================
    // LEVEL
    // ======================

    const level =
      Math.floor(
        (data.xp || 0) / 100
      );

    const currentXP =
      (data.xp || 0) % 100;

    levelEl.textContent =
      `Level ${level}`;

    if (
      levelFill
    ) {

      levelFill.style.width =
        `${currentXP}%`;
    }

    if (
      levelProgress
    ) {

      levelProgress.textContent =
        `${currentXP} / 100 XP`;
    }

    // ======================
    // LAST SESSION
    // ======================

    const today =
      new Date()
        .toDateString();

    if (
      data.last_date
    ) {

      const yesterday =
        new Date();

      yesterday.setDate(
        yesterday.getDate() - 1
      );

      if (
        data.last_date ===
        today
      ) {

        lastSessionEl.textContent =
          "Last session: Today";

      } else if (
        data.last_date ===
        yesterday.toDateString()
      ) {

        lastSessionEl.textContent =
          "Last session: Yesterday";

      } else {

        lastSessionEl.textContent =
          `Last session: ${data.last_date}`;
      }

    } else {

      lastSessionEl.textContent =
        "Last session: -";
    }

    // ======================
    // DAILY GOAL
    // ======================

    let dailySessions =
      data.daily_sessions || 0;

    if (
      data.last_date !== today
    ) {

      dailySessions = 0;

      await supabase
        .from("profiles")
        .update({

          daily_sessions: 0

        })
        .eq(
          "id",
          user.id
        );
    }

    const dailyGoal = 2;

    const percent =
      Math.min(
        (
          dailySessions /
          dailyGoal
        ) * 100,
        100
      );

    goalText.textContent =
      `${dailySessions} / ${dailyGoal} sessions`;

    progress.style.width =
      `${percent}%`;

    // ======================
    // MAX UI
    // ======================

    updateMaxUI();

    console.log(
      "MAX USER:",
      isMax
    );
  }

  // ======================
  // MAX UI
  // ======================

  function updateMaxUI() {

    const maxLockedLinks =
      document.querySelectorAll(
        ".max-link"
      );

    maxLockedLinks.forEach(
      link => {

        if (isMax) {

          link.classList.remove(
            "max-locked"
          );

        } else {

          link.classList.add(
            "max-locked"
          );
        }
      }
    );
  }

  // ======================
  // MAX LINKS
  // ======================

  function setupMaxLinks() {

    const maxLinks = [

      plannerLink,
      historyLink,
      insightsLink

    ];

    maxLinks.forEach(
      link => {

        if (!link)
          return;

        link.addEventListener(
          "click",
          event => {

            if (!isMax) {

              event.preventDefault();

              showMaxPopup();
            }
          }
        );
      }
    );
  }

  // ======================
  // MAX POPUP
  // ======================

  function showMaxPopup() {

    alert(
      "This is a VELYN MAX feature."
    );
  }

  // ======================
  // LOGOUT
  // ======================

  if (
    logoutBtn
  ) {

    logoutBtn.addEventListener(
      "click",
      async () => {

        const {
          error
        } =
          await supabase.auth.signOut();

        if (error) {

          console.error(
            "Logout error:",
            error.message
          );

          return;
        }

        window.location.replace(
          "/"
        );
      }
    );
  }

  // ======================
  // START
  // ======================

  init();

});
