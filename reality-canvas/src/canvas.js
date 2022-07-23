// @ts-ignore
// import Physic from "./physic.js"
import Stage from "./stage.js"
import Konva from 'konva'
// import _ from 'lodash'
// import particle from "./particle.js"

export default class Canvas {
    isPaint = false
    mode = "drawing"


    lastPosition = [0, 0]
    currPosition = [0, 0]


    // currentLine keeps current drawing line, might be a very bad name
    currentLine
    // shape is defined by an array of konva lines
    currentShape = []

    // motion line 
    motionLine = []
    stage = new Stage()

    contourPoints = []
    sortedPoints = []
    velocity = 0

    bodyPartID = []
    bodyPartHighlights = []
    savedShapes = []
    firstPointOffset = []



    FPScount = 0
    WIDTH = 0
    HEIGHT = 0

    particles = []

    constructor(width, height) {
        this.WIDTH = width;
        this.HEIGHT = height;

        this.stage.stage.on('mousedown touchstart', e => {
            // put down the pen, i.e, painting
            this.isPaint = true;
            // get the current pointed position on the stage
            let pos = this.stage.stage.getPointerPosition();

            let color;
            switch (this.mode) {
                case 'emitting':
                    color = '#3cb043';    // emitting = green
                    break;
                case 'motion':
                    color = '#29446f';    // motion = blue
                    break;
                default:
                    color = '#ffffff';    // drawing = red
            }

            // if the pos is not null
            if (pos) {
                //  create new konva line, store it in the this.currentLine
                this.lastPosition = pos;
                this.currentLine = new Konva.Line({
                    stroke: color,
                    strokeWidth: 8,
                    globalCompositeOperation: 'source-over',
                    // round cap for smoother lines
                    lineCap: 'round',
                    // add point twice, so we have some drawings even on a simple click
                    points: [pos.x, pos.y],
                });
                this.stage.layer.add(this.currentLine);
            }
        });


        this.stage.stage.on('mouseup touchend', () => {
            this.isPaint = false;

            switch (this.mode) {
                case "emitting":
                    this.emit();
                    break;
                case "motion":
                    this.add_motion();
                    break;
                default:
                    // save the line into current shape
                    this.currentShape.push(this.currentLine);
                    // reset current line
                    this.currentLine = null;
                    ;
            }
        });



        // and core function - drawing
        this.stage.stage.on('mousemove touchmove', e => {

            // if pen is not down, i.e, not drawing, abort
            if (!this.isPaint) {
                return;
            }

            // prevent scrolling on touch devices
            e.evt.preventDefault();

            // get the current pointed position on the stage
            let pos = this.stage.stage.getPointerPosition();

            /* if the position is not empty and this position is not equal to last position,
                expand the currentLine by appending new points.

                Note: technically, you can have consecutively repeating points for drawing;
                however, you will update more (unnecessary) points.
            */

            //@ts-ignore
            if (pos && this.position != pos) {

                // immutable copy and update
                var newPoints = this.currentLine.points().concat([pos.x, pos.y]);
                this.currentLine.points(newPoints);

                // update last position
                this.lastPosition = pos;
            }
        });
    }


    save_particle() {

        // calculate the offset of first point of the first line of the shape to the tracking point
        this.firstPointOffset.push({
            x: this.bodyPartHighlights[this.bodyPartHighlights.length - 1].absolutePosition().x - this.currentShape[0].attrs.points[0],
            y: this.bodyPartHighlights[this.bodyPartHighlights.length - 1].absolutePosition().y - this.currentShape[0].attrs.points[1]
        })

        
        console.log(this.firstPointOffset[this.bodyPartHighlights.length - 1]);

        // save current shape, savedShape is an array of array of konva lines
        this.savedShapes.push(this.currentShape);
        // reset current shape
        this.currentShape = [];
    }

    emit_setup(){
        let numberOfParticles = 100;
        for(let i=0; i < numberOfParticles; i++){
            this.particles.push(new );
        }
    }

    select(id, bodyPart) {
        if (!this.bodyPartID.includes(bodyPart.id)) {
            // get id of the body part
            this.bodyPartID.push(id);
            let highlight = new Konva.Circle({
                radius: 2,
                fill: 'green',
                stroke: 'green',
                strokeWidth: 3
            });

            // set position
            highlight.absolutePosition({
                x: Math.floor(bodyPart.x * this.WIDTH),
                y: Math.floor(bodyPart.y * this.HEIGHT)
            });

            // show on stage
            this.stage.layer.add(highlight);
            // record
            this.bodyPartHighlights.push(highlight);

        }
    }


    update_highlights(bodyParts) {
        for (let i = 0; i < this.bodyPartID.length; i++) {
            // get the id of tracking body part
            let id = this.bodyPartID[i];

            // get the corresponding body part in the landmarks
            let bodyPart = bodyParts[id];

            // if it is visible
            if (bodyPart.visibility > 0.8) {
                // update the position
                this.bodyPartHighlights[i].absolutePosition({
                    x: Math.floor(bodyPart.x * this.WIDTH),
                    y: Math.floor(bodyPart.y * this.HEIGHT)
                });
            }
        }
    }

    update(bodyParts) {
        switch (this.mode) {
            case "binding":
                this.binding(bodyParts);
                break;
            case "contouring":
                this.contouring();
                break;
            case "emitting2":
                this.emitting();
                break;
            case "trailing":
                this.trailing();
                break;
            default:
                ;
        }
    }




    binding(bodyParts) {

        for (let i = 0; i < this.savedShapes.length; i++) {
            let bodyPart = bodyParts[this.bodyPartID[i]];

            // 500
            let offsetX = Math.floor((bodyPart.x * this.WIDTH) - this.firstPointOffset[i].x - this.savedShapes[i][0].attrs.points[0]);
            // 40
            let offsetY = Math.floor((bodyPart.y * this.HEIGHT) - this.firstPointOffset[i].y - this.savedShapes[i][0].attrs.points[1]);


            console.log(offsetX, offsetY);

            this.savedShapes[i].map(line => {
                let newPoints = [];
                for (let i = 0; i < line.attrs.points.length; i += 2) {
                    newPoints.push(line.attrs.points[i] + offsetX);
                    newPoints.push(line.attrs.points[i + 1] + offsetY);
                }
                // update the points
                line.points(newPoints);
            });

        }
    }






    // // set the position of the tracked object
    // setPosition(x, y) {
    //     this.velocity = Math.floor(Math.sqrt((x - this.currPosition[0]) * (x - this.currPosition[0]) + (y - this.currPosition[1]) * (y - this.currPosition[1])));
    //     this.lastPosition = this.currPosition;
    //     this.currPosition = [x, y];
    // }

    // setContourPoints(points) {
    //     this.contourPoints = points;

    //     //  calculating the center
    //     let sumX = 0;
    //     let sumY = 0;
    //     let numPoints = points.length / 2;
    //     for (let i = 0; i < points.length; i += 2) {
    //         sumX += points[i];
    //         sumY += points[i + 1];
    //     }

    //     // set center
    //     this.setPosition(Math.floor(sumX / numPoints), Math.floor(sumY / numPoints));
    //     // this.setContourPoints();
    //     this.sortContourPoints();
    // }


    // sortContourPoints() {
    //     let angles = []

    //     // get angles with respect to the center
    //     for (let i = 0; i < this.contourPoints.length; i += 2) {
    //         let x = this.contourPoints[i];
    //         let y = this.contourPoints[i + 1];
    //         angles.push({ x: x, y: y, angle: Math.atan2(y - this.currPosition[1], x - this.currPosition[0]) * 180 / Math.PI + 180 });
    //     }

    //     this.sortedPoints = angles.sort((a, b) => a.angle - b.angle);
    //     // console.log(this.sortedPoints);
    //     // alert('halt');
    // }

    // contouring() {

    //     if (this.savedShapes[0] && this.sortedPoints.length > 0) {
    //         this.savedShapes[0].map(line => {
    //             let newPoints = [];

    //             for (let i = 2; i < line.attrs.points.length; i += 2) {
    //                 newPoints.push(line.attrs.points[i]);
    //                 newPoints.push(line.attrs.points[i + 1]);
    //             }
    //             // get the head
    //             let x = newPoints[newPoints.length - 2];
    //             let y = newPoints[newPoints.length - 1];
    //             let head = { x: x, y: y, angle: Math.atan2(y - this.currPosition[1], x - this.currPosition[0]) * 180 / Math.PI + 180 };

    //             let i = 0;
    //             while (i < this.sortedPoints.length && head.angle > this.sortedPoints[i].angle) {
    //                 i++;
    //             }

    //             let nextPoint = i < this.sortedPoints.length - 1 ? this.sortedPoints[i + 1] : this.sortedPoints[0];
    //             newPoints.push(nextPoint.x);
    //             newPoints.push(nextPoint.y);

    //             // update the points
    //             line.points(newPoints);
    //         });
    //     }
    // }


    // trailing_setup() {
    //     this.currentLine = new Konva.Line({
    //         stroke: "#add8e6",
    //         strokeWidth: 5,
    //         globalCompositeOperation: 'source-over',
    //         // round cap for smoother lines
    //         lineCap: 'round',
    //         // add point twice, so we have some drawings even on a simple click
    //         points: [],
    //     });
    //     this.stage.layer.add(this.currentLine);
    // }



    // trailing() {
    //     let points = this.currentLine.attrs.points;
    //     let length = points.length;

    //     if (this.velocity < 20) {
    //         if (length > 4)
    //             points = points.slice(4)
    //         else
    //             points = points.slice(length)
    //     }

    //     points.push(this.currPosition[0]);
    //     points.push(this.contourPoints[1]);
    //     this.currentLine.points(points);
    // }


    // // add_motion(){
    // //     let motionVertex = this.currentLine.attrs.points;

    // //     // transform to something that matter needs
    // //     let motionVertexSet = []
    // //     for (let i = 0; i < motionVertex.length; i += 2) {
    // //         motionVertexSet.push({ x: motionVertex[i], y: motionVertex[i + 1] })
    // //     }
    // //     this.physic.add_motion(motionVertexSet);
    // // }

    // emit() {
    //     let k = 0;

    //     this.particles.map(particle => {
    //         k++;
    //         if (k == 1) {
    //             particle.lines = this.savedShapes[0];
    //         }
    //         else {
    //             this.savedShapes[0].map(line => {
    //                 let points = []
    //                 for (let i = 0; i < line.attrs.points.length; i++) {
    //                     points.push(line.attrs.points[i]);
    //                 }

    //                 let copiedLine = new Konva.Line({
    //                     stroke: '#df4b26',
    //                     strokeWidth: 5,
    //                     globalCompositeOperation: 'source-over',
    //                     // round cap for smoother lines
    //                     lineCap: 'round',
    //                     // add point twice, so we have some drawings even on a simple click
    //                     points: points,
    //                 });
    //                 particle.lines.push(copiedLine);
    //                 this.stage.layer.add(copiedLine);
    //             });
    //         }
    //     });
    //     this.mode = "emitting2";

    // }

    // emitting() {
    //     let offsetX = this.currPosition[0] - this.lastPosition[0];
    //     let offsetY = this.currPosition[1] - this.lastPosition[1];

    //     let newPoints = [];
    //     for (let i = 0; i < this.currentLine.attrs.points.length; i += 2) {
    //         newPoints.push(this.currentLine.attrs.points[i] + offsetX);
    //         newPoints.push(this.currentLine.attrs.points[i + 1] + offsetY);
    //     }
    //     // update the points
    //     this.currentLine.points(newPoints);


    //     this.particles.map(particle => {
    //         if (particle.countdown == 0) {
    //             particle.countdown = 20 + Math.floor(Math.random() * 50);
    //             particle.speedX = -1 + Math.random() * 2;
    //             particle.speedY = 12 + Math.random() * 0.5;


    //             // pick a point on the line
    //             let point = Math.floor(Math.random() * ((this.currentLine.attrs.points.length - 1) / 2)) * 2;
    //             let pointX = this.currentLine.attrs.points[point];
    //             let pointY = this.currentLine.attrs.points[point + 1];

    //             particle.lines.map(line => {
    //                 let newPoints = [];

    //                 let pointX1 = line.attrs.points[0];
    //                 let pointY1 = line.attrs.points[1];
    //                 let offsetX = pointX - pointX1;
    //                 let offsetY = pointY - pointY1;
    //                 for (let i = 0; i < line.attrs.points.length; i += 2) {
    //                     newPoints.push(line.attrs.points[i] + offsetX);
    //                     newPoints.push(line.attrs.points[i + 1] + offsetY);
    //                 }
    //                 // update the points
    //                 line.points(newPoints);
    //             });

    //         }
    //         else {
    //             particle.countdown--;
    //             particle.lines.map(line => {
    //                 let newPoints = [];
    //                 for (let i = 0; i < line.attrs.points.length; i += 2) {
    //                     newPoints.push(line.attrs.points[i] + particle.speedX);
    //                     newPoints.push(line.attrs.points[i + 1] + particle.speedY);
    //                 }
    //                 // update the points
    //                 line.points(newPoints);
    //             });
    //         }
    //     })
    // }
}



