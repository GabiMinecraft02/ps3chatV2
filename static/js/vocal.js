(() => {
    const micBtn = document.getElementById("mic-Btn");
    const muteBtn = document.getElementById("mute-btn");
    const micSelect = document.getElementById("micSelect");

    const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    let localStream = null;
    let audioTrack = null;

    const remoteAudio = document.createElement("audio");
    remoteAudio.autoplay = true;
    document.body.appendChild(remoteAudio);

    async function startMicro(deviceId = null) {
        if (localStream) {
            localStream.getTracks().forEach(t => t.stop());
        }

        const constraints = {
            audio: deviceId ? { deviceId: { exact: deviceId } } : true
        };

        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        audioTrack = localStream.getAudioTracks()[0];

        pc.getSenders().forEach(s => pc.removeTrack(s));
        pc.addTrack(audioTrack, localStream);

        const devices = await navigator.mediaDevices.enumerateDevices();
        micSelect.innerHTML = "";
        devices.filter(d => d.kind === "audioinput").forEach((d, i) => {
            const opt = document.createElement("option");
            opt.value = d.deviceId;
            opt.textContent = d.label || `Micro ${i + 1}`;
            micSelect.appendChild(opt);
        });
    }

    async function startWebRTC() {
        pc.ontrack = e => {
            remoteAudio.srcObject = e.streams[0];
        };

        pc.onicecandidate = e => {
            if (e.candidate) {
                fetch("/webrtc/candidate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(e.candidate)
                });
            }
        };

        const offersRes = await fetch("/webrtc/offers");
        const offers = await offersRes.json();

        if (!offers || Object.keys(offers).length === 0) {
            // Host
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            await fetch("/webrtc/offer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(offer)
            });
        } else {
            // Client
            const hostOffer = Object.values(offers)[0];
            await pc.setRemoteDescription(hostOffer);

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await fetch("/webrtc/answer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(answer)
            });
        }

        // Récupération ICE une seule fois
        setTimeout(async () => {
            const res = await fetch("/webrtc/candidates");
            const cands = await res.json();
            for (const c of cands) {
                try { await pc.addIceCandidate(c); } catch {}
            }
        }, 1500);
    }

    micBtn.addEventListener("click", async () => {
        if (!localStream) {
            await startMicro();
            await startWebRTC();
            micBtn.textContent = "Désactiver micro";
        } else {
            audioTrack.enabled = !audioTrack.enabled;
            micBtn.textContent = audioTrack.enabled ? "Désactiver micro" : "Activer micro";
        }
    });

    muteBtn.addEventListener("click", () => {
        if (!audioTrack) return;
        audioTrack.enabled = !audioTrack.enabled;
        muteBtn.textContent = audioTrack.enabled ? "Mute" : "Unmute";
    });

    micSelect.addEventListener("change", async () => {
        if (!micSelect.value) return;
        await startMicro(micSelect.value);
    });
})();
