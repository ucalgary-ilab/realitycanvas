import Konva from "konva";
export default class Stage {
    constructor() {
        this.stage = new Konva.Stage({
            container: 'container',
            width: window.innerWidth,
            height: window.innerHeight - 25,
        });
        this.layer = new Konva.Layer();
        // this.layer.add(circle);
        this.stage.add(this.layer);
        this.layer.draw();
    }
}
