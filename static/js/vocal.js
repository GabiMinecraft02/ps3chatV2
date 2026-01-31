const localAudio = document.getElementById("localAudio");
const micSelect = document.getElementById("micSelect");
const muteBtn = document.getElementById("mute-btn");
const micBtn = document.getElementById("mic-Btn");
const usersList = document.getElementById("users-list");
const peersDiv = document.getElementById("peers");

let localStream;
let peers = {}; // stocke les peers par username

// --- Micro et liste des utilisateurs ---
async function initMic() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localAudio.srcObject = localStream;

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
        alert("Permission micro refusée ou non disponible");
    }
}

micSelect.addEventListener("change", async () => {
    if (!micSelect.value) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: micSelect.value } } });
    localAudio.srcObject = stream;
    localStream = stream;
});

// --- Boutons mute / activer micro ---
muteBtn.addEventListener("click", () => {
    if (localAudio.srcObject) localAudio.muted = !localAudio.muted;
});

micBtn.addEventListener("click", () => {
    if (!localStream) return;
    const track = localStream.getAudioTracks()[0];
    track.enabled = !track.enabled;
    micBtn.textContent = track.enabled ? "Désactiver micro" : "Activer micro";
});

// --- Liste utilisateurs connectés ---
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

// Refresh utilisateurs
setInterval(fetchUsers, 2000);
fetchUsers();
initMic();

// --- WebRTC (simple-peer) ---
// Ici on laisse une base pour 3–4 pers, il faudra un mécanisme de signal via Supabase ou serveur.
// Chaque peer = username, on crée SimplePeer avec stream local et on ajoute <audio> pour chaque peer.

