
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


// hook buttons and handler
const select = () => {
    opencvPlane.style.zIndex = "1";
    konvaPlane.style.zIndex = "0";
}
document.getElementById('select_button')?.addEventListener('click', select)


const draw = () => {
    opencvPlane.style.zIndex = "0";
    konvaPlane.style.zIndex = "1";
}
document.getElementById('draw_button')?.addEventListener('click', draw)


// this function should add a new frame 
const frame = () => {
    app.canvas.add_frame(bodyParts);
}
document.getElementById('frame_button')?.addEventListener('click', frame)


// register button event handlers
const save = () => {
    app.canvas.add_frame(bodyParts);
    app.canvas.finish_animation("bind");
}
document.getElementById('save_button')?.addEventListener('click', save)


const emit = () => {
    app.canvas.add_frame(bodyParts);
    app.canvas.finish_animation();
    app.canvas.mode = "emit";
}

document.getElementById('emit_button')?.addEventListener('click', emit)

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
document.getElementById('contour_button')?.addEventListener('click', contour)




window.app = app

// end of buttons' registration
const inputVideo = document.getElementById('input_video');
const videoElement = document.getElementById("input_video");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
const cvOutput = document.getElementById("canvasOutput");

// get canvas output, opencv would draw on this element
let output = document.getElementById("canvasOutput");

// we are only tracking one element, faking the object as a body
let bodyParts = [{ x: -1, y: -1, id: 0, visibility: 0.9 }];
let newSelect = false;

let src;
let dst;
let cap;
let low;
let high;
let lastX;
let lastY;

// add listener: the handler would set clicked color for opencv mask & filtering
cvOutput.addEventListener("click", (e) => {
    // get color by coordinate, note that this has to be src[y,x] not src[x,y]
    let color = src.ucharPtr(e.layerY, e.layerX);

    // threshold for mask
    let range = 15;

    // get upper bound and lower bound
    let color_low = [];
    let color_high = [];
    for (let i = 0; i < color.length - 1; i++) {

        if (color_low[i] - range < 0) {
            color_low.push(0);
        }
        else {
            color_low.push(color[i] - range);
        }
        if (color_high[i] + range > 255) {
            color_high.push(255);
        }
        else {
            color_high.push(color[i] + range);
        }
    }
    color_low.push(255);
    color_high.push(255);



    low = new cv.Mat(src.rows, src.cols, src.type(), color_low);
    high = new cv.Mat(src.rows, src.cols, src.type(), color_high);

    if (!newSelect) {
        newSelect = true;
    }
});



navigator.mediaDevices
    .getUserMedia({
        video: {
            facingMode: {
                exact: 'environment'
            }
        }, audio: false,
    })
    .then(async function (stream) {
        // get video stream
        inputVideo.srcObject = stream;
        inputVideo.play();


        // src = copy of video frame
        src = new cv.Mat(720, 1280, cv.CV_8UC4);
        // dst = store the processed frame
        dst = new cv.Mat(720, 1280, cv.CV_8UC4);

        cap = new cv.VideoCapture(inputVideo);

        const FPS = 30;

        function processVideo() {
            try {
                // for timing
                let begin = Date.now();
                // start processing.
                cap.read(src);
                // cv.cvtColor(src, src, cv.COLOR_RGBA2);

                // if lower bound and upper bound are set
                if (low && high) {
                    // filter out contours
                    cv.inRange(src, low, high, dst);

                    let contours = new cv.MatVector();
                    let hierarchy = new cv.Mat();
                    // get remaining contours and hierachy
                    cv.findContours(dst, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);

                    // find the largest are of contours
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

                    // if there is a contour exist in the frame, draw
                    if (maxCnt && maxCnt.data32S) {
                        let allPoints = maxCnt.data32S;
                        let sumX = 0;
                        let sumY = 0;
                        let numPoints = allPoints.length / 2;
                        for (let i = 0; i < allPoints.length; i += 2) {
                            sumX += allPoints[i];
                            sumY += allPoints[i + 1];
                        }

                        // update bodyParts
                        bodyParts[0].x = Math.floor(sumX / numPoints) / 1280;
                        bodyParts[0].y = Math.floor(sumY / numPoints) / 720;


                        // add new select
                        if (newSelect) {
                            newSelect = false;
                            app.canvas.select(0, bodyParts[0]);
                            draw();
                        }
                        app.canvas.update_highlights(bodyParts)
                        app.canvas.update(bodyParts, maxCnt.data32S)
                        // let toDraw = new cv.MatVector();
                        // toDraw.push_back(maxCnt);
                        // let color = new cv.Scalar(255, 0, 0);

                        // for (let i = 0; i < toDraw.size(); ++i) {
                        //     cv.drawContours(src, toDraw, i, color, 5, cv.LINE_8, new cv.Mat(), 0);
                        // }
                    }
                    else {
                        app.canvas.update_highlights(bodyParts)
                        app.canvas.update(bodyParts, []);
                    }

                }

                cv.imshow("canvasOutput", src);
                // schedule the next one.
                let delay = 1000 / FPS - (Date.now() - begin);
                setTimeout(processVideo, delay);
            } catch (err) {
                console.error(err);
            }
        }

        // schedule the first one.
        setTimeout(processVideo, 0);
    })
    .catch(function (err) {
        console.log("An error occurred! " + err);
    });
