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
        this.layer.draw();

    }

}