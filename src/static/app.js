document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.querySelectorAll("option:not(:first-child)").forEach((option) => option.remove());

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        let spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4></h4>
          <p class="activity-description"></p>
          <p><strong>Schedule:</strong> <span class="activity-schedule"></span></p>
          <p><strong>Availability:</strong> <span class="activity-spots"></span> spots left</p>
          <div class="participants-section">
            <h5>Participants:</h5>
            <ul class="participant-list"></ul>
          </div>
        `;

        activityCard.querySelector("h4").textContent = name;
        activityCard.querySelector(".activity-description").textContent = details.description;
        activityCard.querySelector(".activity-schedule").textContent = details.schedule;
        const spotsElement = activityCard.querySelector(".activity-spots");
        spotsElement.textContent = spotsLeft;

        const participantList = activityCard.querySelector(".participant-list");
        function showEmptyParticipantsMessage() {
          const emptyItem = document.createElement("li");
          emptyItem.className = "participant-empty";
          emptyItem.textContent = "No participants signed up yet.";
          participantList.appendChild(emptyItem);
        }

        details.participants.forEach((participant) => {
          const listItem = document.createElement("li");
          listItem.className = "participant-item";

          const email = document.createElement("span");
          email.className = "participant-email";
          email.textContent = participant;

          const deleteButton = document.createElement("button");
          deleteButton.type = "button";
          deleteButton.className = "participant-delete-button";
          deleteButton.setAttribute("aria-label", `Unregister ${participant} from ${name}`);
          deleteButton.title = "Unregister participant";
          deleteButton.innerHTML = `
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3" />
            </svg>
          `;

          deleteButton.addEventListener("click", async () => {
            deleteButton.disabled = true;

            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(participant)}`,
                { method: "DELETE" }
              );
              const result = await response.json();

              if (!response.ok) {
                throw new Error(result.detail || "Unable to unregister participant");
              }

              listItem.remove();
              spotsLeft += 1;
              spotsElement.textContent = spotsLeft;

              if (participantList.childElementCount === 0) {
                showEmptyParticipantsMessage();
              }
            } catch (error) {
              messageDiv.textContent = error.message || "Failed to unregister participant. Please try again.";
              messageDiv.className = "error";
              messageDiv.classList.remove("hidden");
              console.error("Error unregistering participant:", error);
            } finally {
              deleteButton.disabled = false;
            }
          });

          listItem.appendChild(email);
          listItem.appendChild(deleteButton);
          participantList.appendChild(listItem);
        });

        if (details.participants.length === 0) {
          showEmptyParticipantsMessage();
        }

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
