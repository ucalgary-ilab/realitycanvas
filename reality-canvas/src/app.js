
import Canvas from "./canvas.js";

const WIDTH = 1280;
const HEIGHT = 720;

let contourOn = false;


class App {
  canvas = new Canvas(WIDTH, HEIGHT);

  constructor() {

  }
};

// create application instance
const app = new App();

// let mediaPlane = document.getElementById('media');
let konvaPlane = document.getElementById('konva');
let opencvPlane = document.getElementById('opencv');


// color picker
let colorPicker = document.getElementById('color-picker');
colorPicker.value = '#FFFFFF'
window.color = '#FFFFFF';
colorPicker.addEventListener('change', e => {
  // console.log(e.target.value);
  window.color = e.target.value;
});


// thickness
window.thickness = 5
let thickness = document.getElementById('thickness');
thickness.value = '40';
thickness.addEventListener('change', e => {
  // console.log(e.target.value);
  let val = e.target.value / 10;
  val += 1;
  window.thickness = val;
})

const selectButton = document.getElementById('select_button');
const drawButton = document.getElementById('draw_button');
const frameButton = document.getElementById('frame_button');
const saveButton = document.getElementById('save_button');
const emitButton = document.getElementById('emit_button');
const motionButton = document.getElementById('motion_dropdown');
const actionButton = document.getElementById('action_dropdown');
const contourButton = document.getElementById('contour_button');


drawButton.setAttribute('disabled', 'true');
frameButton.setAttribute('disabled', 'true');
saveButton.setAttribute('disabled', 'true');
emitButton.setAttribute('disabled', 'true');
motionButton.setAttribute('disabled', 'true');
actionButton.setAttribute('disabled', 'true');

const disableAll = () => {
  selectButton.setAttribute('disabled', 'true');
  drawButton.setAttribute('disabled', 'true');
  frameButton.setAttribute('disabled', 'true');
  saveButton.setAttribute('disabled', 'true');
  emitButton.setAttribute('disabled', 'true');
  motionButton.setAttribute('disabled', 'true');
  actionButton.setAttribute('disabled', 'true');
}
// hook buttons and handler
const select = () => {
  opencvPlane.style.zIndex = "1";
  konvaPlane.style.zIndex = "0";

  disableAll();
}
selectButton?.addEventListener('click', select)


const draw = () => {
  opencvPlane.style.zIndex = "0";
  konvaPlane.style.zIndex = "1";
}
drawButton?.addEventListener('click', draw)


// this function should add a new frame 
const frame = () => {
  app.canvas.add_frame(bodyParts);
}
frameButton?.addEventListener('click', frame)


// register button event handlers
const save = () => {
  app.canvas.add_frame(bodyParts);
  app.canvas.finish_animation("bind");
  disableAll();
  selectButton.removeAttribute('disabled');
}
saveButton?.addEventListener('click', save)


const emit = () => {
  app.canvas.add_frame(bodyParts);
  app.canvas.finish_animation();
  app.canvas.mode = "emit";
}

emitButton?.addEventListener('click', emit)

const motion = (e) => {
  app.canvas.new_motion(e.target.innerHTML.toLowerCase());
}
document.getElementById('motion_button')?.addEventListener('click', motion)


const action = (e) => {
  app.canvas.add_frame(bodyParts);
  app.canvas.action_setup(e.target.innerHTML);
}
document.getElementById('action_button')?.addEventListener('click', action)


const contour = (e) => {
  if (e.target.innerHTML === 'Full Body') {
    contourOn = !contourOn;
  }
  else if (e.target.innerHTML === 'Line Around') {
    app.canvas.new_contour('line around');
  }
  else if (e.target.innerHTML === "Bottom Up") {
    app.canvas.new_contour('bottom up');
  }
}
contourButton?.addEventListener('click', contour)






// end of buttons' registration
const inputVideo = document.getElementById('input_video');
const videoElement = document.getElementById("input_video");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
const cvOutput = document.getElementById("canvasOutput");


const MIN_VISIBILITY = 0.8;


let bodyParts;

window.contourThickness = 5;
let fpsCountDown = 5;

cvOutput.addEventListener("click", (e) => {
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
    app.canvas.select(theClosetPart, bodyParts[theClosetPart]);
    drawButton.removeAttribute('disabled');
    motionButton.removeAttribute('disabled');
    draw();
  }
})

let cap = new cv.VideoCapture(videoElement);

// event loop
function onResults(results) {
  if (!results.poseLandmarks) {
    return;
  }

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
    results.segmentationMask,
    0,
    0,
    canvasElement.width,
    canvasElement.height
  );


  // get
  let contourData = canvasCtx.getImageData(0, 0, canvasElement.width, canvasElement.height);

  let src = cv.matFromImageData(contourData);
  let dst = new cv.Mat(canvasElement.height, canvasElement.width, cv.CV_8UC4);
  cap.read(dst);

  cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  cv.findContours(src, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);

  let maxArea = 0;
  let maxCnt = null;
  for (let i = 0; i < contours.size(); i++) {
    let cnt = contours.get(i);
    let area = cv.contourArea(cnt, false);

    if (area > maxArea) {
      maxArea = area
      maxCnt = cnt
    }
  }

  let contourPoints = []

  if (maxCnt) {
    contourPoints = [...maxCnt.data32S];
  }

  if (contourOn && maxCnt) {
    let toDraw = new cv.MatVector();
    toDraw.push_back(maxCnt);
    let color = new cv.Scalar(Math.round(Math.random() * 255), Math.round(Math.random() * 255),
      Math.round(Math.random() * 255));


    for (let i = 0; i < toDraw.size(); ++i) {
      cv.drawContours(dst, toDraw, i, color, window.contourThickness, cv.LINE_8, new cv.Mat(), 0);
      if (window.contourThickness < 0) {
        if (fpsCountDown > 0) {
          fpsCountDown -= 1;
        }
        else {
          fpsCountDown = 5;
          window.contourThickness = 5;
        }
      }
    }

    toDraw.delete();
  }

  cv.imshow('canvasOutput', dst);
  src.delete();
  dst.delete();
  contours.delete();
  hierarchy.delete();


  canvasCtx.restore();

  bodyParts = results.poseLandmarks;
  // update highlights
  app.canvas.update_highlights(bodyParts);
  app.canvas.update(bodyParts, contourPoints);
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
  height: HEIGHT,
  facingMode: 'environment'
});

camera.start();