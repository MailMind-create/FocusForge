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

    await loadFriends();

    await loadRequests();
  }

  // ======================
  // SEARCH USERS
  // ======================

  async function searchUsers() {

    const query =
      searchInput.value.trim();

    if (!query) return;

    const {
      data,
      error
    } =
      await supabase
        .from("profiles")
        .select("*")
        .ilike(
          "username",
          `%${query}%`
        )
        .neq(
          "id",
          currentUser.id
        )
        .limit(10);

    if (error) {

      console.error(error);

      return;
    }

    renderSearchResults(
      data || []
    );
  }

  // ======================
  // RENDER SEARCH
  // ======================

  async function renderSearchResults(users) {

    results.innerHTML = "";

    if (users.length === 0) {

      results.innerHTML = `
        <p class="empty-text">
          No users found.
        </p>
      `;

      return;
    }

    for (const user of users) {

      const {
        data: existing
      } =
        await supabase
          .from("friends")
          .select("*")
          .or(`
            and(sender_id.eq.${currentUser.id},receiver_id.eq.${user.id}),
            and(sender_id.eq.${user.id},receiver_id.eq.${currentUser.id})
          `)
          .maybeSingle();

      let buttonText =
        "Add Friend";

      let disabled =
        false;

      if (existing) {

        if (
          existing.status ===
          "pending"
        ) {

          buttonText =
            "Pending";

          disabled =
            true;
        }

        if (
          existing.status ===
          "accepted"
        ) {

          buttonText =
            "Friends";

          disabled =
            true;
        }
      }

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "user-card";

      card.innerHTML = `
        <div class="user-info">

          <img
            class="user-avatar"
            src="${
              user.avatar_url ||
              "Images/default-avatar.png"
            }"
          >

          <div class="user-text">

            <h3>
              ${
                user.username ||
                "User"
              }
            </h3>

            <p>
              Level ${Math.floor(
                (user.xp || 0) / 100
              )}
            </p>

          </div>

        </div>

        <button
          class="add-btn"
          data-id="${user.id}"
          ${
            disabled
              ? "disabled"
              : ""
          }>

          ${buttonText}

        </button>
      `;

      results.appendChild(card);
    }

    // ======================
    // BUTTONS
    // ======================

    document
      .querySelectorAll(
        ".add-btn"
      )
      .forEach(btn => {

        btn.addEventListener(
          "click",
          async () => {

            const friendId =
              btn.dataset.id;

            await sendFriendRequest(
              friendId
            );

            btn.textContent =
              "Pending";

            btn.disabled =
              true;
          }
        );
      });
  }

  // ======================
  // SEND REQUEST
  // ======================

  async function sendFriendRequest(
    friendId
  ) {

    const { error } =
      await supabase
        .from("friends")
        .insert({

          sender_id:
            currentUser.id,

          receiver_id:
            friendId,

          status:
            "pending",

          user_id:
            currentUser.id,

          friend_id:
            friendId

        });

    if (error) {

      console.error(error);

      return;
    }
  }

  // ======================
  // LOAD REQUESTS
  // ======================

  async function loadRequests() {

    const {
      data,
      error
    } =
      await supabase
        .from("friends")
        .select("*")
        .eq(
          "receiver_id",
          currentUser.id
        )
        .eq(
          "status",
          "pending"
        );

    if (error) {

      console.error(error);

      return;
    }

    if (
      !data ||
      data.length === 0
    ) {
      return;
    }

    const requestTitle =
      document.createElement(
        "h2"
      );

    requestTitle.className =
      "section-title";

    requestTitle.textContent =
      "Friend Requests";

    friendsList.appendChild(
      requestTitle
    );

    for (const request of data) {

      const {
        data: profile
      } =
        await supabase
          .from("profiles")
          .select("*")
          .eq(
            "id",
            request.sender_id
          )
          .single();

      if (!profile)
        continue;

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "user-card";

      card.innerHTML = `
        <div class="user-info">

          <img
            class="user-avatar"
            src="${
              profile.avatar_url ||
              "Images/default-avatar.png"
            }"
          >

          <div class="user-text">

            <h3>
              ${
                profile.username ||
                "User"
              }
            </h3>

            <p>
              Wants to be friends
            </p>

          </div>

        </div>

        <div
          style="
            display:flex;
            gap:10px;
          "
        >

          <button
            class="accept-btn"
            data-id="${request.id}"
          >
            Accept
          </button>

          <button
            class="decline-btn"
            data-id="${request.id}"
          >
            Decline
          </button>

        </div>
      `;

      friendsList.appendChild(
        card
      );
    }

    // ACCEPT

    document
      .querySelectorAll(
        ".accept-btn"
      )
      .forEach(btn => {

        btn.addEventListener(
          "click",
          async () => {

            await acceptRequest(
              btn.dataset.id
            );

            location.reload();
          }
        );
      });

    // DECLINE

    document
      .querySelectorAll(
        ".decline-btn"
      )
      .forEach(btn => {

        btn.addEventListener(
          "click",
          async () => {

            await declineRequest(
              btn.dataset.id
            );

            location.reload();
          }
        );
      });
  }

  // ======================
  // ACCEPT
  // ======================

  async function acceptRequest(id) {

    const { error } =
      await supabase
        .from("friends")
        .update({

          status:
            "accepted"

        })
        .eq("id", id);

    if (error) {

      console.error(error);
    }
  }

  // ======================
  // DECLINE
  // ======================

  async function declineRequest(id) {

    const { error } =
      await supabase
        .from("friends")
        .delete()
        .eq("id", id);

    if (error) {

      console.error(error);
    }
  }

  // ======================
  // REMOVE FRIEND
  // ======================

  async function removeFriend(id) {

    const { error } =
      await supabase
        .from("friends")
        .delete()
        .eq("id", id);

    if (error) {

      console.error(error);
    }
  }

  // ======================
  // LOAD FRIENDS
  // ======================

  async function loadFriends() {

    friendsList.innerHTML = "";

    const {
      data,
      error
    } =
      await supabase
        .from("friends")
        .select("*")
        .or(`
          sender_id.eq.${currentUser?.id},
          receiver_id.eq.${currentUser?.id}
        `)
        .eq(
          "status",
          "accepted"
        );

    if (error) {

      console.error(error);

      return;
    }

    if (
      !data ||
      data.length === 0
    ) {

      friendsList.innerHTML = `
        <p class="empty-text">
          No friends yet.
        </p>
      `;
    }

    for (const friend of data) {

      const friendId =
        friend.sender_id ===
        currentUser.id

          ? friend.receiver_id
          : friend.sender_id;

      const {
        data: profile
      } =
        await supabase
          .from("profiles")
          .select("*")
          .eq(
            "id",
            friendId
          )
          .single();

      if (!profile)
        continue;

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "user-card";

      card.innerHTML = `
        <div class="user-info">

          <img
            class="user-avatar"
            src="${
              profile.avatar_url ||
              "Images/default-avatar.png"
            }"
          >

          <div class="user-text">

            <h3>
              ${
                profile.username ||
                "User"
              }
            </h3>

            <p>
              🔥 ${
                profile.streak || 0
              } day streak
            </p>

          </div>

        </div>

        <button
          class="remove-btn"
          data-id="${friend.id}"
        >
          Remove
        </button>
      `;

      friendsList.appendChild(
        card
      );

      const removeBtn =
        card.querySelector(
          ".remove-btn"
        );

      removeBtn.addEventListener(
        "click",
        async () => {

          await removeFriend(
            friend.id
          );

          location.reload();
        }
      );
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