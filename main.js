const APP_ID = "80e64c4b918644f7a2c3e41d2d556b27";

// Replace these with actual valid tokens from Agora dashboard
const TOKEN_MAP = {
    room_1: "007eJxTYOjtPVL52Ozz4elG1RrGqjOmLZP4cDzLwfDs74yAVY6GW40UGCwMUs1Mkk2SLA0tzExM0swTjZKNU00MU4xSTE3NkozMZ5m1ZzQEMjLsKVnAwAiFID4bQ25iZl68IQMDAKNiIAM=",
    room_2: "007eJxTYAgwDpRUvalq+oPljqhObMXMr08fNOuf7UpL2FA9/cKSlm8KDBYGqWYmySZJloYWZiYmaeaJRsnGqSaGKUYppqZmSUbma8zaMxoCGRnWnQ9nZmSAQBCfjSE3MTMv3oiBAQB7HyA3",
    room_3: "007eJxTYAgwDpRUvalq+oPljqhObMXMr08fNOuf7UpL2FA9/cKSlm8KDBYGqWYmySZJloYWZiYmaeaJRsnGqSaGKUYppqZmSUbma8zaMxoCGRnWnQ9nZmSAQBCfjSE3MTMv3oiBAQB7HyA3"
};

function getRoomFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('room')?.toLowerCase() || 'main';
}

const CHANNEL = getRoomFromURL();
const TOKEN = TOKEN_MAP[CHANNEL];

if (!TOKEN) {
    alert(`No token found for room: ${CHANNEL}`);
    throw new Error(`Missing token for room "${CHANNEL}"`);
}

document.getElementById('room-name-display').innerText = `Room: ${CHANNEL}`;

const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

let localTracks = [];
let remoteUsers = {};

let joinAndDisplayLocalStream = async () => {
    client.on('user-published', handleUserJoined);
    client.on('user-left', handleUserLeft);

    let UID = await client.join(APP_ID, CHANNEL, TOKEN, null);
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();

    let player = `
        <div class="video-container" id="user-container-${UID}">
            <div class="video-player" id="user-${UID}"></div>
        </div>
    `;
    document.getElementById('video-streams').insertAdjacentHTML('beforeend', player);
    localTracks[1].play(`user-${UID}`);

    await client.publish([localTracks[0], localTracks[1]]);
};

let joinStream = async () => {
    await joinAndDisplayLocalStream();
    document.getElementById('stream-controls').style.display = 'flex';
};

let handleUserJoined = async (user, mediaType) => {
    remoteUsers[user.uid] = user;
    await client.subscribe(user, mediaType);

    if (mediaType === 'video') {
        let existingPlayer = document.getElementById(`user-container-${user.uid}`);
        if (existingPlayer) existingPlayer.remove();

        let player = `
            <div class="video-container" id="user-container-${user.uid}">
                <div class="video-player" id="user-${user.uid}"></div>
            </div>
        `;
        document.getElementById('video-streams').insertAdjacentHTML('beforeend', player);
        user.videoTrack.play(`user-${user.uid}`);
    }

    if (mediaType === 'audio') {
        user.audioTrack.play();
    }
};

let handleUserLeft = (user) => {
    delete remoteUsers[user.uid];
    document.getElementById(`user-container-${user.uid}`)?.remove();
};

let leaveAndRemoveLocalStream = async () => {
    for (let i = 0; i < localTracks.length; i++) {
        localTracks[i].stop();
        localTracks[i].close();
    }

    await client.leave();
    document.getElementById('stream-controls').style.display = 'none';
    document.getElementById('video-streams').innerHTML = '';
};

let toggleMic = async (e) => {
    let btn = e.currentTarget;

    if (localTracks[0].muted) {
        await localTracks[0].setMuted(false);
        btn.innerHTML = '<i class="fas fa-microphone"></i>';
        btn.style.backgroundColor = 'cadetblue';
    } else {
        await localTracks[0].setMuted(true);
        btn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
        btn.style.backgroundColor = '#EE4B2B';
    }
};

let toggleCamera = async (e) => {
    let btn = e.currentTarget;

    if (localTracks[1].muted) {
        await localTracks[1].setMuted(false);
        btn.innerHTML = '<i class="fas fa-video"></i>';
        btn.style.backgroundColor = 'cadetblue';
    } else {
        await localTracks[1].setMuted(true);
        btn.innerHTML = '<i class="fas fa-video-slash"></i>';
        btn.style.backgroundColor = '#EE4B2B';
    }
};

document.addEventListener('DOMContentLoaded', joinStream);
document.getElementById('leave-btn').addEventListener('click', leaveAndRemoveLocalStream);
document.getElementById('mic-btn').addEventListener('click', toggleMic);
document.getElementById('camera-btn').addEventListener('click', toggleCamera);
