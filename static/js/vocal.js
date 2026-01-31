const localAudio = document.getElementById("localAudio");
navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    localAudio.srcObject = stream;
    // Ici tu peux créer un Peer avec simple-peer ou adapter à Supabase pour signaling
});

document.getElementById("mute-btn").addEventListener("click", () => {
    localAudio.srcObject.getAudioTracks()[0].enabled = !localAudio.srcObject.getAudioTracks()[0].enabled;
});
