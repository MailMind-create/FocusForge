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
  // STATE
  // ======================

  let currentUser = null;

  let isMax = false;

  let allSessions = [];

  // ======================
  // ELEMENTS
  // ======================

  const menuBtn =
    document.getElementById(
      "menuBtn"
    );

  const dropdownMenu =
    document.getElementById(
      "dropdownMenu"
    );

  const logoutBtn =
    document.querySelector(
      ".logout-btn"
    );

  const lockedWrapper =
    document.getElementById(
      "lockedWrapper"
    );

  const historyContainer =
    document.getElementById(
      "historyContainer"
    );

  const sessionList =
    document.getElementById(
      "sessionList"
    );

  const emptyState =
    document.getElementById(
      "emptyState"
    );

  const searchInput =
    document.getElementById(
      "searchInput"
    );

  const categoryFilter =
    document.getElementById(
      "categoryFilter"
    );

  const popup =
    document.getElementById(
      "popup"
    );

  const popupText =
    document.getElementById(
      "popupText"
    );

  const popupBtn =
    document.getElementById(
      "popupBtn"
    );

  const upgradeBtn =
    document.getElementById(
      "upgradeBtn"
    );

  // ======================
  // MENU
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

    await loadProfile();

    if (isMax) {

      await loadSessions();
    }
  }

  // ======================
  // LOAD PROFILE
  // ======================

  async function loadProfile() {

    const {
      data,
      error
    } =
      await supabase
        .from("profiles")
        .select("*")
        .eq(
          "id",
          currentUser.id
        )
        .single();

    if (error) {

      console.error(error);

      return;
    }

    isMax =
      data.plan === "max";

    // ======================
    // SHOW/HIDE UI
    // ======================

    if (isMax) {

      lockedWrapper.style.display =
        "none";

      historyContainer.style.display =
        "block";

    } else {

      lockedWrapper.style.display =
        "flex";

      historyContainer.style.display =
        "none";
    }
  }

  // ======================
  // LOAD SESSIONS
  // ======================

  async function loadSessions() {

    const {
      data,
      error
    } =
      await supabase
        .from("focus_sessions")
        .select("*")
        .eq(
          "user_id",
          currentUser.id
        )
        .order(
          "completed_at",
          { ascending: false }
        );

    if (error) {

      console.error(error);

      return;
    }

    allSessions =
      data || [];

    renderSessions(
      allSessions
    );
  }

  // ======================
  // RENDER SESSIONS
  // ======================

  function renderSessions(
    sessions
  ) {

    sessionList.innerHTML = "";

    if (
      sessions.length === 0
    ) {

      emptyState.style.display =
        "flex";

      return;
    }

    emptyState.style.display =
      "none";

    sessions.forEach(
      session => {

        const card =
          document.createElement(
            "div"
          );

        card.className =
          "session-card";

        const completedDate =
          new Date(
            session.completed_at
          );

        const formattedDate =
          completedDate.toLocaleDateString(
            "en-US",
            {

              month: "long",

              day: "numeric",

              year: "numeric"

            }
          );

        card.innerHTML = `

          <div class="session-top">

            <div>

              <span class="session-category">
                ${
                  session.category ||
                  "Focus Session"
                }
              </span>

              <h3>
                ${
                  session.duration
                } Minute Session
              </h3>

            </div>

            <div class="session-xp">
              +${
                session.xp_earned || 0
              } XP
            </div>

          </div>

          <div class="session-meta">

            <span>
              🎯 Focus:
              ${
                session.focus_rating ??
                "-"
              }
            </span>

            <span>
              ⚡ Energy:
              ${
                session.energy_rating ??
                "-"
              }
            </span>

            <span>
              📵 Distraction:
              ${
                session.distraction_level ??
                "-"
              }
            </span>

          </div>

          ${
            session.intention
              ? `
            <div class="session-intention">
              ${session.intention}
            </div>
          `
              : ""
          }

          ${
            session.reflection
              ? `
            <div class="session-reflection">
              ${session.reflection}
            </div>
          `
              : ""
          }

          <div class="session-date">
            ${formattedDate}
          </div>

        `;

        sessionList.appendChild(
          card
        );
      }
    );
  }

  // ======================
  // FILTER
  // ======================

  function filterSessions() {

    const search =
      searchInput.value
        .toLowerCase()
        .trim();

    const category =
      categoryFilter.value;

    const filtered =
      allSessions.filter(
        session => {

          const reflection =
            (
              session.reflection ||
              ""
            ).toLowerCase();

          const intention =
            (
              session.intention ||
              ""
            ).toLowerCase();

          const sessionCategory =
            (
              session.category ||
              ""
            ).toLowerCase();

          const matchesSearch =

            reflection.includes(
              search
            ) ||

            intention.includes(
              search
            ) ||

            sessionCategory.includes(
              search
            );

          const matchesCategory =

            !category ||

            session.category ===
              category;

          return (
            matchesSearch &&
            matchesCategory
          );
        }
      );

    renderSessions(
      filtered
    );
  }

  // ======================
  // EVENTS
  // ======================

  if (
    searchInput
  ) {

    searchInput.addEventListener(
      "input",
      filterSessions
    );
  }

  if (
    categoryFilter
  ) {

    categoryFilter.addEventListener(
      "change",
      filterSessions
    );
  }

  // ======================
  // UPGRADE BUTTON
  // ======================

  if (
    upgradeBtn
  ) {

    upgradeBtn.addEventListener(
      "click",
      () => {

        showPopup(
          "VELYN MAX upgrades coming soon."
        );
      }
    );
  }

  // ======================
  // POPUP
  // ======================

  function showPopup(
    text
  ) {

    popupText.textContent =
      text;

    popup.classList.add(
      "show"
    );
  }

  if (
    popupBtn
  ) {

    popupBtn.onclick = () => {

      popup.classList.remove(
        "show"
      );
    };
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
            error
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