const videoPlayer = document.getElementById('video_payer');
const nextLink = document.getElementById('next_link');


function reloader(e) {
    location.reload();
}

function autoNext(e) {
    console.log("Loading next: ", nextLink.href);
    location.assign(nextLink.href);
}

if(videoPlayer.className == 'autoNext') {
    videoPlayer.addEventListener('ended',autoNext,false);
} else {
    videoPlayer.addEventListener('ended',reloader,false);
}