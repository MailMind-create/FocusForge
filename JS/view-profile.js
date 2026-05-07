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

  const profileUsername =
    document.getElementById("profileUsername");

  const profileBio =
    document.getElementById("profileBio");

  const joinedDate =
    document.getElementById("joinedDate");

  const profileXP =
    document.getElementById("profileXP");

  const profileLevel =
    document.getElementById("profileLevel");

  const profileStreak =
    document.getElementById("profileStreak");

  const profileSessions =
    document.getElementById("profileSessions");

  const avatarLetter =
    document.getElementById("avatarLetter");

  const avatarImage =
    document.getElementById("avatarImage");

  // ======================
  // INIT
  // ======================

  async function init() {

    // CHECK AUTH

    const { data: { session } } =
      await supabase.auth.getSession();

    if (!session) {

      window.location.href =
        "auth.html";

      return;
    }

    // GET USER ID FROM URL

    const params =
      new URLSearchParams(
        window.location.search
      );

    const userId =
      params.get("id");

    if (!userId) {

      window.location.href =
        "leaderboard.html";

      return;
    }

    await loadProfile(userId);
  }

  // ======================
  // LOAD PROFILE
  // ======================

  async function loadProfile(userId) {

    const { data, error } =
      await supabase
        .from("profiles")
        .select(`
          id,
          username,
          bio,
          xp,
          streak,
          sessions,
          avatar_url,
          created_at
        `)
        .eq("id", userId)
        .single();

    if (error || !data) {

      console.error(error);

      return;
    }

    // ======================
    // USERNAME
    // ======================

    const username =
      data.username || "User";

    profileUsername.textContent =
      username;

    // ======================
    // AVATAR
    // ======================

    avatarLetter.textContent =
      username.charAt(0).toUpperCase();

    if (data.avatar_url) {

      avatarImage.src =
        data.avatar_url;

      avatarImage.style.display =
        "block";

      avatarLetter.style.display =
        "none";

    } else {

      avatarImage.style.display =
        "none";

      avatarLetter.style.display =
        "block";
    }

    // ======================
    // BIO
    // ======================

    profileBio.textContent =
      data.bio || "No bio yet.";

    // ======================
    // XP / LEVEL
    // ======================

    const xp =
      data.xp || 0;

    profileXP.textContent =
      xp;

    profileLevel.textContent =
      Math.floor(xp / 100);

    // ======================
    // STREAK
    // ======================

    profileStreak.textContent =
      data.streak || 0;

    // ======================
    // SESSIONS
    // ======================

    profileSessions.textContent =
      data.sessions || 0;

    // ======================
    // JOINED DATE
    // ======================

    if (data.created_at) {

      const date =
        new Date(data.created_at);

      const month =
        date.toLocaleString(
          "default",
          {
            month: "long"
          }
        );

      const year =
        date.getFullYear();

      joinedDate.textContent =
        `Joined ${month} ${year}`;

    } else {

      joinedDate.textContent =
        "Joined recently";
    }
  }

  // ======================
  // START
  // ======================

  init();

});