import Konva from "konva";
export default class Stage {
    constructor() {
        this.stage = new Konva.Stage({
            container: 'container',
            width: window.innerWidth,
            height: window.innerHeight - 25,
        });
        this.layer = new Konva.Layer();
        this.isPaint = false;
        // this.layer.add(circle);
        this.stage.add(this.layer);
        // this.layer.draw();
        this.stage.on('mousedown touchstart', e => {
            this.isPaint = true;
            var pos = this.stage.getPointerPosition();
            this.lastLine = new Konva.Line({
                stroke: '#df4b26',
                strokeWidth: 5,
                globalCompositeOperation: 'source-over',
                // round cap for smoother lines
                lineCap: 'round',
                // add point twice, so we have some drawings even on a simple click
                //@ts-ignore
                points: [pos.x, pos.y, pos.x, pos.y],
            });
            this.layer.add(this.lastLine);
        });
        this.stage.on('mouseup touchend', () => {
            this.isPaint = false;
        });
        // and core function - drawing
        this.stage.on('mousemove touchmove', e => {
            console.log("herer!");
            if (!this.isPaint) {
                return;
            }
            // prevent scrolling on touch devices
            e.evt.preventDefault();
            const pos = this.stage.getPointerPosition();
            //@ts-ignore
            var newPoints = this.lastLine.points().concat([pos.x, pos.y]);
            this.lastLine.points(newPoints);
        });
    }
}
