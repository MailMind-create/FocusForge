document.addEventListener("DOMContentLoaded", async () => {

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
// ELEMENTS
// ======================

const avgFocusEl =
  document.getElementById(
    "avgFocus"
  );

const avgEnergyEl =
  document.getElementById(
    "avgEnergy"
  );

const avgDistractionEl =
  document.getElementById(
    "avgDistraction"
  );

const bestCategoryEl =
  document.getElementById(
    "bestCategory"
  );

const reflectionFeed =
  document.getElementById(
    "reflectionFeed"
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

// ======================
// STATE
// ======================

let currentUser = null;

let sessions = [];

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

  currentUser = session.user;

  await checkMaxAccess();

  await loadSessions();

  renderAnalytics();

  renderReflections();
}

// ======================
// CHECK MAX
// ======================

async function checkMaxAccess() {

  const {
    data,
    error
  } =
    await supabase
      .from("profiles")
      .select("plan")
      .eq(
        "id",
        currentUser.id
      )
      .maybeSingle();

  if (error || !data) {

    showPopup(
      "Failed to load profile"
    );

    return;
  }

  if (
    data.plan !== "max"
  ) {

    showPopup(
      "VELYN MAX Feature"
    );

    setTimeout(() => {

      window.location.href =
        "app.html";

    }, 1800);
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
      .not(
        "focus_rating",
        "is",
        null
      )
      .order(
        "completed_at",
        {
          ascending: false
        }
      );

  if (error) {

    console.error(error);

    showPopup(
      "Failed to load analytics"
    );

    return;
  }

  sessions = data || [];
}

// ======================
// ANALYTICS
// ======================

function renderAnalytics() {

  if (
    sessions.length === 0
  ) {

    avgFocusEl.textContent =
      "--";

    avgEnergyEl.textContent =
      "--";

    avgDistractionEl.textContent =
      "--";

    bestCategoryEl.textContent =
      "--";

    return;
  }

  let totalFocus = 0;

  let totalEnergy = 0;

  let totalDistraction = 0;

  const categoryMap = {};

  sessions.forEach(session => {

    totalFocus +=
      session.focus_rating || 0;

    totalEnergy +=
      session.energy_rating || 0;

    totalDistraction +=
      session.distraction_level || 0;

    if (
      session.category
    ) {

      if (
        !categoryMap[
          session.category
        ]
      ) {

        categoryMap[
          session.category
        ] = {
          total: 0,
          count: 0
        };
      }

      categoryMap[
        session.category
      ].total +=
        session.focus_rating || 0;

      categoryMap[
        session.category
      ].count += 1;
    }
  });

  const avgFocus =
    (
      totalFocus /
      sessions.length
    ).toFixed(1);

  const avgEnergy =
    (
      totalEnergy /
      sessions.length
    ).toFixed(1);

  const avgDistraction =
    (
      totalDistraction /
      sessions.length
    ).toFixed(1);

  avgFocusEl.textContent =
    `${avgFocus}/5`;

  avgEnergyEl.textContent =
    `${avgEnergy}/5`;

  avgDistractionEl.textContent =
    `${avgDistraction}/5`;

  // ======================
  // BEST CATEGORY
  // ======================

  let bestCategory =
    "None";

  let bestScore = 0;

  Object.keys(
    categoryMap
  ).forEach(category => {

    const avg =
      categoryMap[
        category
      ].total /
      categoryMap[
        category
      ].count;

    if (
      avg > bestScore
    ) {

      bestScore = avg;

      bestCategory =
        category;
    }
  });

  bestCategoryEl.textContent =
    bestCategory;
}

// ======================
// REFLECTIONS
// ======================

function renderReflections() {

  reflectionFeed.innerHTML = "";

  if (
    sessions.length === 0
  ) {

    reflectionFeed.innerHTML = `

      <div class="reflection-card">

        <p class="reflection-text">
          No deep sessions yet.
        </p>

      </div>

    `;

    return;
  }

  sessions
    .slice(0, 12)
    .forEach(session => {

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "reflection-card";

      const date =
        new Date(
          session.completed_at
        );

      card.innerHTML = `

        <div class="reflection-card-top">

          <span class="reflection-category">
            ${session.category || "General"}
          </span>

          <span class="reflection-date">
            ${date.toLocaleDateString()}
          </span>

        </div>

        <div class="reflection-stats">

          <div class="stat-pill">
            Focus:
            ${session.focus_rating || "-"}/5
          </div>

          <div class="stat-pill">
            Energy:
            ${session.energy_rating || "-"}/5
          </div>

          <div class="stat-pill">
            Distraction:
            ${session.distraction_level || "-"}/5
          </div>

          <div class="stat-pill">
            ${Math.round(session.duration || 0)} min
          </div>

        </div>

        <p class="reflection-text">
          ${session.reflection || "No reflection written."}
        </p>

      `;

      reflectionFeed.appendChild(
        card
      );
    });
}

// ======================
// POPUP
// ======================

function showPopup(text) {

  popupText.textContent =
    text;

  popup.classList.add(
    "show"
  );
}

popupBtn.onclick = () => {

  popup.classList.remove(
    "show"
  );
};

// ======================
// START
// ======================

init();

});