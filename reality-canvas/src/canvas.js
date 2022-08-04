
import Stage from "./stage.js"
import Konva from 'konva'
import Emitter from "./emitter.js"
import Animation from "./animation.js"

export default class Canvas {
    isPaint = false
    mode = "drawing"

    lastPosition = [0, 0]
    currPosition = [0, 0]

    // currentLine keeps current drawing line, might be a very bad name
    currentLine
    // shape is defined by an array of konva lines
    currentShape = []
    // emit line
    emitLine

    stage = new Stage()
    animations = []

    bodyPartID = []
    bodyPartHighlights = []


    bindedObjects = []
    hiddenObject = -1
    down = false
    up = false


    firstPointOffset = []
    emitters = []


    // for the action trigger, will be aggregate into the a sperate class
    FPScount = 0
    WIDTH = 0
    HEIGHT = 0


    color = '#FFFFFF'


    constructor(width, height) {
        this.WIDTH = width;
        this.HEIGHT = height;

        this.stage.stage.on('mousedown touchstart', e => {
            // put down the pen, i.e, painting
            this.isPaint = true;
            // get the current pointed position on the stage
            let pos = this.stage.stage.getPointerPosition();

            let color
            switch (this.mode) {
                case 'emit':
                    color = '#3cb043';    // emitting = green
                    break;
                case 'motion':
                    color = '#29446f';    // motion = blue
                    break;
                default:
                    color = this.color;    // drawing = red
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
                case "emit":
                    this.emitLine = this.currentLine;
                    this.currentLine = null;
                    this.emit_setup();
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


    new_animation(){
        this.animations.push(new Animation());
    }

    bind_drawing() {
        // calculate the offset of first point of the first line of the shape to the tracking point
        this.firstPointOffset.push({
            x: this.bodyPartHighlights[this.bodyPartHighlights.length - 1].absolutePosition().x - this.currentShape[0].attrs.points[0],
            y: this.bodyPartHighlights[this.bodyPartHighlights.length - 1].absolutePosition().y - this.currentShape[0].attrs.points[1]
        })


        // save current shape, savedShape is an array of array of konva lines
        this.bindedObjects.push(this.currentShape);
        // reset current shape
        this.currentShape = [];
        this.mode = "drawing"
    }

    action_setup() {
        this.bind_drawing();
        this.hiddenObject = this.bindedObjects.length - 1;
        this.bindedObjects[this.hiddenObject].map(line => {
            line.hide();
        })
    }

    update_hidden(bodyParts) {
        if (this.hiddenObject < 0) {
            return;
        }

        let A = { x: bodyParts[11].x * this.WIDTH, y: bodyParts[11].y * this.HEIGHT };
        let B = { x: bodyParts[23].x * this.WIDTH, y: bodyParts[23].y * this.HEIGHT };
        let C = { x: bodyParts[25].x * this.WIDTH, y: bodyParts[25].y * this.HEIGHT };
        let AB = Math.sqrt(Math.pow(B.x - A.x, 2) + Math.pow(B.y - A.y, 2));
        let BC = Math.sqrt(Math.pow(B.x - C.x, 2) + Math.pow(B.y - C.y, 2));
        let AC = Math.sqrt(Math.pow(C.x - A.x, 2) + Math.pow(C.y - A.y, 2));
        let angle = Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB)) * 180 / Math.PI;


        if (angle <= 99 && this.FPScount == 0) {
            console.log("down");
            this.down = true;
        }

        if (this.down && angle >= 100 && this.FPScount == 0) {
            console.log("up");
            this.up = true;
        }

        if (this.up && this.FPScount == 0) {
            this.FPScount = 20;
            this.bindedObjects[this.hiddenObject].map(line => {
                console.log("line added", line.attrs.points);
                line.show();
            })
            console.log("one situp");
            this.up = false;
            this.down = false;
        }

        if (this.FPScount > 0) {
            this.FPScount--;
        }

        if (this.FPScount == 0) {
            this.bindedObjects[this.hiddenObject].map(line => {
                line.hide()
            })
        }
    }

    trailing_setup() {
        let trailingLine = new Konva.Line({
            stroke: "#ADD8E6",
            strokeWidth: 10,
            globalCompositeOperation: 'source-over',
            // round cap for smoother lines
            lineCap: 'round',
            // add point twice, so we have some drawings even on a simple click
            points: [],
        });
        this.stage.layer.add(trailingLine);
        this.bindedObjects.push(trailingLine);
    }

    // initialize the particles with the current shape
    // this function should only be called once when the emit line is created
    emit_setup() {
        // only for consistency, this entry wont be used
        this.firstPointOffset.push({
            x: this.bodyPartHighlights[this.bodyPartHighlights.length - 1].absolutePosition().x - this.emitLine.attrs.points[0],
            y: this.bodyPartHighlights[this.bodyPartHighlights.length - 1].absolutePosition().y - this.emitLine.attrs.points[1]
        })


        let newEmitter = new Emitter(
            this.bodyPartID[this.bodyPartID.length - 1],
            this.emitLine,
            this.currentShape,
            this.stage,
            this.color,
            {
                x: this.bodyPartHighlights[this.bodyPartHighlights.length - 1].absolutePosition().x - this.emitLine.attrs.points[0],
                y: this.bodyPartHighlights[this.bodyPartHighlights.length - 1].absolutePosition().y - this.emitLine.attrs.points[1]
            });


        this.emitters.push(newEmitter);
        this.bindedObjects.push(newEmitter);


        // remove the prototype from the staging area
        this.currentShape.map(line => {
            line.remove(); // use remove, the node would still exist for prototyping purpose
        })

        // empty the currentShape
        this.currentShape = [];
        this.mode = "drawing"
    }


    // keep emitting the particle
    update_emitters(bodyParts) {
        // update every particles
        this.emitters.map(emitter => {
            emitter.update(bodyParts);
        })
    }



    // select a body part to bind the drawing
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

        this.update_hidden(bodyParts);

        for (let i = 0; i < this.bindedObjects.length; i++) {
            if (this.bindedObjects[i] instanceof Array) {
                let bodyPart = bodyParts[this.bodyPartID[i]];

                let offsetX = Math.floor((bodyPart.x * this.WIDTH) - this.firstPointOffset[i].x - this.bindedObjects[i][0].attrs.points[0]);
                let offsetY = Math.floor((bodyPart.y * this.HEIGHT) - this.firstPointOffset[i].y - this.bindedObjects[i][0].attrs.points[1]);

                this.bindedObjects[i].map(line => {
                    let newPoints = [];
                    for (let i = 0; i < line.attrs.points.length; i += 2) {
                        newPoints.push(line.attrs.points[i] + offsetX);
                        newPoints.push(line.attrs.points[i + 1] + offsetY);
                    }
                    // update the points
                    line.points(newPoints);
                });
            }
            else if (this.bindedObjects[i] instanceof Emitter) {
                this.bindedObjects[i].update(bodyParts);
            }
            else {
                let bodyPart = bodyParts[this.bodyPartID[i]];
                let newX = Math.floor(bodyPart.x * this.WIDTH);
                let newY = Math.floor(bodyPart.y * this.HEIGHT);

                let newPoints = []

                for (let j = 0; j < this.bindedObjects[i].attrs.points.length; j++) {
                    newPoints.push(this.bindedObjects[i].attrs.points[j]);
                }
                newPoints.push(newX);
                newPoints.push(newY);

                if (newPoints.length > 35) {
                    newPoints = newPoints.slice(2);
                }

                this.bindedObjects[i].points(newPoints);
                console.log("points", this.bindedObjects[i].attrs.points)
            }
        }
    }
}



