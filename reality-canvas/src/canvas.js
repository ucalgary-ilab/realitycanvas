// @ts-ignore
// import Physic from "./physic.js"
import Stage from "./stage.js"
import Konva from 'konva'
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
    savedShapes = []

    // motion line 
    motionLine = []

    // physic = new Physic()
    stage = new Stage()

    contourPoints = []
    sortedPoints = []
    // contourAngles = []
    constructor() {
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
                    color = '#df4b26';    // drawing = red
            }

            // if the pos is not null
            if (pos) {
                //  create new konva line, store it in the this.currentLine
                this.lastPosition = pos;
                this.currentLine = new Konva.Line({
                    stroke: color,
                    strokeWidth: 5,
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
        // save current shape, savedShape is an array of array of konva lines
        this.savedShapes.push(this.currentShape);
        // reset current shape
        this.currentShape = [];
    }

    // set the position of the tracked object
    setPosition(x, y) {
        this.lastPosition = this.currPosition;
        this.currPosition = [x, y];
    }

    setContourPoints(points) {
        this.contourPoints = points;

        //  calculating the center
        let sumX=0;
        let sumY=0;
        let numPoints = points.length/2;
        for(let i=0; i<points.length; i+=2){
            sumX += points[i];
            sumY += points[i+1];
        }

        // set center
        this.setPosition(Math.floor(sumX/numPoints), Math.floor(sumY/numPoints));
        // this.setContourPoints();
        this.sortContourPoints();
    }


    sortContourPoints() {
        let angles = []

        // get angles with respect to the center
        for(let i=0; i<this.contourPoints.length; i+=2){
            let x = this.contourPoints[i];
            let y = this.contourPoints[i+1];
            angles.push( { x:x, y:y, angle: Math.atan2(y - this.currPosition[1], x - this.currPosition[0]) * 180 / Math.PI });
        }

        this.sortedPoints = angles.sort((a, b) => a.angle - b.angle);
    }


    update() {
        switch (this.mode) {
            case "binding":
                this.binding();
                break;
            case "contouring":
                this.contouring();
                break;
            default:
                ;
        }
    }

    binding() {
        let offsetX = this.currPosition[0] - this.lastPosition[0];
        let offsetY = this.currPosition[1] - this.lastPosition[1];

        if (this.savedShapes[0]) {
            this.savedShapes[0].map(line => {
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


    contouring() {
        if (this.savedShapes[0]) {
            this.savedShapes[0].map(line => {
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





    // add_motion(){
    //     let motionVertex = this.currentLine.attrs.points;

    //     // transform to something that matter needs
    //     let motionVertexSet = []
    //     for (let i = 0; i < motionVertex.length; i += 2) {
    //         motionVertexSet.push({ x: motionVertex[i], y: motionVertex[i + 1] })
    //     }
    //     this.physic.add_motion(motionVertexSet);
    // }

    // emit() {
    //     this.savedShapes.map(shape => {
    //         console.log(shape);
    //         this.physic.add_particle(new particle({
    //             x: this.currentLine.attrs.points[0],
    //             y: this.currentLine.attrs.points[1],
    //         }
    //             , shape));
    //     });
    // }
}



