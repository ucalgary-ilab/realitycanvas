export default class Canvas {
    constructor(parent) {
        this.isDrawing = false;
        this.position = { x: 0, y: 0 };
        let parentTag = document.getElementsByTagName(parent);
        parentTag[0].appendChild(this.create_canvas());
    }
    pen_down(e) {
        this.position.x = e.offsetX;
        this.position.y = e.offsetY;
        this.isDrawing = true;
    }
    create_canvas() {
        let canvas = document.createElement('canvas');
        canvas.setAttribute('id', 'canvas');
        canvas.setAttribute('width', '1000');
        canvas.setAttribute('height', '1000');
        canvas.addEventListener('mousedown', e => {
            this.position.x = e.offsetX;
            this.position.y = e.offsetY;
            this.isDrawing = true;
        });
        canvas.addEventListener('touchstart', e => {
            this.position.x = e.touches[0].clientX;
            this.position.y = e.touches[0].clientY;
            this.isDrawing = true;
        });
        canvas.addEventListener('mousemove', e => {
            if (this.isDrawing) {
                this.drawLine(canvas.getContext('2d'), this.position, { x: e.offsetX,
                    y: e.offsetY, });
                this.position = { x: e.offsetX, y: e.offsetY };
            }
        });
        canvas.addEventListener('touchmove', e => {
            if (this.isDrawing) {
                this.drawLine(canvas.getContext('2d'), this.position, { x: e.touches[0].clientX,
                    y: e.touches[0].clientY, });
                this.position = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
        });
        window.addEventListener('mouseup', e => {
            if (this.isDrawing === true) {
                this.drawLine(canvas.getContext('2d'), this.position, { x: e.offsetX, y: e.offsetY });
                this.position = { x: 0, y: 0 };
                this.isDrawing = false;
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
    drawLine(context, pos1, pos2) {
        context.beginPath();
        context.strokeStyle = 'black';
        context.lineWidth = 1;
        context.moveTo(pos1.x, pos1.y);
        context.lineTo(pos2.x, pos2.y);
        context.stroke();
        context.closePath();
    }
}
