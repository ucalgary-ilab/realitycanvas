
import Canvas from "./canvas.js";
import Physic from "./physic.js"
import Stage from "./stage.js"
import cv from "../opencv/opencv"
import { lstat } from "fs";


class App {
    canvas = new Canvas();

    constructor() {

    }
};


// create application instance
const app = new App();

let opencvPlane = document.getElementById('opencv');
let konvaPlane = document.getElementById('konva');

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

// register button event handlers
const save = () => {
    app.canvas.save_particle();
    app.canvas.mode = "binding"
}
document.getElementById('save_button')?.addEventListener('click', save)

const contour = () => {
    app.canvas.save_particle();
    app.canvas.mode = "contouring";
}
document.getElementById('contour_button')?.addEventListener('click', contour)

const emit = () => {
    app.canvas.mode = "emitting";
}

document.getElementById('emit_button')?.addEventListener('click', emit)

const motion = () => {
    app.canvas.trailing_setup();
    app.canvas.mode = "trailing";
}
document.getElementById('motion_button')?.addEventListener('click', motion)








// get video element
let video = document.getElementById("videoInput"); // video is the id of video tag        
const videoLoadingPromise = new Promise((resolve) => {
    video.addEventListener("loadedmetadata", function (_) {
        video.width = this.videoWidth;
        video.height = this.videoHeight;
        resolve();
    });
})

let src;
let dst;
let cap;
let low;
let high;

// get canvas output, opencv would draw on this element
let output = document.getElementById("canvasOutput");
// add listener: the handler would set clicked color for opencv massk & filtering
output.addEventListener("click", (e) => {
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

    console.log(color, color_low, color_high);


    low = new cv.Mat(src.rows, src.cols, src.type(), color_low);
    high = new cv.Mat(src.rows, src.cols, src.type(), color_high);
});


// navigator.getUserMedia = navigator.getUserMedia ||
//     navigator.webkitGetUserMedia ||
//     navigator.mozGetUserMedia;

var constraints = {
    audio: false,
    video: {facingMode: 'environment'},
}

navigator.mediaDevices.getUserMedia(constraints)
    .then(function (stream) {
        let video = document.getElementById('videoInput');
        video.srcObject = stream;
        video.play();
        video.onloadedmetadata = function (e) {
            console.log(video.videoHeight);
            video.width = 1280;
            video.height = 960;
            console.log(video.height, video.width)
            // src = copy of video frame
            src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
            // dst = store the processed frame
            dst = new cv.Mat(video.height, video.width, cv.CV_8UC4);
            
            cap = new cv.VideoCapture(video);

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

                            let toDraw = new cv.MatVector();
                            toDraw.push_back(maxCnt);
                            let color = new cv.Scalar(255, 0, 0);

                            // let allPoints = maxCnt.data32S;
                            // let sumX=0;
                            // let sumY=0;
                            // let numPoints = allPoints.length/2;
                            // for(let i=0; i<allPoints.length; i+=2){
                            //     sumX += allPoints[i];
                            //     sumY += allPoints[i+1];
                            // }

                            // update offset for animation
                            // app.canvas.setPosition(Math.floor(sumX/numPoints),Math.floor(sumY/numPoints));
                            app.canvas.setContourPoints(maxCnt.data32S);
                            // draw the contours
                            for (let i = 0; i < toDraw.size(); ++i) {
                                cv.drawContours(src, toDraw, i, color, 5, cv.LINE_8, new cv.Mat(), 0);
                            }
                        }

                    }


                    cv.imshow("canvasOutput", src);

                    app.canvas.update();
                    // schedule the next one.
                    let delay = 1000 / FPS - (Date.now() - begin);
                    setTimeout(processVideo, delay);
                } catch (err) {
                    console.error(err);
                }
            }

            // schedule the first one.
            setTimeout(processVideo, 0);
        }
    }
    ).catch(err => {
        console.log(err);
    })


window.addEventListener('keydown',(e)=>{
    console.log("key pressed");
    app.canvas.show();
})

window.addEventListener('keyup',(e)=>{
    console.log("key released");
    app.canvas.hide();
})




    // async function (stream) {
    //     // get video stream
    //     video.srcObject = stream;
    //     video.play();

    //     // wait metadata completely loaded on video element
    //     await Promise.resolve(videoLoadingPromise);

