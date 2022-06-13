import Canvas from './canvas.js'

class App{
    // canvas: Canvas

    constructor(parent:string)
    {
        // let parentTag = document.getElementsByTagName(parent);
        
        
        // parentTag[0].appendChild(this.create_drawing_plane());
        // this.canvas = new Canvas(parent);
    }

    // create_drawing_plane()
    // {
    //     let drawingPlane = document.createElement("a-plane");
    //     drawingPlane.setAttribute('id','drawing-plane');
    //     drawingPlane.setAttribute('class','cantap');
    //     drawingPlane.setAttribute('position','0 0 -10');
    //     drawingPlane.setAttribute('rotation','0 0 0')
    //     drawingPlane.setAttribute('width','20');
    //     drawingPlane.setAttribute('height','20');
    //     drawingPlane.setAttribute('color', '#7BC8A4');
    //     return drawingPlane;
    // }


}

const app = new App("a-scene");
// console.log("success")