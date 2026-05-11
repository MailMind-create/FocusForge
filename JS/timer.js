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

  const timerDisplay =
    document.getElementById("timer");

  const mainBtn =
    document.getElementById("mainBtn");

  const taskInput =
    document.getElementById("taskInput");

  const endState =
    document.getElementById("endState");

  const yesBtn =
    document.querySelector(".yes");

  const noBtn =
    document.querySelector(".no");

  const streakEl =
    document.getElementById("streak");

  const sessionsEl =
    document.getElementById("sessions");

  const xpEl =
    document.getElementById("xp");

  const levelEl =
    document.getElementById("level");

  const popup =
    document.getElementById("popup");

  const popupText =
    document.getElementById("popupText");

  const popupBtn =
    document.getElementById("popupBtn");

  const timeButtons =
    document.querySelectorAll(
      ".time-select button"
    );

  const goalSelect =
    document.getElementById(
      "goalSelect"
    );

  const examGoalSelect =
    document.getElementById(
      "examGoalSelect"
    );

  // ======================
  // DEEP SESSION
  // ======================

  const deepSessionWrapper =
    document.getElementById(
      "deepSessionWrapper"
    );

  const deepTypeSelect =
    document.getElementById(
      "deepType"
    );

  const sessionIntention =
    document.getElementById(
      "sessionIntention"
    );

  const reflectionWrapper =
    document.getElementById(
      "reflectionWrapper"
    );

  const focusRatingSelect =
    document.getElementById(
      "focusRating"
    );

  const energyRatingSelect =
    document.getElementById(
      "energyRating"
    );

  const distractionSelect =
    document.getElementById(
      "distractionLevel"
    );

  const reflectionInput =
    document.getElementById(
      "reflectionInput"
    );

  const reflectionSubmitBtn =
    document.getElementById(
      "saveReflectionBtn"
    );

  // ======================
  // CANVAS
  // ======================

  const canvas =
    document.getElementById(
      "confetti"
    );

  const ctx =
    canvas
      ? canvas.getContext("2d")
      : null;

  // ======================
  // STATE
  // ======================

  let selectedTime = 1500;

  let time = selectedTime;

  let interval = null;

  let isRunning = false;

  let isClaimingReward = false;

  let isMax = false;

  let deepModeEnabled = false;

  let pendingSessionComplete =
    false;

  let userData = null;

  let currentUser = null;

  let userGoals = [];

  let examGoals = [];

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

    await loadUser();

    await loadGoals();

    await loadExamGoals();

    updateDisplay();

    setupDeepMode();
  }

  // ======================
  // DEEP MODE
  // ======================

  function setupDeepMode() {

    const deepToggleBtn =
      document.getElementById(
        "deepToggleBtn"
      );

    if (!deepToggleBtn)
      return;

    deepToggleBtn.onclick =
      () => {

        if (!isMax) {

          showPopup(
            "VELYN MAX Feature"
          );

          return;
        }

        deepModeEnabled =
          !deepModeEnabled;

        if (
          deepModeEnabled
        ) {

          deepSessionWrapper
            .classList.remove(
              "hidden"
            );

          deepToggleBtn.textContent =
            "Disable";

        } else {

          deepSessionWrapper
            .classList.add(
              "hidden"
            );

          deepToggleBtn.textContent =
            "Enable";
        }
      };
  }

  // ======================
  // LOAD USER
  // ======================

  async function loadUser() {

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
        .maybeSingle();

    if (error) {

      console.error(error);

      return;
    }

    if (!data) {

      const {
        error: insertError
      } =
        await supabase
          .from("profiles")
          .insert({

            id:
              currentUser.id,

            email:
              currentUser.email,

            sessions: 0,

            streak: 0,

            xp: 0,

            last_date: null,

            daily_sessions: 0,

            plan: "free"

          });

      if (insertError) {

        console.error(
          insertError
        );

        return;
      }

      return loadUser();
    }

    userData = data;

    isMax =
      userData.plan === "max";

    updateStatsUI();
  }

  // ======================
  // LOAD GOALS
  // ======================

  async function loadGoals() {

    const {
      data,
      error
    } =
      await supabase
        .from("study_subjects")
        .select("*")
        .eq(
          "user_id",
          currentUser.id
        );

    if (error) {

      console.error(error);

      return;
    }

    const today =
      new Date().toDateString();

    userGoals = data || [];

    // ======================
    // DAILY RESET
    // ======================

    for (const goal of userGoals) {

      if (
        goal.last_reset !==
        today
      ) {

        await supabase
          .from("study_subjects")
          .update({

            studied_minutes: 0,

            reward_claimed: false,

            last_reset: today

          })
          .eq(
            "id",
            goal.id
          );
      }
    }

    const {
      data: refreshedGoals
    } =
      await supabase
        .from("study_subjects")
        .select("*")
        .eq(
          "user_id",
          currentUser.id
        );

    userGoals =
      refreshedGoals || [];

    renderGoalOptions();
  }

  function renderGoalOptions() {

    goalSelect.innerHTML = `

      <option value="">
        Optional Daily Goal
      </option>

    `;

    userGoals.forEach(goal => {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        goal.id;

      option.textContent =
        goal.subject_name;

      goalSelect.appendChild(
        option
      );
    });
  }

  // ======================
  // LOAD EXAM GOALS
  // ======================

  async function loadExamGoals() {

    if (!isMax) {

      examGoalSelect.disabled =
        true;

      examGoalSelect.innerHTML = `

        <option value="">
          MAX Feature
        </option>

      `;

      return;
    }

    const {
      data,
      error
    } =
      await supabase
        .from("exam_goals")
        .select("*")
        .eq(
          "user_id",
          currentUser.id
        );

    if (error) {

      console.error(error);

      return;
    }

    examGoals = data || [];

    renderExamGoalOptions();
  }

  function renderExamGoalOptions() {

    examGoalSelect.innerHTML = `

      <option value="">
        Choose Exam Goal
      </option>

    `;

    examGoals.forEach(exam => {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        exam.id;

      option.textContent =
        exam.exam_name;

      examGoalSelect.appendChild(
        option
      );
    });
  }

  // ======================
  // UI
  // ======================

  function formatTime(seconds) {

    const minutes =
      Math.floor(
        seconds / 60
      );

    const sec =
      seconds % 60;

    return `${minutes}:${
      sec < 10
        ? "0"
        : ""
    }${sec}`;
  }

  function updateDisplay() {

    timerDisplay.textContent =
      formatTime(time);
  }

  function updateStatsUI() {

    if (!userData)
      return;

    streakEl.textContent =
      `🔥 Streak: ${userData.streak}`;

    sessionsEl.textContent =
      `Sessions: ${userData.sessions}`;

    xpEl.textContent =
      `XP: ${userData.xp}`;

    levelEl.textContent =
      `Level: ${Math.floor(
        userData.xp / 100
      )}`;
  }

  // ======================
  // TIMER
  // ======================

  function startTimer() {

    if (interval)
      return;

    if (
      !taskInput.value.trim()
    ) {

      showPopup(
        "Enter a task first"
      );

      return;
    }

    isRunning = true;

    mainBtn.textContent =
      "End Session";

    interval =
      setInterval(() => {

        time--;

        updateDisplay();

        if (time <= 0) {

          showEndState();
        }

      }, 1000);
  }

  function showEndState() {

    clearInterval(interval);

    interval = null;

    isRunning = false;

    mainBtn.style.display =
      "none";

    endState.style.display =
      "block";
  }

  // ======================
  // BUTTONS
  // ======================

  mainBtn.onclick = () => {

    if (!isRunning) {

      startTimer();

    } else {

      showEndState();
    }
  };

  // ======================
  // TIME BUTTONS
  // ======================

  timeButtons.forEach(btn => {

    btn.onclick = () => {

      if (isRunning)
        return;

      timeButtons.forEach(b =>
        b.classList.remove(
          "active"
        )
      );

      btn.classList.add(
        "active"
      );

      selectedTime =
        parseInt(
          btn.dataset.time
        );

      time = selectedTime;

      updateDisplay();
    };
  });

  // ======================
  // XP
  // ======================

  function getXP() {

    const completedSeconds =
      selectedTime - time;

    const completedMinutes =
      completedSeconds / 60;

    // 15 MIN

    if (selectedTime === 900) {

      if (
        completedMinutes < 5
      ) {
        return 0;
      }

      if (
        completedMinutes < 10
      ) {
        return 10;
      }

      if (
        completedMinutes < 15
      ) {
        return 20;
      }

      return 30;
    }

    // 25 MIN

    if (selectedTime === 1500) {

      if (
        completedMinutes < 10
      ) {
        return 0;
      }

      if (
        completedMinutes < 20
      ) {
        return 25;
      }

      if (
        completedMinutes < 25
      ) {
        return 40;
      }

      return 50;
    }

    // 45 MIN

    if (selectedTime === 2700) {

      if (
        completedMinutes < 15
      ) {
        return 0;
      }

      if (
        completedMinutes < 30
      ) {
        return 35;
      }

      if (
        completedMinutes < 45
      ) {
        return 65;
      }

      return 90;
    }

    return 0;
  }

  // ======================
  // YES BUTTON
  // ======================

  yesBtn.addEventListener(
    "click",
    async () => {

      endState.style.display =
        "none";

      if (
        deepModeEnabled &&
        isMax
      ) {

        reflectionWrapper.style.display =
          "flex";

        pendingSessionComplete =
          true;

        return;
      }

      await completeSession();
    }
  );

  // ======================
  // REFLECTION BUTTON
  // ======================

  if (
    reflectionSubmitBtn
  ) {

    reflectionSubmitBtn
      .addEventListener(
        "click",
        async () => {

          if (
            !pendingSessionComplete
          ) return;

          await completeSession();
        }
      );
  }

  // ======================
  // COMPLETE SESSION
  // ======================

  async function completeSession() {

    if (
      isClaimingReward
    ) return;

    isClaimingReward =
      true;

    const earnedXP =
      getXP();

    const completedMinutes =
      (
        selectedTime - time
      ) / 60;

    if (
      earnedXP <= 0
    ) {

      showPopup(
        "Session too short"
      );

      isClaimingReward =
        false;

      resetSession();

      return;
    }

    let sessions =
      userData.sessions || 0;

    let streak =
      userData.streak || 0;

    let xp =
      userData.xp || 0;

    let dailySessions =
      userData.daily_sessions || 0;

    const today =
      new Date()
        .toDateString();

    let lastDate =
      userData.last_date;

    sessions++;

    xp += earnedXP;

    if (
      lastDate === today
    ) {

      dailySessions++;

    } else {

      dailySessions = 1;
    }

    if (
      lastDate !== today
    ) {

      let yesterday =
        new Date();

      yesterday.setDate(
        yesterday.getDate() - 1
      );

      const yesterdayString =
        yesterday.toDateString();

      if (
        lastDate ===
        yesterdayString
      ) {

        streak++;

      } else {

        let streakFreezes =
          userData.streak_freezes || 0;

        const alreadyUsedToday =
          userData.last_freeze_used ===
          today;

        if (
          streakFreezes > 0 &&
          !alreadyUsedToday
        ) {

          streakFreezes--;

          await supabase
            .from("profiles")
            .update({

              streak_freezes:
                streakFreezes,

              last_freeze_used:
                today

            })
            .eq(
              "id",
              currentUser.id
            );

          showPopup(
            "❄️ Streak Freeze Used"
          );

        } else {

          streak = 1;
        }
      }

      lastDate = today;
    }

    await supabase
      .from("profiles")
      .update({

        sessions,

        streak,

        xp,

        last_date:
          lastDate,

        daily_sessions:
          dailySessions

      })
      .eq(
        "id",
        currentUser.id
      );

    const sessionData = {

      user_id:
        currentUser.id,

      duration:
        completedMinutes,

      xp_earned:
        earnedXP,

      completed_at:
        new Date(),

      category:
        deepModeEnabled
          ? deepTypeSelect.value || null
          : null,

      focus_rating:
        deepModeEnabled
          ? parseInt(
              focusRatingSelect.value
            ) || null
          : null,

      energy_rating:
        deepModeEnabled
          ? parseInt(
              energyRatingSelect.value
            ) || null
          : null,

      distraction_level:
        deepModeEnabled
          ? parseInt(
              distractionSelect.value
            ) || null
          : null,

      reflection:
        deepModeEnabled
          ? reflectionInput.value.trim()
          : null,

      intention:
        deepModeEnabled
          ? sessionIntention.value.trim()
          : null
    };

    const {
      error:
        sessionError
    } =
      await supabase
        .from(
          "focus_sessions"
        )
        .insert(
          sessionData
        );

    if (
      sessionError
    ) {

      console.error(
        sessionError
      );
    }

    // ======================
    // DAILY GOAL PROGRESS
    // ======================

    if (goalSelect.value) {

      const selectedGoal =
        userGoals.find(
         g => String(g.id) === String(goalSelect.value)
        );

      if (selectedGoal) {

      let updatedMinutes =
Math.round(
  (
    selectedGoal.studied_minutes || 0
  ) + completedMinutes
);

const {
  error: goalError
} = await supabase
  .from("study_subjects")
  .update({
    studied_minutes:
      updatedMinutes
  })
  .eq(
    "id",
    selectedGoal.id
  );

console.log(
  "Goal update error:",
  goalError
);

        await loadGoals();

        if (
          updatedMinutes >=
            selectedGoal.daily_goal_minutes &&
          !selectedGoal.reward_claimed
        ) {

          const bonusXP =
            selectedGoal.daily_goal_minutes;

          await supabase
            .from("profiles")
            .update({
              xp: xp + bonusXP
            })
            .eq(
              "id",
              currentUser.id
            );

          await supabase
            .from("study_subjects")
            .update({
              reward_claimed: true
            })
            .eq(
              "id",
              selectedGoal.id
            );

          fireConfetti();

          showXP(bonusXP);

          showPopup(
            `🎯 Goal Complete! +${bonusXP} XP`
          );
        }
      }
    }

    // ======================
    // EXAM GOAL PROGRESS
    // ======================

    if (
      examGoalSelect.value &&
      isMax
    ) {

      const selectedExam =
        examGoals.find(
          e =>
  String(e.id) ===
  String(examGoalSelect.value)
        );

      if (selectedExam) {

        const updatedMinutes =
Math.round(
  (
    selectedExam.studied_minutes || 0
  ) + completedMinutes
);


const {
  error: examError
} = await supabase
  .from("exam_goals")
  .update({
    studied_minutes:
      updatedMinutes
  })
  .eq(
    "id",
    selectedExam.id
  );

console.log(
  "Exam update error:",
  examError
);

        await loadExamGoals();
      }
    }

    await loadUser();

    fireConfetti();

    showXP(
      earnedXP
    );

    playSound();

    showPopup(
      `🔥 +${earnedXP} XP`
    );

    isClaimingReward =
      false;

    pendingSessionComplete =
      false;

    resetSession();
  }

  // ======================
  // NO BUTTON
  // ======================

  noBtn.addEventListener(
    "click",
    () => {

      endState.style.display =
        "none";

      mainBtn.style.display =
        "block";

      isRunning = true;

      mainBtn.textContent =
        "End Session";

      interval =
        setInterval(() => {

          time--;

          updateDisplay();

          if (
            time <= 0
          ) {

            showEndState();
          }

        }, 1000);
    }
  );

  // ======================
  // RESET
  // ======================

  function resetSession() {

    clearInterval(interval);

    interval = null;

    isRunning = false;

    time = selectedTime;

    updateDisplay();

    mainBtn.style.display =
      "block";

    mainBtn.textContent =
      "Start Session";

    endState.style.display =
      "none";

    reflectionWrapper.style.display =
      "none";

    taskInput.value = "";

    goalSelect.value = "";

    examGoalSelect.value =
      "";

    if (
      deepTypeSelect
    ) {
      deepTypeSelect.value =
        "";
    }

    if (
      sessionIntention
    ) {
      sessionIntention.value =
        "";
    }

    if (
      focusRatingSelect
    ) {
      focusRatingSelect.value =
        "";
    }

    if (
      energyRatingSelect
    ) {
      energyRatingSelect.value =
        "";
    }

    if (
      distractionSelect
    ) {
      distractionSelect.value =
        "";
    }

    if (
      reflectionInput
    ) {
      reflectionInput.value =
        "";
    }

    deepModeEnabled = false;

    deepSessionWrapper
      .classList.add("hidden");

    const deepToggleBtn =
      document.getElementById(
        "deepToggleBtn"
      );

    if (deepToggleBtn) {

      deepToggleBtn.textContent =
        "Enable";
    }
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
  // CONFETTI
  // ======================

  function fireConfetti() {

    if (
      !canvas ||
      !ctx
    ) return;

    canvas.width =
      window.innerWidth;

    canvas.height =
      window.innerHeight;

    const particles =
      [];

    for (
      let i = 0;
      i < 120;
      i++
    ) {

      particles.push({

        x:
          Math.random() *
          canvas.width,

        y:
          Math.random() *
          canvas.height,

        size:
          Math.random() * 4 + 2,

        speedY:
          Math.random() * 4 + 2,

        speedX:
          Math.random() * 2 - 1

      });
    }

    const start =
      Date.now();

    function animate() {

      ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      particles.forEach(p => {

        ctx.fillStyle =
          Math.random() > 0.5
            ? "#4A6CFF"
            : "#6C3DFF";

        ctx.fillRect(
          p.x,
          p.y,
          p.size,
          p.size
        );

        p.y += p.speedY;

        p.x += p.speedX;
      });

      if (
        Date.now() - start
        < 1200
      ) {

        requestAnimationFrame(
          animate
        );

      } else {

        ctx.clearRect(
          0,
          0,
          canvas.width,
          canvas.height
        );
      }
    }

    animate();
  }

  // ======================
  // XP FLOAT
  // ======================

  function showXP(amount) {

    const el =
      document.createElement(
        "div"
      );

    el.className =
      "xp-float";

    el.textContent =
      `+${amount} XP`;

    document.body.appendChild(
      el
    );

    setTimeout(() => {

      el.remove();

    }, 1000);
  }

  // ======================
  // SOUND
  // ======================

  function playSound() {

    const audio =
      new Audio(
        "https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg"
      );

    audio.volume = 0.6;

    audio.play()
      .catch(() => {});
  }

  // ======================
  // START
  // ======================

  init();

});
