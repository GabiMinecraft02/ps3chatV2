(() => {
    // --- Variables globales ---
    const chatBox = document.getElementById("chat-box");
    const chatForm = document.getElementById("chat-form");
    const chatInput = document.getElementById("chat-input");
    const usersList = document.getElementById("users-list");

    // Vérifie que les éléments existent avant de continuer
    if (!chatBox || !chatForm || !chatInput || !usersList) return;

    // --- Fonction pour ajouter un message dans le chat ---
    function addMessage(username, content) {
        const div = document.createElement("div");
        div.textContent = `${username}: ${content}`;
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // --- Envoi de message ---
    chatForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const content = chatInput.value.trim();
        if (!content) return;

        // Affiche immédiatement
        addMessage(USERNAME, content);
        chatInput.value = "";

        // Envoi au serveur
        try {
            await fetch("/send_message", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content })
            });
        } catch (err) {
            console.error("Erreur en envoyant le message :", err);
        }
    });

    // --- Récupération des messages depuis le serveur ---
    async function fetchMessages() {
        try {
            const res = await fetch("/get_messages");
            if (!res.ok) return;
            const messages = await res.json();
            chatBox.innerHTML = "";
            messages.forEach(msg => addMessage(msg.username, msg.content));
        } catch (err) {
            console.error("Erreur en récupérant les messages :", err);
        }
    }

    // --- Récupération des utilisateurs connectés ---
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
        } catch (err) {
            console.error("Erreur en récupérant les utilisateurs :", err);
        }
    }

    // --- Rafraîchissement régulier ---
    setInterval(fetchMessages, 500); // messages toutes les 0,5 s
    setInterval(fetchUsers, 2000);   // utilisateurs toutes les 2 s

    // --- Initialisation ---
    fetchMessages();
    fetchUsers();
})();
