import Konva from "konva";
export default class Stage {
    constructor() {
        this.stage = new Konva.Stage({
            container: 'container',
            width: 500,
            height: 500,
        });
        this.layer = new Konva.Layer();
        var circle = new Konva.Circle({
            x: this.stage.width() / 2,
            y: this.stage.height() / 2,
            radius: 70,
            fill: 'red',
            stroke: 'black',
            strokeWidth: 4
        });
        this.layer.add(circle);
        this.stage.add(this.layer);
        this.layer.draw();
    }
}
