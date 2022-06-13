export default class Canvas {
    // constructor takes a "parent" html tag, and create elements attach to it
    constructor(parent) {
        this.isDrawing = false;
        this.position = { x: 0, y: 0 };
        // find the parent
        let parentTag = document.getElementsByTagName(parent);
        // attach the canvas to the parent
        parentTag[0].appendChild(this.create_canvas());
    }
    // create 'canvas' tag and add event listeners to it
    create_canvas() {
        // create 'canvas' html element
        let canvas = document.createElement('canvas');
        canvas.setAttribute('id', 'canvas');
        canvas.setAttribute('width', '1000');
        canvas.setAttribute('height', '1000');
        // add event listeners
        canvas.addEventListener('mousedown', e => {
            // set last position to start
            this.position.x = e.offsetX;
            this.position.y = e.offsetY;
            console.log(this.position);
            this.isDrawing = true;
        });
        canvas.addEventListener('mousemove', e => {
            // if it is drawing
            if (this.isDrawing) {
                // drawing a line between last position with current position
                this.drawLine(canvas.getContext('2d'), 
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
                this.drawLine(canvas.getContext('2d'), this.position, { x: e.offsetX, y: e.offsetY });
                // reset
                this.position = { x: 0, y: 0 };
                this.isDrawing = false;
            }
        });
        canvas.addEventListener('touchstart', e => {
            this.position.x = e.touches[0].clientX;
            this.position.y = e.touches[0].clientY;
            this.isDrawing = true;
        });
        canvas.addEventListener('touchmove', e => {
            if (this.isDrawing) {
                this.drawLine(canvas.getContext('2d'), this.position, {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY,
                });
                this.position = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
        });
        window.addEventListener('touchend', e => {
            if (this.isDrawing === true) {
                this.drawLine(canvas.getContext('2d'), this.position, { x: e.touches[0].clientX, y: e.touches[0].clientY });
                this.position = { x: 0, y: 0 };
                this.isDrawing = false;
            }
        });
        return canvas;
    }
    // draw a line on the canvas respect to  to two points
    drawLine(context, pos1, pos2) {
        if (context) {
            context.beginPath();
            context.strokeStyle = 'black';
            context.lineWidth = 1;
            context.moveTo(pos1.x, pos1.y);
            context.lineTo(pos2.x, pos2.y);
            context.stroke();
            context.closePath();
        }
    }
}
