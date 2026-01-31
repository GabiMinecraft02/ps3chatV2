const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatBox = document.getElementById("chat-box");
const usersList = document.getElementById("users-list");

// Fonction pour afficher un message dans le chat
function addMessage(username, content) {
    const div = document.createElement("div");
    div.textContent = `${username}: ${content}`;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Envoyer un message
chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const content = chatInput.value.trim();
    if (!content) return;

    // Affiche immédiatement le message envoyé
    addMessage(USERNAME, content);
    chatInput.value = "";

    // Puis envoie au serveur
    await fetch("/send_message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
    });
});

// Récupérer messages
async function fetchMessages() {
    const res = await fetch("/get_messages");
    if (!res.ok) return;
    const messages = await res.json();
    chatBox.innerHTML = "";
    messages.forEach(msg => {
        addMessage(msg.username, msg.content);
    });
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

// Refresh des messages et utilisateurs toutes les 1 seconde
setInterval(fetchMessages, 500);   // plutôt que 2000ms
setInterval(fetchUsers,1000);
fetchMessages();
fetchUsers();
