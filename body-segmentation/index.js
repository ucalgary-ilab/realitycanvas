
const videoElement = document.getElementsByClassName('input_video')[0];
const canvas = document.getElementById('drawing_canvas');
const context = canvas.getContext('2d');


const MIN_VISIBILITY = 0.8;
const WIDTH = 1280;
const HEIGHT = 720;

let bodyParts;
let currentPart;

videoElement.addEventListener("click", (e) => {
  let theClosetPart;

  // loop through all the body parts to find the closet part to the clicking point
  for (let i = 0; i < bodyParts.length; i++) {
    let thisPart = bodyParts[i];

    // check if the part is visible at all
    if (thisPart.visibility > MIN_VISIBILITY) {
      if (!theClosetPart) {
        theClosetPart = i;
      }
      else {
        let dis1 = Math.pow(bodyParts[theClosetPart].x * WIDTH - e.layerX, 2) + Math.pow(bodyParts[theClosetPart].y * HEIGHT - e.layerY, 2);
        let dis2 = Math.pow(thisPart.x * WIDTH - e.layerX, 2) + Math.pow(thisPart.y * HEIGHT - e.layerY, 2);

        
        if (dis2 < dis1) {
          theClosetPart = i;
        }
      }
    }
  }

  if (theClosetPart) {
    currentPart = theClosetPart;
  }
})


function onResults(results) {
  if (!results.poseLandmarks) {
    return;
  }
  bodyParts = results.poseLandmarks;

  if (currentPart) {
    console.log(currentPart);
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    context.beginPath();
    context.arc(bodyParts[currentPart].x*WIDTH, bodyParts[currentPart].y*HEIGHT, 20, 0, 2 * Math.PI);
    context.stroke();
    // console.log(currentPart);
  }

}

const pose = new Pose({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
  }
});

pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  enableSegmentation: true,
  smoothSegmentation: true,
  minDetectionConfidence: 0.8,
  minTrackingConfidence: 0.8
});


pose.onResults(onResults);


const camera = new Camera(videoElement, {
  onFrame: async () => {
    await pose.send({ image: videoElement });
  },
  width: WIDTH,
  height: HEIGHT
});


camera.start();