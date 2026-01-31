(() => {
    const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    const remoteAudio = document.createElement("audio");
    remoteAudio.autoplay = true;
    document.body.appendChild(remoteAudio);

    async function start() {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => pc.addTrack(t, stream));

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

        // Vérifie s'il existe déjà une offer
        const offersRes = await fetch("/webrtc/offers");
        const offers = await offersRes.json();

        if (!offers || Object.keys(offers).length === 0) {
            // 🧠 JE SUIS LE PREMIER → HOST
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            await fetch("/webrtc/offer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(offer)
            });
        } else {
            // 👤 JE REJOINS → CLIENT
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

        // ICE candidates (UNE FOIS)
        setTimeout(async () => {
            const res = await fetch("/webrtc/candidates");
            const cands = await res.json();
            for (const c of cands) {
                try { await pc.addIceCandidate(c); } catch {}
            }
        }, 1500);
    }

    start();
})();
