(() => {
    const micBtn = document.getElementById("mic-Btn");
    const muteBtn = document.getElementById("mute-btn");
    const micSelect = document.getElementById("micSelect");

    const peers = {};
    let localStream = null;
    let pc = null;

    async function startMicro(deviceId = null) {
        if (localStream) localStream.getTracks().forEach(t => t.stop());

        const constraints = { audio: deviceId ? { deviceId: { exact: deviceId } } : true };
        localStream = await navigator.mediaDevices.getUserMedia(constraints);

        const devices = await navigator.mediaDevices.enumerateDevices();
        micSelect.innerHTML = "";
        devices.filter(d => d.kind === "audioinput").forEach((d, i) => {
            const opt = document.createElement("option");
            opt.value = d.deviceId;
            opt.textContent = d.label || `Micro ${i + 1}`;
            micSelect.appendChild(opt);
        });
    }

    async function initMicSelect() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    micSelect.innerHTML = "";

    devices
        .filter(d => d.kind === "audioinput")
        .forEach((device, index) => {
            const option = document.createElement("option");
            option.value = device.deviceId;
            option.textContent = device.label || `Micro ${index + 1}`;
            micSelect.appendChild(option);
        });
    }

    async function changeMicro(deviceId) {
    if (!deviceId) return;

    // Nouveau flux audio
    const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } }
    });

    const newTrack = newStream.getAudioTracks()[0];

    // Stop ancien micro
    if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
    }

    localStream = newStream;

    // Remplacer la piste audio pour chaque peer
    Object.values(peers).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track && s.track.kind === "audio");
        if (sender) {
            sender.replaceTrack(newTrack);
        }
        });
    }


    async function createPeer() {
        pc = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        });

        localStream.getTracks().forEach(t => pc.addTrack(t, localStream));

        pc.ontrack = e => {
            let audio = document.getElementById("remoteAudio");
            if (!audio) {
                audio = document.createElement("audio");
                audio.id = "remoteAudio";
                audio.autoplay = true;
                document.body.appendChild(audio);
            }
            audio.srcObject = e.streams[0];
        };

        pc.onicecandidate = e => {
            if (e.candidate) {
                fetch("/webrtc/send", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        to: "all",
                        type: "candidate",
                        payload: e.candidate
                    })
                });
            }
        };
    }

    async function sendOffer() {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        await fetch("/webrtc/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                to: "all",
                type: "offer",
                payload: offer
            })
        });
    }

    async function pollSignals() {
        const res = await fetch("/webrtc/poll");
        const signals = await res.json();

        for (const s of signals) {
            if (s.type === "offer") {
                await pc.setRemoteDescription(s.payload);
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                await fetch("/webrtc/send", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        to: s.from_user,
                        type: "answer",
                        payload: answer
                    })
                });
            }

            if (s.type === "answer") {
                await pc.setRemoteDescription(s.payload);
            }

            if (s.type === "candidate") {
                try {
                    await pc.addIceCandidate(s.payload);
                } catch {}
            }
        }

        setTimeout(pollSignals, 1500);
    }

    micBtn.addEventListener("click", async () => {
        if (!localStream) {
            await startMicro();
            await initMicSelect();
            await connectToPeers();
            pollCandidates();
            micBtn.textContent = "Désactiver micro";
        } else {
            const track = localStream.getAudioTracks()[0];
            track.enabled = !track.enabled;
            micBtn.textContent = track.enabled ? "Désactiver micro" : "Activer micro";
        }
    });

    muteBtn.addEventListener("click", () => {
        if (!localStream) return;
        const track = localStream.getAudioTracks()[0];
        track.enabled = !track.enabled;
        muteBtn.textContent = track.enabled ? "Mute" : "Unmute";
    });

    micSelect.addEventListener("change", async () => {
        await startMicro(micSelect.value);
    });
})();


