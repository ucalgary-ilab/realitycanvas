
import Canvas from "./canvas.js";
import Physic from "./physic.js"
import Stage from "./stage.js"
import cv from "../opencv/opencv"


class App {
    // canvas = new Canvas();

    constructor() {


        let video = document.getElementById("videoInput"); // video is the id of video tag
        video.width = window.innerWidth;
        video.height = window.innerHeight;

        navigator.mediaDevices
            .getUserMedia({ video: true, audio: false })
            .then(function (stream) {
                video.srcObject = stream;
                video.play();


                let src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
                let dst = new cv.Mat(video.height, video.width, cv.CV_8UC4);
                let cap = new cv.VideoCapture(video);

                const FPS = 30;
                function processVideo() {
                    try {

                        let begin = Date.now();
                        // start processing.
                        cap.read(src);
                        // cv.cvtColor(src, dst, cv.COLOR_RGBA2BGR);
                        let low = new cv.Mat(src.rows, src.cols, src.type(), [0, 0, 0, 0]);

                        console.log(src.type())
                        let high = new cv.Mat(src.rows, src.cols, src.type(), [150, 150, 150, 255]);
                        cv.inRange(src, low, high, dst);

                        cv.imshow("canvasOutput", dst);
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

// // register button event handlers
// const save = () => {
//     app.canvas.save_particle();
// }
// document.getElementById('save_button')?.addEventListener('click', save)


// const emit = () => {
//     app.canvas.mode = "emitting";
// }

// document.getElementById('emit_button')?.addEventListener('click', emit)

// const motion = () => {
//     app.canvas.mode = "motion";
// }
// document.getElementById('motion_button')?.addEventListener('click', motion)


