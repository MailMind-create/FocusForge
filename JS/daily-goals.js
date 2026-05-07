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

const subjectInput = document.getElementById("subjectInput");

const hoursInput = document.getElementById("hoursInput");

const minutesInput = document.getElementById("minutesInput");

const createGoalBtn = document.getElementById("createGoalBtn");

const goalsContainer = document.getElementById("goalsContainer");

const emptyState = document.getElementById("emptyState");

// ======================
// STATE
// ======================

let currentUser = null;

// ======================
// INIT
// ======================

init();

async function init() {

  const { data: { session } } =
    await supabase.auth.getSession();

  if (!session) {
    window.location.href = "auth.html";
    return;
  }

  currentUser = session.user;

  await loadGoals();
}

// ======================
// LOAD GOALS
// ======================

async function loadGoals() {

  const { data, error } = await supabase
    .from("study_subjects")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  renderGoals(data || []);
}

// ======================
// RENDER GOALS
// ======================

function renderGoals(goals) {

  goalsContainer.innerHTML = "";

  if (goals.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  goals.forEach(goal => {

    const progress =
      Math.min(
        (goal.studied_minutes / goal.daily_goal_minutes) * 100,
        100
      );

    const studiedHours =
      formatMinutes(goal.studied_minutes);

    const goalHours =
      formatMinutes(goal.daily_goal_minutes);

    const card = document.createElement("div");

    card.className = "goal-card";

    card.innerHTML = `
    
      <div class="goal-top">

        <h2>${goal.subject_name}</h2>

        <button
          class="delete-btn"
          data-id="${goal.id}"
        >
          Delete
        </button>

      </div>

      <p class="goal-progress-text">
        ${studiedHours} / ${goalHours}
      </p>

      <div class="progress-bar">
        <div
          class="progress-fill"
          style="width: ${progress}%"
        ></div>
      </div>

    `;

    goalsContainer.appendChild(card);
  });

  addDeleteEvents();
}

// ======================
// CREATE GOAL
// ======================

createGoalBtn.addEventListener("click", async () => {

  const subject =
    subjectInput.value.trim();

  const hours =
    parseInt(hoursInput.value) || 0;

  const minutes =
    parseInt(minutesInput.value) || 0;

  const totalMinutes =
    (hours * 60) + minutes;

  if (!subject) {
    alert("Enter a goal name");
    return;
  }

  if (totalMinutes <= 0) {
    alert("Set a valid time goal");
    return;
  }

  const { error } = await supabase
    .from("study_subjects")
    .insert({

      user_id: currentUser.id,

      subject_name: subject,

      daily_goal_minutes: totalMinutes,

      studied_minutes: 0

    });

  if (error) {
    console.error(error);
    return;
  }

  subjectInput.value = "";

  hoursInput.value = 1;

  minutesInput.value = 0;

  await loadGoals();
});

// ======================
// DELETE GOAL
// ======================

function addDeleteEvents() {

  const deleteButtons =
    document.querySelectorAll(".delete-btn");

  deleteButtons.forEach(btn => {

    btn.addEventListener("click", async () => {

      const id = btn.dataset.id;

      const { error } = await supabase
        .from("study_subjects")
        .delete()
        .eq("id", id);

      if (error) {
        console.error(error);
        return;
      }

      await loadGoals();
    });
  });
}

// ======================
// FORMAT MINUTES
// ======================

function formatMinutes(total) {

  const hours =
    Math.floor(total / 60);

  const minutes =
    total % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${minutes}m`;
}

});