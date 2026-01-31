const localAudio = document.getElementById("localAudio");
const micSelect = document.getElementById("micSelect"); // <select> pour choisir le micro
let localStream;

// Lister les micros disponibles
async function listMics() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const mics = devices.filter(d => d.kind === "audioinput");
    micSelect.innerHTML = "";
    mics.forEach((mic, index) => {
        const option = document.createElement("option");
        option.value = mic.deviceId;
        option.textContent = mic.label || `Micro ${index+1}`;
        micSelect.appendChild(option);
    });
}

// Activer le micro sélectionné
async function startMic(deviceId=null) {
    if(localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    localStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: deviceId ? { exact: deviceId } : undefined }
    });
    localAudio.srcObject = localStream;
}

// Quand l’utilisateur change de micro
micSelect.addEventListener("change", () => startMic(micSelect.value));

// Init
listMics().then(() => startMic());

// Bouton mute
const muteBtn = document.getElementById("mute-btn");
muteBtn.addEventListener("click", () => {
    if(localStream) {
        localStream.getAudioTracks()[0].enabled = !localStream.getAudioTracks()[0].enabled;
    }
});
