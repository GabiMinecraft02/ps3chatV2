const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatBox = document.getElementById("chat-box");

// Fonction pour récupérer messages
async function fetchMessages() {
    const res = await fetch("/get_messages"); // pas d'URL complète
    if (!res.ok) return;
    const messages = await res.json();
    chatBox.innerHTML = "";
    messages.forEach(msg => {
        const div = document.createElement("div");
        div.textContent = `${msg.username}: ${msg.content}`;
        chatBox.appendChild(div);
    });
}

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
    fetchMessages();
});

// Refresh messages toutes les 2 secondes (simple polling)
setInterval(fetchMessages, 2000);
fetchMessages();
