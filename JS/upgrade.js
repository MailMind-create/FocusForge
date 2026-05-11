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

  const upgradeBtn =
    document.getElementById(
      "upgradeBtn"
    );

  const statusText =
    document.getElementById(
      "statusText"
    );

  // ======================
  // STATE
  // ======================

  let currentUser = null;

  // ======================
  // INIT
  // ======================

  async function init() {

    const {
      data: { session }
    } =
      await supabase.auth.getSession();

    // ======================
    // NO SESSION
    // ======================

    if (!session) {

      console.log(
        "No active session"
      );

      return;
    }

    currentUser =
      session.user;

    console.log(
      "Logged in:",
      currentUser.email
    );

    await checkCurrentPlan();
  }

  // ======================
  // CHECK PLAN
  // ======================

  async function checkCurrentPlan() {

    if (!currentUser)
      return;

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

    if (error) {

      console.error(error);

      return;
    }

    // ======================
    // ALREADY MAX
    // ======================

    if (
      data?.plan === "max"
    ) {

      upgradeBtn.textContent =
        "You Already Have MAX";

      upgradeBtn.disabled =
        true;

      upgradeBtn.style.opacity =
        "0.7";

      upgradeBtn.style.cursor =
        "not-allowed";
    }
  }

  // ======================
  // UPGRADE BUTTON
  // ======================

  if (upgradeBtn) {

    upgradeBtn.addEventListener(
      "click",
      async () => {

        // ======================
        // LOGIN CHECK
        // ======================

        if (!currentUser) {

          window.location.href =
            "auth.html?redirect=upgrade";

          return;
        }

        try {

          // ======================
          // LOADING STATE
          // ======================

          upgradeBtn.disabled =
            true;

          upgradeBtn.textContent =
            "Loading...";

          if (statusText) {

            statusText.textContent =
              "Opening secure checkout...";
          }

          // ======================
          // CREATE STRIPE SESSION
          // ======================

          const response =
            await fetch(
              "/api/create-checkout-session",
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json"
                },

                body: JSON.stringify({
                  userId:
                    currentUser.id
                })
              }
            );

          const data =
            await response.json();

          // ======================
          // CHECK ERROR
          // ======================

          if (!data.url) {

            throw new Error(
              data.error ||
              "Failed to create Stripe session."
            );
          }

          // ======================
          // REDIRECT TO STRIPE
          // ======================

          window.location.href =
            data.url;

        } catch (err) {

          console.error(err);

          // ======================
          // RESET BUTTON
          // ======================

          upgradeBtn.disabled =
            false;

          upgradeBtn.textContent =
            "Upgrade to MAX";

          if (statusText) {

            statusText.textContent =
              err.message;
          }
        }
      }
    );
  }

  // ======================
  // START
  // ======================

  init();

});