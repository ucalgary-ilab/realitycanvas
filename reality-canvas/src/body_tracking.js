
import { update } from "lodash";
import Canvas from "./canvas.js";

const WIDTH = 1280;
const HEIGHT = 720;


class App {
  canvas = new Canvas(WIDTH, HEIGHT);

  constructor() {

  }
};



// create application instance
const app = new App();

let mediaPlane = document.getElementById('media');
let konvaPlane = document.getElementById('konva');

// hook buttons and handler
const select = () => {
  mediaPlane.style.zIndex = "1";
  konvaPlane.style.zIndex = "0";
}
document.getElementById('select_button')?.addEventListener('click', select)


const draw = () => {
  mediaPlane.style.zIndex = "0";
  konvaPlane.style.zIndex = "1";
}
document.getElementById('draw_button')?.addEventListener('click', draw)

// register button event handlers
const save = () => {
  app.canvas.bind_drawing();
  app.canvas.mode = "binding"
}
document.getElementById('save_button')?.addEventListener('click', save)

const contour = () => {
  app.canvas.bind_drawing();
  app.canvas.mode = "contouring";
}
document.getElementById('contour_button')?.addEventListener('click', contour)

const emit = () => {
  app.canvas.mode = "emit";
}

document.getElementById('emit_button')?.addEventListener('click', emit)

const motion = () => {
  app.canvas.trailing_setup();
  app.canvas.mode = "trailing";
}
document.getElementById('motion_button')?.addEventListener('click', motion)




const inputVideo = document.getElementById('input_video');

const MIN_VISIBILITY = 0.8;


let bodyParts;

inputVideo.addEventListener("click", (e) => {
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
    //
    app.canvas.select(theClosetPart,bodyParts[theClosetPart]);
    draw();
  }
})


// event loop
function onResults(results) {
  if (!results.poseLandmarks) {
    return;
  }
  bodyParts = results.poseLandmarks;

  // update highlights
  app.canvas.update_highlights(bodyParts);
  app.canvas.update(bodyParts);
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

const camera = new Camera(inputVideo, {
  onFrame: async () => {
    await pose.send({ image: inputVideo });
  },
  width: WIDTH,
  height: HEIGHT
});

camera.start();

