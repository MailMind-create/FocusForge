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

  const topThree =
    document.getElementById("topThree");

  const leaderboardList =
    document.getElementById("leaderboardList");

  const globalTab =
    document.getElementById("globalTab");

  const friendsTab =
    document.getElementById("friendsTab");

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

    await loadGlobalLeaderboard();
  }

  // ======================
  // GLOBAL
  // ======================

  async function loadGlobalLeaderboard() {

    setActiveTab("global");

    const { data, error } =
      await supabase
        .from("profiles")
        .select(`
          id,
          username,
          xp,
          streak,
          avatar_url
        `)
        .order("xp", {
          ascending: false
        })
        .limit(50);

    if (error) {

      console.error(error);

      return;
    }

    renderLeaderboard(data || []);
  }

  // ======================
  // FRIENDS
  // ======================

  async function loadFriendsLeaderboard() {

    setActiveTab("friends");

    const { data: friendsData, error } =
      await supabase
        .from("friends")
        .select("*")
        .eq("user_id", currentUser.id);

    if (error) {

      console.error(error);

      return;
    }

    const friendProfiles = [];

    for (const friend of friendsData) {

      const { data: profile } =
        await supabase
          .from("profiles")
          .select(`
            id,
            username,
            xp,
            streak,
            avatar_url
          `)
          .eq("id", friend.friend_id)
          .single();

      if (profile) {

        friendProfiles.push(profile);
      }
    }

    friendProfiles.sort(
      (a, b) => (b.xp || 0) - (a.xp || 0)
    );

    renderLeaderboard(friendProfiles);
  }

  // ======================
  // RENDER
  // ======================

  function renderLeaderboard(users) {

    topThree.innerHTML = "";
    leaderboardList.innerHTML = "";

    if (users.length === 0) {

      leaderboardList.innerHTML = `
        <p style="color: #A0A3BD;">
          No users found.
        </p>
      `;

      return;
    }

    // ======================
    // TOP 3
    // ======================

    users.slice(0, 3).forEach((user, index) => {

      const medals = [
        "🥇",
        "🥈",
        "🥉"
      ];

      const card =
        document.createElement("div");

      card.className =
        "top-card";

      // CLICKABLE

      card.style.cursor =
        "pointer";

      card.addEventListener(
        "click",
        () => {

          window.location.href =
            `view-profile.html?id=${user.id}`;
        }
      );

      card.innerHTML = `
        <div class="rank">
          ${medals[index]}
        </div>

        <img
          class="top-avatar"
          src="${user.avatar_url || 'Images/default-avatar.png'}"
        >

        <h3>
          ${user.username || "User"}
        </h3>

        <p>
          Level ${Math.floor((user.xp || 0) / 100)}
        </p>

        <p>
          ${user.xp || 0} XP
        </p>
      `;

      topThree.appendChild(card);
    });

    // ======================
    // FULL LIST
    // ======================

    users.forEach((user, index) => {

      const card =
        document.createElement("div");

      card.className =
        "user-card";

      // CLICKABLE

      card.style.cursor =
        "pointer";

      card.addEventListener(
        "click",
        () => {

          window.location.href =
            `view-profile.html?id=${user.id}`;
        }
      );

      card.innerHTML = `
        <div class="user-left">

          <div class="position">
            #${index + 1}
          </div>

          <img
            class="user-avatar"
            src="${user.avatar_url || 'Images/default-avatar.png'}"
          >

          <div class="user-info">

            <h3>
              ${user.username || "User"}
            </h3>

            <p>
              🔥 ${user.streak || 0} day streak
            </p>

          </div>

        </div>

        <div class="user-xp">

          <h3>
            ${user.xp || 0} XP
          </h3>

          <p>
            Level ${Math.floor((user.xp || 0) / 100)}
          </p>

        </div>
      `;

      leaderboardList.appendChild(card);
    });
  }

  // ======================
  // ACTIVE TAB
  // ======================

  function setActiveTab(type) {

    globalTab.classList.remove("active");

    friendsTab.classList.remove("active");

    if (type === "global") {

      globalTab.classList.add("active");

    } else {

      friendsTab.classList.add("active");
    }
  }

  // ======================
  // EVENTS
  // ======================

  globalTab.addEventListener(
    "click",
    loadGlobalLeaderboard
  );

  friendsTab.addEventListener(
    "click",
    loadFriendsLeaderboard
  );

  // ======================
  // START
  // ======================

  init();

});