(() => {
    const micBtn = document.getElementById("mic-Btn");
    const muteBtn = document.getElementById("mute-btn");
    const micSelect = document.getElementById("micSelect");

    const peers = {}; // username => RTCPeerConnection
    let localStream = null;

    async function initMicSelect() {
        const devices = await navigator.mediaDevices.enumerateDevices();
        micSelect.innerHTML = "";

        devices
            .filter(d => d.kind === "audioinput")
            .forEach((d, i) => {
                const opt = document.createElement("option");
                opt.value = d.deviceId;
                opt.textContent = d.label || `Micro ${i + 1}`;
                micSelect.appendChild(opt);
            });
    }

    async function startMicro(deviceId = null) {
        if (localStream) localStream.getTracks().forEach(t => t.stop());

        localStream = await navigator.mediaDevices.getUserMedia({
            audio: deviceId ? { deviceId: { exact: deviceId } } : true
        });

        document.getElementById("localAudio").srcObject = localStream;
    }

    async function changeMicro(deviceId) {
        if (!deviceId) return;

        const newStream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: deviceId } }
        });

        const newTrack = newStream.getAudioTracks()[0];

        localStream.getTracks().forEach(t => t.stop());
        localStream = newStream;

        Object.values(peers).forEach(pc => {
            const sender = pc.getSenders().find(s => s.track?.kind === "audio");
            if (sender) sender.replaceTrack(newTrack);
        });
    }

    async function connectToPeers() {
        const res = await fetch("/webrtc/offers");
        const offers = await res.json();

        for (const [username, offer] of Object.entries(offers)) {
            if (username === USERNAME || peers[username]) continue;

            const pc = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
            });

            peers[username] = pc;
            localStream.getTracks().forEach(t => pc.addTrack(t, localStream));

            pc.ontrack = e => {
                let audio = document.getElementById(`audio-${username}`);
                if (!audio) {
                    audio = document.createElement("audio");
                    audio.id = `audio-${username}`;
                    audio.autoplay = true;
                    document.body.appendChild(audio);
                }
                audio.srcObject = e.streams[0];
            };

            pc.onicecandidate = e => {
                if (e.candidate) {
                    fetch("/webrtc/candidate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ to: username, candidate: e.candidate })
                    });
                }
            };

            await pc.setRemoteDescription(offer);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await fetch("/webrtc/answer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ to: username, answer })
            });
        }
    }

    async function pollCandidates() {
        const res = await fetch("/webrtc/candidates");
        const cands = await res.json();

        for (const c of cands) {
            const pc = peers[c.to];
            if (pc) {
                try { await pc.addIceCandidate(c.candidate); } catch {}
            }
        }
        setTimeout(pollCandidates, 1000);
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

    micSelect.addEventListener("change", () => {
        changeMicro(micSelect.value);
    });
})();
