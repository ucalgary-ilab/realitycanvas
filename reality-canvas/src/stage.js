import Konva from "konva";

export default class Stage {
    stage = new Konva.Stage({
        container: 'konva',  // id of the container <div>
        width: 1280,
        height: 720,
    })
    layer = new Konva.Layer()

    constructor() {
        // this.layer.add(circle);
        this.stage.add(this.layer);
        this.layer.draw();
        const canvas = this.layer.getCanvas()._canvas;
        canvas.id = 'drawing-canvas';
    }

}