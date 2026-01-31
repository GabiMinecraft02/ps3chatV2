const localAudio = document.getElementById("localAudio");
const micSelect = document.getElementById("micSelect");
const muteBtn = document.getElementById("mute-btn");
const usersList = document.getElementById("users-list");
let localStream;

// Liste des micros et permission
async function initMic() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localAudio.srcObject = localStream;

        // Après avoir obtenu la permission, lister les micros
        const devices = await navigator.mediaDevices.enumerateDevices();
        const mics = devices.filter(d => d.kind === "audioinput");
        micSelect.innerHTML = "";
        mics.forEach((mic, index) => {
            const option = document.createElement("option");
            option.value = mic.deviceId;
            option.textContent = mic.label || `Micro ${index+1}`;
            micSelect.appendChild(option);
        });
    } catch (err) {
        console.error("Impossible d’accéder au micro :", err);
    }
}

// Changer de micro
micSelect.addEventListener("change", async () => {
    if (micSelect.value) {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: micSelect.value } }
        });
        localAudio.srcObject = stream;
        localStream = stream;
    }
});

// Bouton mute
muteBtn.addEventListener("click", () => {
    if (localStream) {
        const track = localStream.getAudioTracks()[0];
        track.enabled = !track.enabled;
    }
});

// Activer / désactiver le micro
micBtn.addEventListener("click", () => {
    if (!localStream) return;
    const track = localStream.getAudioTracks()[0];
    track.enabled = !track.enabled;
    micBtn.textContent = track.enabled ? "Désactiver micro" : "Activer micro";
});

// Utilisateurs connectés
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

// Refresh utilisateurs toutes les 2 secondes
setInterval(fetchUsers, 2000);
fetchUsers();
initMic();

