// @ts-ignore
import Physic from "./physic.js";
import Stage from "./stage.js";
import Konva from 'konva';
import particle from "./particle.js";
export default class Canvas {
    constructor() {
        this.isPaint = false;
        this.mode = "drawing";
        this.position = { x: 0, y: 0 };
        this.motionLine = [];
        this.savedLines = [];
        this.physic = new Physic();
        this.stage = new Stage();
        this.stage.stage.on('mousedown touchstart', e => {
            this.isPaint = true;
            let pos = this.stage.stage.getPointerPosition();
            let color;
            switch (this.mode) {
                case 'emitting':
                    color = '#3cb043';
                    break;
                case 'motion':
                    color = '#29446f';
                    break;
                default:
                    color = '#df4b26';
            }
            if (pos) {
                this.position = pos;
                this.currentLine = new Konva.Line({
                    stroke: color,
                    strokeWidth: 5,
                    globalCompositeOperation: 'source-over',
                    // round cap for smoother lines
                    lineCap: 'round',
                    // add point twice, so we have some drawings even on a simple click
                    points: [pos.x, pos.y, pos.x, pos.y],
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
                    // nothing, keep drawing
                    ;
            }
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
                var newPoints = this.currentLine.points().concat([pos.x, pos.y]);
                this.currentLine.points(newPoints);
                this.position = pos;
            }
        });
    }
    save_particle() {
        this.savedLines.push(this.currentLine);
        this.currentLine = null;
    }
    add_motion() {
        let motionVertex = this.currentLine.attrs.points;
        // transform to something that matter needs
        let motionVertexSet = [];
        for (let i = 0; i < motionVertex.length; i += 2) {
            motionVertexSet.push({ x: motionVertex[i], y: motionVertex[i + 1] });
        }
        this.physic.add_motion(motionVertexSet);
    }
    emit() {
        this.savedLines.map(line => {
            this.physic.add_particle(new particle({
                x: this.currentLine.attrs.points[0],
                y: this.currentLine.attrs.points[1],
            }, line));
        });
    }
}
