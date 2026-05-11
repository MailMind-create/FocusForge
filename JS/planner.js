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
// ELEMENTS
// ======================

const examGrid =
  document.getElementById("examGrid");

const createExamBtn =
  document.getElementById("createExamBtn");

const plannerStatus =
  document.getElementById("plannerStatus");

const examNameInput =
  document.getElementById("examName");

const examDateInput =
  document.getElementById("examDate");

const targetHoursInput =
  document.getElementById("targetHours");

const template =
  document.getElementById("examCardTemplate");

// ======================
// STATE
// ======================

let currentUser = null;

let currentProfile = null;

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

  currentUser = session.user;

  await loadProfile();

  await loadExams();
}

// ======================
// PROFILE
// ======================

async function loadProfile() {

  const { data, error } =
    await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .single();

  if (error) {

    console.error(error);

    return;
  }

  currentProfile = data;

  // ======================
  // FREE PLAN LOCK
  // ======================

  if (data.plan !== "max") {

    document.body.classList.add(
      "free-plan"
    );

    plannerStatus.textContent =
      "VELYN MAX required to use planner features.";
  }
}

// ======================
// LOAD EXAMS
// ======================

async function loadExams() {

  examGrid.innerHTML = "";

  const { data, error } =
    await supabase
      .from("exam_goals")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("exam_date", {
        ascending: true
      });

  if (error) {

    console.error(error);

    return;
  }

  if (!data || data.length === 0) {

    examGrid.innerHTML = `
      <div class="empty-card">
        <h3>No exams yet</h3>
        <p>
          Create your first exam goal
          to start tracking progress.
        </p>
      </div>
    `;

    updateInsights([]);

    return;
  }

  data.forEach(exam => {

    renderExamCard(exam);
  });

  updateInsights(data);
}

// ======================
// CREATE EXAM
// ======================

createExamBtn.addEventListener(
  "click",
  async () => {

    if (
      currentProfile.plan !== "max"
    ) {

      plannerStatus.textContent =
        "Upgrade to VELYN MAX to create exam goals.";

      return;
    }

    const examName =
      examNameInput.value.trim();

    const examDate =
      examDateInput.value;

    const targetHours =
      parseInt(
        targetHoursInput.value
      );

    if (
      !examName ||
      !examDate ||
      !targetHours
    ) {

      plannerStatus.textContent =
        "Fill in all fields.";

      return;
    }

    const { error } =
      await supabase
        .from("exam_goals")
        .insert({

          user_id:
            currentUser.id,

          exam_name:
            examName,

          exam_date:
            examDate,

          target_hours:
            targetHours,

          studied_minutes: 0
        });

    if (error) {

      console.error(error);

      plannerStatus.textContent =
        "Something went wrong.";

      return;
    }

    plannerStatus.textContent =
      "✅ Exam goal created.";

    examNameInput.value = "";
    examDateInput.value = "";
    targetHoursInput.value = "";

    await loadExams();
  }
);

// ======================
// DELETE EXAM
// ======================

async function deleteExam(id) {

  const confirmed =
    confirm(
      "Delete this exam goal?"
    );

  if (!confirmed) return;

  const { error } =
    await supabase
      .from("exam_goals")
      .delete()
      .eq("id", id);

  if (error) {

    console.error(error);

    plannerStatus.textContent =
      "Could not delete exam.";

    return;
  }

  plannerStatus.textContent =
    "🗑️ Exam deleted.";

  await loadExams();
}

// ======================
// RENDER CARD
// ======================

function renderExamCard(exam) {

  const clone =
    template.content.cloneNode(true);

  const card =
    clone.querySelector(".exam-card");

  const title =
    clone.querySelector(".exam-title");

  const countdown =
    clone.querySelector(".countdown");

  const hours =
    clone.querySelector(".study-hours");

  const percent =
    clone.querySelector(".study-percent");

  const fill =
    clone.querySelector(".progress-fill");

  title.textContent =
    exam.exam_name;

  // DAYS LEFT

  const now =
    new Date();

  const examDate =
    new Date(exam.exam_date);

  const diff =
    examDate - now;

  const daysLeft =
    Math.ceil(
      diff / (1000 * 60 * 60 * 24)
    );

  countdown.textContent =
    `${daysLeft} Days`;

  // PROGRESS

  const studiedHours =
    (
      exam.studied_minutes / 60
    ).toFixed(1);

  const progress =
    Math.min(
      (
        studiedHours /
        exam.target_hours
      ) * 100,
      100
    );

  hours.textContent =
    `${studiedHours} / ${exam.target_hours} Hours`;

  percent.textContent =
    `${Math.floor(progress)}%`;

  fill.style.width =
    `${progress}%`;

  // ======================
  // DELETE BUTTON
  // ======================

  const actions =
    document.createElement("div");

  actions.className =
    "exam-actions";

  actions.innerHTML = `
    <button class="delete-btn">
      Delete
    </button>
  `;

  card.appendChild(actions);

  const deleteBtn =
    actions.querySelector(".delete-btn");

  deleteBtn.addEventListener(
    "click",
    () => deleteExam(exam.id)
  );

  examGrid.appendChild(clone);
}

// ======================
// INSIGHTS
// ======================

function updateInsights(exams) {

  const values =
    document.querySelectorAll(
      ".insight-value"
    );

  if (values.length < 3) return;

  if (exams.length === 0) {

    values[0].textContent = "0%";
    values[1].textContent = "0 Active";
    values[2].textContent = "--";

    return;
  }

  // READINESS

  let totalTarget = 0;
  let totalStudied = 0;

  exams.forEach(exam => {

    totalTarget +=
      exam.target_hours;

    totalStudied +=
      exam.studied_minutes / 60;
  });

  const readiness =
    totalTarget > 0
      ? Math.floor(
          (totalStudied / totalTarget) * 100
        )
      : 0;

  values[0].textContent =
    `${readiness}%`;

  // ACTIVE EXAMS

  values[1].textContent =
    `${exams.length} Active`;

  // NEAREST EXAM

  const sorted =
    [...exams].sort(
      (a, b) =>
        new Date(a.exam_date) -
        new Date(b.exam_date)
    );

  const nearest =
    new Date(sorted[0].exam_date);

  const diff =
    nearest - new Date();

  const days =
    Math.ceil(
      diff / (1000 * 60 * 60 * 24)
    );

  values[2].textContent =
    `${days} Days`;
}

});