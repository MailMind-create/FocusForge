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

  const usernameInput =
    document.getElementById(
      "usernameInput"
    );

  const emailInput =
    document.getElementById(
      "emailInput"
    );

  const saveBtn =
    document.getElementById(
      "saveBtn"
    );

  const statusText =
    document.getElementById(
      "statusText"
    );

  // ======================
  // PLAN
  // ======================

  const planBadge =
    document.getElementById(
      "planBadge"
    );

  const upgradeBtn =
    document.getElementById(
      "upgradeBtn"
    );

  const managePlanBtn =
    document.getElementById(
      "managePlanBtn"
    );

  // ======================
  // ACCOUNT
  // ======================

  const logoutBtn =
    document.getElementById(
      "logoutBtn"
    );

  // ======================
  // STATE
  // ======================

  let currentUser = null;

  let isMax = false;

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

    console.log(
      "Current User:",
      currentUser
    );

    await loadProfile();

    setupButtons();
  }

  // ======================
  // LOAD PROFILE
  // ======================

  async function loadProfile() {

    // ======================
    // LOAD PROFILE DATA
    // ======================

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

      console.error(
        "Profile Error:",
        error
      );

      statusText.textContent =
        "Failed to load profile.";

      return;
    }

    // ======================
    // EMAIL
    // ======================

    if (
      emailInput
    ) {

      emailInput.value =
        currentUser.email || "";
    }

    // ======================
    // USERNAME
    // ======================

    if (
      usernameInput &&
      data?.username
    ) {

      usernameInput.value =
        data.username;
    }

    // ======================
    // PLAN
    // ======================

    isMax =
      data?.plan === "max";

    console.log(
      "Is MAX:",
      isMax
    );

    updatePlanUI();
  }

  // ======================
  // PLAN UI
  // ======================

  function updatePlanUI() {

    if (!planBadge)
      return;

    if (isMax) {

      planBadge.textContent =
        "VELYN MAX";

      planBadge.classList.add(
        "max-active"
      );

      if (upgradeBtn) {

        upgradeBtn.style.display =
          "none";
      }

      if (managePlanBtn) {

        managePlanBtn.style.display =
          "inline-flex";
      }

    } else {

      planBadge.textContent =
        "FREE";

      planBadge.classList.remove(
        "max-active"
      );

      if (upgradeBtn) {

        upgradeBtn.style.display =
          "inline-flex";
      }

      if (managePlanBtn) {

        managePlanBtn.style.display =
          "none";
      }
    }
  }

  // ======================
  // BUTTONS
  // ======================

  function setupButtons() {

    // ======================
    // SAVE USERNAME
    // ======================

    if (saveBtn) {

      saveBtn.addEventListener(
        "click",
        async () => {

          const username =
            usernameInput.value.trim();

          // VALIDATION

          if (!username) {

            statusText.textContent =
              "Enter a username.";

            return;
          }

          if (
            username.length < 3
          ) {

            statusText.textContent =
              "Username too short.";

            return;
          }

          if (
            username.length > 20
          ) {

            statusText.textContent =
              "Username too long.";

            return;
          }

          // ======================
          // CHECK IF EXISTS
          // ======================

          const {
            data: existingUser,
            error: checkError
          } =
            await supabase
              .from("profiles")
              .select("id")
              .eq(
                "username",
                username
              )
              .maybeSingle();

          if (checkError) {

            console.error(
              checkError
            );

            statusText.textContent =
              "Failed checking username.";

            return;
          }

          if (
            existingUser &&
            existingUser.id !==
              currentUser.id
          ) {

            statusText.textContent =
              "Username already taken.";

            return;
          }

          // ======================
          // SAVE
          // ======================

          saveBtn.disabled =
            true;

          saveBtn.textContent =
            "Saving...";

          const {
            error
          } =
            await supabase
              .from("profiles")
              .update({

                username: username

              })
              .eq(
                "id",
                currentUser.id
              );

          saveBtn.disabled =
            false;

          saveBtn.textContent =
            "Save Username";

          if (error) {

            console.error(
              error
            );

            statusText.textContent =
              "Something went wrong.";

            return;
          }

          statusText.textContent =
            "✅ Username updated.";
        }
      );
    }

    // ======================
    // UPGRADE
    // ======================

    if (upgradeBtn) {

      upgradeBtn.addEventListener(
        "click",
        () => {

          statusText.textContent =
            "Stripe integration coming next.";
        }
      );
    }

    // ======================
    // MANAGE PLAN
    // ======================

    if (managePlanBtn) {

      managePlanBtn.addEventListener(
        "click",
        () => {

          statusText.textContent =
            "Subscription management coming soon.";
        }
      );
    }

    // ======================
    // LOGOUT
    // ======================

    if (logoutBtn) {

      logoutBtn.addEventListener(
        "click",
        async () => {

          logoutBtn.disabled =
            true;

          logoutBtn.textContent =
            "Logging out...";

          const {
            error
          } =
            await supabase.auth.signOut();

          if (error) {

            console.error(
              error
            );

            logoutBtn.disabled =
              false;

            logoutBtn.textContent =
              "Logout";

            return;
          }

          window.location.href =
            "index.html";
        }
      );
    }
  }

  // ======================
  // START
  // ======================

  init();

});