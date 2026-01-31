(() => {
    const micSelect = document.getElementById("micSelect");
    const micBtn = document.getElementById("mic-Btn");
    const muteBtn = document.getElementById("mute-btn");
    const localAudio = document.getElementById("localAudio");
    let localStream;

    if (!micSelect || !micBtn || !muteBtn || !localAudio) return;

    // Initialisation micro
    async function initMic() {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localAudio.srcObject = localStream;

            // Lister les micros
            const devices = await navigator.mediaDevices.enumerateDevices();
            const mics = devices.filter(d => d.kind === "audioinput");
            micSelect.innerHTML = "";
            mics.forEach((mic, index) => {
                const option = document.createElement("option");
                option.value = mic.deviceId;
                option.textContent = mic.label || `Micro ${index + 1}`;
                micSelect.appendChild(option);
            });
        } catch (err) {
            console.error("Impossible d’accéder au micro :", err);
            alert("Permission micro refusée ou non disponible");
        }
    }

    // Changer de micro
    micSelect.addEventListener("change", async () => {
        if (!micSelect.value) return;
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: micSelect.value } }
        });
        localAudio.srcObject = stream;
        localStream = stream;
    });

    // Activer / désactiver micro
    micBtn.addEventListener("click", () => {
        if (!localStream) return;
        const track = localStream.getAudioTracks()[0];
        track.enabled = !track.enabled;
        micBtn.textContent = track.enabled ? "Désactiver micro" : "Activer micro";
    });

    // Mute audio local
    muteBtn.addEventListener("click", () => {
        if (!localAudio.srcObject) return;
        localAudio.muted = !localAudio.muted;
        muteBtn.textContent = localAudio.muted ? "Unmute" : "Mute";
    });

    // Lancer l’init
    initMic();
})();
