
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
            console.log(e);
            console.log('image width: ' + src.cols + '\n' +
            'image height: ' + src.rows + '\n' +
            'image size: ' + src.size().width + '*' + src.size().height + '\n' +
            'image depth: ' + src.depth() + '\n' +
            'image channels ' + src.channels() + '\n' +
            'image type: ' + src.type() + '\n');

            // for(let i=0;i<src.rows;i++)
            // {
            //     for(let  j=0;j<src.cols;j++)
            //     {
            //         if(src.ucharPtr(i,j)==[0,0,0,0]){
            //             console.log(i,j);
            //             break;
            //         }
            //     }
            // }

            console.log(src.ucharPtr(e.clientY,e.clientX));

            // low = new cv.Mat(src.rows, src.cols, src.type(), [color[0]-50,color[1]-50,color[2]-50,color[3]-100]);

            // high = new cv.Mat(src.rows, src.cols, src.type(), [color[0]+50,color[1]+50,color[2]+50,color[3]]);
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
                        
                        // if(low&&high)
                        // {
                        //     cv.inRange(src, low, high, dst);

                        //     cv.imshow("canvasOutput", dst);
                        // }
                        // else 
                        // {

                        cv.imshow("canvasOutput", src);
                        // }

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


