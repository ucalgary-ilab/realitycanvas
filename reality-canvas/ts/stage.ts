import Konva from "konva";

export default class Stage {
    stage = new Konva.Stage({
        container: 'container',  // id of the container <div>
        width: window.innerWidth,
        height: window.innerHeight-25,
    })


    layer = new Konva.Layer()
    isPaint: boolean = false
    lastLine:any 


    constructor() {


        // this.layer.add(circle);
        this.stage.add(this.layer);
        // this.layer.draw();

        this.stage.on('mousedown touchstart', e => {
            this.isPaint = true;
            var pos = this.stage.getPointerPosition();
            
            this.lastLine = new Konva.Line({
                stroke: '#df4b26',
                strokeWidth: 5,
                globalCompositeOperation:'source-over',
                // round cap for smoother lines
                lineCap: 'round',
                // add point twice, so we have some drawings even on a simple click
                //@ts-ignore
                points: [pos.x, pos.y, pos.x, pos.y],
            });
            
            this.layer.add(this.lastLine);
        });

        this.stage.on('mouseup touchend',  () => {
            this.isPaint = false;
        });

        // and core function - drawing
        this.stage.on('mousemove touchmove', e=>{
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