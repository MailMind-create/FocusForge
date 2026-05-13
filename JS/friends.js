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

    currentUser =
      session.user;

    await loadRequests();

    await loadFriends();
  }

  // ======================
  // SEARCH USERS
  // ======================

  async function searchUsers() {

    const query =
      searchInput.value.trim();

    if (!query)
      return;

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

      console.error(
        "Search error:",
        error
      );

      return;
    }

    renderSearchResults(
      data || []
    );
  }

  // ======================
  // RENDER SEARCH RESULTS
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

      // CHECK REQUESTS

      const {
        data: request
      } =
        await supabase
          .from("friend_requests")
          .select("*")
          .or(`
            and(sender_id.eq.${currentUser.id},receiver_id.eq.${user.id}),
            and(sender_id.eq.${user.id},receiver_id.eq.${currentUser.id})
          `)
          .maybeSingle();

      // CHECK FRIENDS

      const {
        data: friendship
      } =
        await supabase
          .from("friends")
          .select("*")
          .eq(
            "user_id",
            currentUser.id
          )
          .eq(
            "friend_id",
            user.id
          )
          .maybeSingle();

      let buttonText =
        "Add Friend";

      let disabled =
        false;

      if (request) {

        buttonText =
          "Pending";

        disabled =
          true;
      }

      if (friendship) {

        buttonText =
          "Friends";

        disabled =
          true;
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
          }
        >

          ${buttonText}

        </button>
      `;

      results.appendChild(card);
    }

    // ADD BUTTONS

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
  // SEND FRIEND REQUEST
  // ======================

  async function sendFriendRequest(
    friendId
  ) {

    const {
      error
    } =
      await supabase
        .from("friend_requests")
        .insert({

          sender_id:
            currentUser.id,

          receiver_id:
            friendId,

          status:
            "pending"

        });

    console.log(
      "Send request error:",
      error
    );
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
        .from("friend_requests")
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

      console.error(
        "Load requests error:",
        error
      );

      return;
    }

    if (
      !data ||
      data.length === 0
    ) {
      return;
    }

    const title =
      document.createElement(
        "h2"
      );

    title.className =
      "section-title";

    title.textContent =
      "Friend Requests";

    friendsList.appendChild(
      title
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

        <div style="display:flex;gap:10px;">

          <button
            class="accept-btn"
            data-id="${request.id}"
            data-user="${request.sender_id}"
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
              btn.dataset.id,
              btn.dataset.user
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
  // ACCEPT REQUEST
  // ======================

  async function acceptRequest(
    requestId,
    senderId
  ) {

    console.log(
      "Accepting request..."
    );

    // ADD CURRENT USER FRIEND

    const {
      error: insertError
    } =
      await supabase
        .from("friends")
        .insert({

          user_id:
            currentUser.id,

          friend_id:
            senderId

        });

    console.log(
      "Friend insert error:",
      insertError
    );

    // UPDATE REQUEST

    const {
      error: requestError
    } =
      await supabase
        .from("friend_requests")
        .update({
          status:
            "accepted"
        })
        .eq(
          "id",
          requestId
        );

    console.log(
      "Request update error:",
      requestError
    );
  }

  // ======================
  // DECLINE REQUEST
  // ======================

  async function declineRequest(
    requestId
  ) {

    const {
      error
    } =
      await supabase
        .from("friend_requests")
        .delete()
        .eq(
          "id",
          requestId
        );

    console.log(
      "Decline error:",
      error
    );
  }

  // ======================
  // REMOVE FRIEND
  // ======================

  async function removeFriend(
    friendId
  ) {

    const {
      error
    } =
      await supabase
        .from("friends")
        .delete()
        .eq(
          "user_id",
          currentUser.id
        )
        .eq(
          "friend_id",
          friendId
        );

    console.log(
      "Remove friend error:",
      error
    );
  }

  // ======================
  // LOAD FRIENDS
  // ======================

  async function loadFriends() {

    const {
      data,
      error
    } =
      await supabase
        .from("friends")
        .select("*")
        .eq(
          "user_id",
          currentUser.id
        );

    if (error) {

      console.error(
        "Load friends error:",
        error
      );

      return;
    }

    if (
      !data ||
      data.length === 0
    ) {

      friendsList.innerHTML += `
        <p class="empty-text">
          No friends yet.
        </p>
      `;

      return;
    }

    for (const friend of data) {

      const {
        data: profile
      } =
        await supabase
          .from("profiles")
          .select("*")
          .eq(
            "id",
            friend.friend_id
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
          data-id="${profile.id}"
        >
          Remove
        </button>
      `;

      friendsList.appendChild(
        card
      );

      card
        .querySelector(
          ".remove-btn"
        )
        .addEventListener(
          "click",
          async () => {

            await removeFriend(
              profile.id
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
