const videoPlayer = document.getElementById('video_payer');
const nextLink = videoPlayer.getAttribute('next_link');


function reloader(e) {
    location.reload();
}

function autoNext(e) {
    console.log("Loading next: ", nextLink);
    location.assign(nextLink);
}

if(videoPlayer.className == 'autoNext') {
    videoPlayer.addEventListener('ended',autoNext,false);
} else {
    videoPlayer.addEventListener('ended',reloader,false);
}