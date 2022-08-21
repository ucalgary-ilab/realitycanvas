
import Stage from "./stage.js"
import Konva from 'konva'
import Emitter from "./emitter.js"
import Animation from "./animation.js"
import Contour from "./contour.js"
import Motion from "./motion.js"
import Action from "./action.js"

export default class Canvas {
    isPaint = false
    mode = "drawing"

    lastPosition = [0, 0]
    currPosition = [0, 0]

    // currentLine keeps current drawing line, might be a very bad name
    currentLine
    // shape is defined by an array of konva lines
    currentFrame = []
    currentAnimation

    // emit line
    emitLine

    stage = new Stage()
    bodyPartID = []
    bodyPartHighlights = []


    updateList = []
    hiddenObject = -1
    down = false
    up = false

    contours = []

    firstPointOffset = []
    emitters = []


    // for the action trigger, will be aggregate into the a sperate class
    FPScount = 0
    WIDTH = 0
    HEIGHT = 0



    contourPoints = []

    // color = '#FFFFFF'


    constructor(width, height) {
        this.WIDTH = width;
        this.HEIGHT = height;

        this.stage.stage.on('mousedown touchstart', e => {
            // put down the pen, i.e, painting
            this.isPaint = true;
            // get the current pointed position on the stage
            let pos = this.stage.stage.getPointerPosition();



            // if the pos is not null
            if (pos) {
                //  create new konva line, store it in the this.currentLine
                this.lastPosition = pos;
                this.currentLine = new Konva.Line({
                    stroke: window.color,
                    strokeWidth: window.thickness,
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
                    break;
                default:
                    // save the line into current shape
                    this.currentFrame.push(this.currentLine);
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

    // add a new frame into the current animation
    add_frame(bodyParts) { // bodyParts are used to calculate the first point offset
        let firstPointOffset = { x: 0, y: 0 };
        let bodyPart = bodyParts[this.currentAnimation.bodyPartID]
        firstPointOffset.x = bodyPart.x * this.WIDTH - this.currentFrame[0].attrs.points[0];
        firstPointOffset.y = bodyPart.y * this.HEIGHT - this.currentFrame[0].attrs.points[1];
        // add the new frame into animation
        this.currentAnimation.add_frame(this.currentFrame, firstPointOffset);
        // empty the current shape to prepare next frame
        this.currentFrame = [];
        // next function should either be add_frame
    }

    finish_animation(mode) {
        // finish the current animation
        this.currentAnimation.finish();
        if (mode === "bind") {
            // add the animation to the updateList
            this.updateList.push(this.currentAnimation);
            // reset the currentAnimation
            this.currentAnimation = null;
        }
    }

    // create a new contour line
    new_contour(type) {
        this.contours.push(new Contour(this.stage, type));
    }

    action_setup(type) {
        this.currentAnimation.finish();
        this.updateList.push(new Action(type, this.currentAnimation));
        this.currentAnimation = null;
    }


    new_motion(type) {
        this.updateList.push(new Motion(this.bodyPartID[this.bodyPartID.length - 1], type, this.stage));
    }

    // trailing_setup() {
    //     let trailingLine = new Konva.Line({
    //         stroke: "#ADD8E6",
    //         strokeWidth: 10,
    //         globalCompositeOperation: 'source-over',
    //         // round cap for smoother lines
    //         lineCap: 'round',
    //         // add point twice, so we have some drawings even on a simple click
    //         points: [],
    //     });
    //     this.stage.layer.add(trailingLine);
    //     this.updateList.push(trailingLine);
    // }

    // initialize the particles with the current shape
    // this function should only be called once when the emit line is created
    emit_setup() {
        // only for consistency, this entry wont be used
        this.firstPointOffset.push({
            x: this.bodyPartHighlights[this.bodyPartHighlights.length - 1].absolutePosition().x - this.emitLine.attrs.points[0],
            y: this.bodyPartHighlights[this.bodyPartHighlights.length - 1].absolutePosition().y - this.emitLine.attrs.points[1]
        })

        // create new Emitter
        let newEmitter = new Emitter(
            this.bodyPartID[this.bodyPartID.length - 1],
            this.emitLine, // give the emitter line
            this.currentAnimation, // the particle animation prototype
            this.stage,
            {
                x: this.bodyPartHighlights[this.bodyPartHighlights.length - 1].absolutePosition().x - this.emitLine.attrs.points[0],
                y: this.bodyPartHighlights[this.bodyPartHighlights.length - 1].absolutePosition().y - this.emitLine.attrs.points[1]
            });


        // this.emitters.push(newEmitter);
        this.updateList.push(newEmitter);

        this.currentAnimation.hide_all_frame();
        // empty the currentFrame
        this.currentAnimation = null;
        this.mode = "drawing"
    }


    // // keep emitting the particle
    // update_emitters(bodyParts) {
    //     // update every particles
    //     this.emitters.map(emitter => {
    //         emitter.update(bodyParts);
    //     })
    // }

    // select a body part to bind the drawing
    select(id, bodyPart) {
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
        // create green dot for the selected body part
        this.bodyPartHighlights.push(highlight);

        // create new animation
        this.currentAnimation = new Animation(id, this.stage);
    }


    // update the green dots of selected body parts
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


    update(bodyParts, contourPoints) {
        this.updateList.map(obj => {
            // update animation


            if (obj instanceof Animation || obj instanceof Emitter || obj instanceof Motion) {
                let x = bodyParts[obj.bodyPartID].x * this.WIDTH;
                let y = bodyParts[obj.bodyPartID].y * this.HEIGHT;
                obj.update(x, y);
            }
            else if (obj instanceof Action) {
                let x = bodyParts[obj.animation.bodyPartID].x * this.WIDTH;
                let y = bodyParts[obj.animation.bodyPartID].y * this.HEIGHT;
                obj.update(x, y, bodyParts);
            }
        })

        if (contourPoints.length > 0) {
            this.contours.map(contour => {
                contour.update(contourPoints);
            })
        }
    }

}



