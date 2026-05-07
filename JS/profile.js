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

  const avatarInput =
    document.getElementById("avatarInput");

  const uploadAvatarBtn =
    document.getElementById("uploadAvatarBtn");

  // NEW

  const saveBioBtn =
    document.getElementById("saveBioBtn");

  let currentUser = null;

  // ======================
  // INIT
  // ======================

  async function init() {

    const { data: { session } } =
      await supabase.auth.getSession();

    if (!session) {

      window.location.href =
        "auth.html";

      return;
    }

    currentUser = session.user;

    await loadProfile(session.user);
  }

  // ======================
  // LOAD PROFILE
  // ======================

  async function loadProfile(user) {

    const { data, error } =
      await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (error) {

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
    // AVATAR LETTER
    // ======================

    avatarLetter.textContent =
      username.charAt(0).toUpperCase();

    // ======================
    // REAL AVATAR IMAGE
    // ======================

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

    profileBio.value =
      data.bio || "";

    // ======================
    // XP / LEVEL
    // ======================

    profileXP.textContent =
      data.xp || 0;

    profileLevel.textContent =
      Math.floor((data.xp || 0) / 100);

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
        date.toLocaleString("default", {
          month: "long"
        });

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
  // SAVE BIO
  // ======================

  saveBioBtn.addEventListener(
    "click",
    async () => {

      const bio =
        profileBio.value.trim();

      const { error } =
        await supabase
          .from("profiles")
          .update({
            bio: bio
          })
          .eq("id", currentUser.id);

      if (error) {

        console.error(error);

        return;
      }

      saveBioBtn.textContent =
        "Saved!";

      setTimeout(() => {

        saveBioBtn.textContent =
          "Save Bio";

      }, 1500);
    }
  );

  // ======================
  // OPEN FILE PICKER
  // ======================

  uploadAvatarBtn.addEventListener(
    "click",
    () => {

      avatarInput.click();
    }
  );

  // ======================
  // UPLOAD AVATAR
  // ======================

  avatarInput.addEventListener(
    "change",
    async (event) => {

      const file =
        event.target.files[0];

      if (!file) return;

      const fileExt =
        file.name.split(".").pop();

      const fileName =
        `${currentUser.id}.${fileExt}`;

      // UPLOAD TO STORAGE

      const { error: uploadError } =
        await supabase.storage
          .from("avatars")
          .upload(fileName, file, {
            upsert: true
          });

      if (uploadError) {

        console.error(uploadError);

        return;
      }

      // GET PUBLIC URL

      const {
        data: publicUrlData
      } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // FIX CACHE

      const avatarUrl =
        publicUrlData.publicUrl +
        "?t=" + Date.now();

      // SAVE URL TO PROFILE

      const { error: updateError } =
        await supabase
          .from("profiles")
          .update({
            avatar_url: avatarUrl
          })
          .eq("id", currentUser.id);

      if (updateError) {

        console.error(updateError);

        return;
      }

      // RELOAD PROFILE

      await loadProfile(currentUser);
    }
  );

  // ======================
  // START
  // ======================

  init();

});