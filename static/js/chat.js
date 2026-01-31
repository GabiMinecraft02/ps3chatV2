(() => {
    const chatBox = document.getElementById("chat-box");
    const chatForm = document.getElementById("chat-form");
    const chatInput = document.getElementById("chat-input");
    const usersList = document.getElementById("users-list");

    if (!chatBox || !chatForm || !chatInput || !usersList) return;

    function addMessage(username, content) {
        const div = document.createElement("div");
        div.textContent = `${username}: ${content}`;
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    async function fetchMessages() {
        try {
            const res = await fetch("/get_messages");
            if (!res.ok) return;
            const messages = await res.json();
            chatBox.innerHTML = "";
            messages.forEach(m => addMessage(m.username, m.content));
        } catch (e) {
            console.error("fetchMessages error", e);
        }
    }

    async function fetchUsers() {
        try {
            const res = await fetch("/connected_users");
            if (!res.ok) return;
            const users = await res.json();
            usersList.innerHTML = "";
            users.forEach(u => {
                const li = document.createElement("li");
                li.textContent = u;
                usersList.appendChild(li);
            });
        } catch (e) {
            console.error("fetchUsers error", e);
        }
    }

    chatForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const content = chatInput.value.trim();
        if (!content) return;

        addMessage(USERNAME, content);
        chatInput.value = "";

        try {
            await fetch("/send_message", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content })
            });

            // 🔁 recharge UNE fois après envoi
            fetchMessages();
        } catch (e) {
            console.error("send error", e);
        }
    });

    // chargement initial
    fetchMessages();
    fetchUsers();
})();
