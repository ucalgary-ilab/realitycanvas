
import Canvas from "./canvas.js";
import Physic from "./physic.js"
import Stage from "./stage.js"
import cv from "../opencv/opencv"


class App {
    // canvas = new Canvas();

    constructor() {

        // alert("working")
        let video = document.getElementById("videoInput"); // video is the id of video tag
        video.width = window.innerWidth;
        video.height = window.innerHeight;
        // video.width = 720
        // video.height = 480
        let src;
        let dst;
        let cap;
        let low;
        let high;

        let output = document.getElementById("canvasOutput");

        output.addEventListener("click", (e) => {
           

            /*
                Man! I have been struggled so long!

                It turns out that I need to supply ucharPtr with (y,x) instead of (x,y)
            */


            let color = src.ucharPtr(e.clientY,e.clientX);
            
            low = new cv.Mat(src.rows, src.cols, src.type(), [color[0]-20,color[1]-20,color[2]-20,color[3]]);
            high = new cv.Mat(src.rows, src.cols, src.type(), [color[0]+20,color[1]+20,color[2]+20,color[3]]);
        });



        navigator.mediaDevices
            .getUserMedia({ video: true, audio: false })
            .then(function (stream) {
                video.srcObject = stream;
                video.play();


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
                        

                        if(low&&high)
                        {
                            cv.inRange(src, low, high, dst);
                            let contours = new cv.MatVector();
                            let hierarchy = new cv.Mat();
                            cv.findContours(dst, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
    
                            let maxArea = 0;
                            let maxCnt = null;

                            for(let i=0; i < contours.size(); i++){
                                let cnt = contours.get(i);
                                let area = cv.contourArea(cnt, false);
                                
                                if(area > maxArea)
                                {
                                    maxArea = area 
                                    maxCnt = cnt
                                }
                            }

                            if(maxCnt){

                                let toDraw = new cv.MatVector();
                                toDraw.push_back(maxCnt);
                                console.log(maxCnt);
                                let color = new cv.Scalar(255, 0, 0)
                
                                for (let i = 0; i < toDraw.size(); ++i) {
                                    
                                    cv.drawContours(src, toDraw, i, color, 5, cv.LINE_8, hierarchy, 0);
                                }
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


