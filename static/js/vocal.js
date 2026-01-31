const localAudio = document.getElementById("localAudio");
navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    localAudio.srcObject = stream;
    // Ici: créer un Peer pour chaque personne connectée
});
