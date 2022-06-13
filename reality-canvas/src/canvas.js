// @ts-ignore
import Stage from "./stage.js";
export default class Canvas {
    constructor() {
        // add event listeners
        this.isDrawing = false;
        this.position = { x: 0, y: 0 };
        this.stage = new Stage();
        this.canvas = this.stage.render.canvas;
        this.canvas.addEventListener('mousedown', e => {
            // set last position to start
            this.position.x = e.offsetX;
            this.position.y = e.offsetY;
            this.isDrawing = true;
        });
        this.canvas.addEventListener('mousemove', e => {
            // if it is drawing
            if (this.isDrawing) {
                // drawing a line between last position with current position
                drawLine(this.canvas.getContext('2d'), 
                // last position
                this.position, 
                // current position
                {
                    x: e.offsetX,
                    y: e.offsetY,
                });
                // update the last position with current position
                this.position = { x: e.offsetX, y: e.offsetY };
            }
        });
        // note this is registered on the 'window'
        window.addEventListener('mouseup', e => {
            if (this.isDrawing === true) {
                drawLine(this.canvas.getContext('2d'), this.position, { x: e.offsetX, y: e.offsetY });
                // reset
                this.position = { x: 0, y: 0 };
                this.isDrawing = false;
            }
        });
        // draw a line on the canvas respect to  to two points
        const drawLine = (context, pos1, pos2) => {
            if (context) {
                console.log('here');
                context.beginPath();
                context.strokeStyle = 'red';
                context.lineWidth = 1;
                context.moveTo(pos1.x, pos1.y);
                context.lineTo(pos2.x, pos2.y);
                context.stroke();
                context.closePath();
            }
        };
    }
}
