(() => {
    const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    const remoteAudio = document.createElement("audio");
    remoteAudio.autoplay = true;
    document.body.appendChild(remoteAudio);

    let localStream;

    async function start() {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStream.getTracks().forEach(t => pc.addTrack(t, localStream));

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

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        await fetch("/webrtc/offer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(offer)
        });

        // récupération des answers
        setInterval(async () => {
            const res = await fetch("/webrtc/answers");
            const answers = await res.json();
            for (const a of Object.values(answers)) {
                if (!pc.currentRemoteDescription) {
                    await pc.setRemoteDescription(a);
                }
            }
        }, 1000);

        // récupération des candidates
        setInterval(async () => {
            const res = await fetch("/webrtc/candidates");
            const cands = await res.json();
            for (const c of cands) {
                try {
                    await pc.addIceCandidate(c);
                } catch {}
            }
        }, 1000);
    }

    start();
})();

