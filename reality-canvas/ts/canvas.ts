// @ts-ignore
import Physic from "./physic.js"
import Stage from "./stage.js"
import Konva from 'konva'
import particle from "./particle.js"

export default class Canvas {
    isDrawing: boolean = false
    position: { x: number, y: number } = { x: 0, y: 0 }
    currentLine: { x: number, y: number }[] = []
    historyLines: { x: number, y: number }[][] = []


    physic: Physic = new Physic()
    stage: Stage = new Stage()

    isPaint: boolean = false;

    constructor() {
        this.stage.stage.on('mousedown touchstart', e => {
            this.isPaint = true;
            let pos = this.stage.stage.getPointerPosition();
            if (pos) {
                this.currentLine.push(pos);
                this.position = pos;
            }
        });

        this.stage.stage.on('mouseup touchend', () => {
            this.isPaint = false;
            this.historyLines.push(this.currentLine);
            this.currentLine = [];
        });

        // and core function - drawing
        this.stage.stage.on('mousemove touchmove', e => {
            if (!this.isPaint) {
                return;
            }

            // prevent scrolling on touch devices
            e.evt.preventDefault();

            let pos = this.stage.stage.getPointerPosition();
            //@ts-ignore
            if (pos && this.position != pos) {
                this.currentLine.push(pos);
            }
        });
    }

    animate() {
        let object = new particle(this.historyLines[0][0],this.historyLines);
        this.stage.layer.add(object.stageShape);
        this.physic.add_particle(object);
    }

}


