const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatBox = document.getElementById("chat-box");
const usersList = document.getElementById("users-list");

// Envoyer un message
chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const content = chatInput.value.trim();
    if (!content) return;
    await fetch("/send_message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
    });
    chatInput.value = "";
});

// Récupérer messages
async function fetchMessages() {
    const res = await fetch("/get_messages");
    if (!res.ok) return;
    const messages = await res.json();
    chatBox.innerHTML = "";
    messages.forEach(msg => {
        const div = document.createElement("div");
        div.textContent = `${msg.username}: ${msg.content}`;
        chatBox.appendChild(div);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Récupérer utilisateurs connectés
async function fetchUsers() {
    const res = await fetch("/connected_users");
    if (!res.ok) return;
    const users = await res.json();
    usersList.innerHTML = "";
    users.forEach(u => {
        const li = document.createElement("li");
        li.textContent = u;
        usersList.appendChild(li);
    });
}

// Refresh toutes les 2 secondes
setInterval(fetchMessages, 2000);
setInterval(fetchUsers, 2000);
fetchMessages();
fetchUsers();
