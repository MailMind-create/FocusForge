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

  const searchInput =
    document.getElementById("searchInput");

  const searchBtn =
    document.getElementById("searchBtn");

  const results =
    document.getElementById("results");

  const friendsList =
    document.getElementById("friendsList");

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

    await loadFriends();
  }

  // ======================
  // SEARCH USERS
  // ======================

  async function searchUsers() {

    const query =
      searchInput.value.trim();

    if (!query) return;

    const { data, error } =
      await supabase
        .from("profiles")
        .select("*")
        .ilike("username", `%${query}%`)
        .neq("id", currentUser.id)
        .limit(10);

    if (error) {

      console.error(error);

      return;
    }

    renderSearchResults(data || []);
  }

  // ======================
  // RENDER SEARCH RESULTS
  // ======================

  function renderSearchResults(users) {

    results.innerHTML = "";

    if (users.length === 0) {

      results.innerHTML = `
        <p class="empty-text">
          No users found.
        </p>
      `;

      return;
    }

    users.forEach(user => {

      const card =
        document.createElement("div");

      card.className =
        "user-card";

      card.innerHTML = `
        <div class="user-info">

          <img
            class="user-avatar"
            src="${user.avatar_url || 'Images/default-avatar.png'}"
          >

          <div class="user-text">

            <h3>
              ${user.username || "User"}
            </h3>

            <p>
              Level ${Math.floor((user.xp || 0) / 100)}
            </p>

          </div>

        </div>

        <button
          class="add-btn"
          data-id="${user.id}">

          Add Friend

        </button>
      `;

      results.appendChild(card);
    });

    // BUTTONS

    document
      .querySelectorAll(".add-btn")
      .forEach(btn => {

        btn.addEventListener(
          "click",
          async () => {

            const friendId =
              btn.dataset.id;

            await addFriend(friendId);

            btn.textContent =
              "Added";

            btn.disabled = true;
          }
        );
      });
  }

  // ======================
  // ADD FRIEND
  // ======================

  async function addFriend(friendId) {

    const { error } =
      await supabase
        .from("friends")
        .insert({

          user_id: currentUser.id,

          friend_id: friendId

        });

    if (error) {

      console.error(error);

      return;
    }

    await loadFriends();
  }

  // ======================
  // LOAD FRIENDS
  // ======================

  async function loadFriends() {

    friendsList.innerHTML = "";

    const { data, error } =
      await supabase
        .from("friends")
        .select("*")
        .eq("user_id", currentUser.id);

    if (error) {

      console.error(error);

      return;
    }

    if (!data || data.length === 0) {

      friendsList.innerHTML = `
        <p class="empty-text">
          No friends yet.
        </p>
      `;

      return;
    }

    for (const friend of data) {

      const { data: profile } =
        await supabase
          .from("profiles")
          .select("*")
          .eq("id", friend.friend_id)
          .single();

      if (!profile) continue;

      const card =
        document.createElement("div");

      card.className =
        "user-card";

      card.innerHTML = `
        <div class="user-info">

          <img
            class="user-avatar"
            src="${profile.avatar_url || 'Images/default-avatar.png'}"
          >

          <div class="user-text">

            <h3>
              ${profile.username || "User"}
            </h3>

            <p>
              🔥 ${profile.streak || 0} day streak
            </p>

          </div>

        </div>

      `;

      friendsList.appendChild(card);
    }
  }

  // ======================
  // EVENTS
  // ======================

  searchBtn.addEventListener(
    "click",
    searchUsers
  );

  // ======================
  // START
  // ======================

  init();

});