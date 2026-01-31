(() => {
    const micSelect = document.getElementById("micSelect");
    const micBtn = document.getElementById("mic-Btn");
    const muteBtn = document.getElementById("mute-btn");
    const localAudio = document.getElementById("localAudio");

    let localStream = null;

    if (!micSelect || !micBtn || !muteBtn || !localAudio) {
        console.error("Éléments micro manquants");
        return;
    }

    async function startMicro(deviceId = null) {
        try {
            console.log("Demande accès micro…");

            const constraints = {
                audio: deviceId ? { deviceId: { exact: deviceId } } : true
            };

            localStream = await navigator.mediaDevices.getUserMedia(constraints);
            localAudio.srcObject = localStream;

            console.log("Micro OK");

            const devices = await navigator.mediaDevices.enumerateDevices();
            const mics = devices.filter(d => d.kind === "audioinput");

            micSelect.innerHTML = "";
            mics.forEach((mic, i) => {
                const opt = document.createElement("option");
                opt.value = mic.deviceId;
                opt.textContent = mic.label || `Micro ${i + 1}`;
                micSelect.appendChild(opt);
            });

        } catch (err) {
            console.error("ERREUR MICRO :", err);
            alert("Micro refusé ou non disponible");
        }
    }

    // 🔘 BOUTON ACTIVER MICRO (OBLIGATOIRE SUR MOBILE)
    micBtn.addEventListener("click", async () => {
        if (!localStream) {
            micBtn.textContent = "Désactiver micro";
            await startMicro();
        } else {
            localStream.getTracks().forEach(t => t.stop());
            localStream = null;
            micBtn.textContent = "Activer micro";
            localAudio.srcObject = null;
        }
    });

    // 🎤 CHANGEMENT DE MICRO
    micSelect.addEventListener("change", async () => {
        if (!micSelect.value) return;
        if (localStream) {
            localStream.getTracks().forEach(t => t.stop());
        }
        await startMicro(micSelect.value);
    });

    // 🔇 MUTE
    muteBtn.addEventListener("click", () => {
        if (!localStream) return;
        const track = localStream.getAudioTracks()[0];
        track.enabled = !track.enabled;
        muteBtn.textContent = track.enabled ? "Mute" : "Unmute";
    });
})();
