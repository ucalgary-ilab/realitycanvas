
import Canvas from "./canvas.js";
import Physic from "./physic.js"
import Stage from "./stage.js"
import cv from "../opencv/opencv"
import { lstat } from "fs";


class App {
    canvas = new Canvas();

    constructor() {

        let video = document.getElementById("videoInput"); // video is the id of video tag
        video.width = 1;
        video.height = 1;
        
        const videoLoadingPromise = new Promise((resolve)=>{
            video.addEventListener( "loadedmetadata", function (_) {
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
        let lastX;
        let lastY;

        let output = document.getElementById("canvasOutput");
        
        output.addEventListener("click", (e) => {

            let color = src.ucharPtr(e.layerY, e.layerX);
            let range = 15;

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
                    color_high.push(color[i]+range);
                }
            }
            color_low.push(255);
            color_high.push(255);

            console.log(color, color_low, color_high);

            low = new cv.Mat(src.rows, src.cols, src.type(), color_low);
            high = new cv.Mat(src.rows, src.cols, src.type(), color_high);
        });



        navigator.mediaDevices
            .getUserMedia({ video: true, audio: false })
            .then(async function (stream) {
                // videoWidth / videoHeight = width / height = innerWidth / x
                // x/innerWidth = videoHeight /videoWidth =?> 
                // console.log(video)
                // console.log(video.videoWidth, video.videoHeight)
                // video.width = video.videoWidth
                // video.height = video.videoHeight 


                video.srcObject = stream;
                video.play();

                await Promise.resolve(videoLoadingPromise);
                

                src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
                dst = new cv.Mat(video.height, video.width, cv.CV_8UC4);
                cap = new cv.VideoCapture(video);

                const FPS = 30;
                function processVideo() {
                    try {

                        let begin = Date.now();
                        // start processing.
                        cap.read(src);
                        // cv.cvtColor(src, src, cv.COLOR_RGBA2);


                        if (low && high) {
                            cv.inRange(src, low, high, dst);
                            let contours = new cv.MatVector();
                            let hierarchy = new cv.Mat();
                            cv.findContours(dst, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);

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

                            if (maxCnt && maxCnt.data32S) {

                                let toDraw = new cv.MatVector();
                                toDraw.push_back(maxCnt);
                                let color = new cv.Scalar(255, 0, 0);



                                let allPoints = maxCnt.data32S;
                                let sumX=0;
                                let sumY=0;
                                let numPoints = allPoints.length/2;
                                for(let i=0; i<allPoints.length; i+=2){
                                    sumX += allPoints[i];
                                    sumY += allPoints[i+1];
                                }

                                
                                app.canvas.offsetX = Math.floor(sumX/numPoints) - lastX;
                                app.canvas.offsetY = Math.floor(sumY/numPoints) - lastY;

                                lastX = Math.floor(sumX/numPoints);
                                lastY = Math.floor(sumY/numPoints);

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
            })
            .catch(function (err) {
                console.log("An error occurred! " + err);
            });

    }
};


// create application instance
const app = new App();

let opencvPlane = document.getElementById('opencv');
let konvaPlane = document.getElementById('konva');

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
}
document.getElementById('save_button')?.addEventListener('click', save)


const emit = () => {
    app.canvas.mode = "emitting";
}

document.getElementById('emit_button')?.addEventListener('click', emit)

const motion = () => {
    app.canvas.mode = "motion";
}
document.getElementById('motion_button')?.addEventListener('click', motion)


