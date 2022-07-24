
import Konva from 'konva'
import _ from 'lodash'

export default class particle {
    // stage shape should be an array of konva lines
    stageShape = []
    stage 
    yspeed = 1
    xspeed = 0
    position

    constructor(shape, stage, color, position) {

        this.stage = stage;
        this.position = position;

        // the first point of the drawing would match the position
        let offsetX = position.x - shape[0].attrs.points[0];
        let offsetY = position.y - shape[0].attrs.points[1];


        shape.map(line=>{
            let newPoints = [];
            for(let i=0; i<line.attrs.points.length; i+=2){
                    newPoints.push(line.attrs.points[i]+offsetX);
                    newPoints.push(line.attrs.points[i+1]+offsetY);
            }

            let copiedLine = new Konva.Line({
                    stroke: color,
                    strokeWidth: 4,
                    globalCompositeOperation: 'source-over',
                    // round cap for smoother lines
                    lineCap: 'round',

                    // copy the points from the prototype
                    points: newPoints,
                });
            
            this.stage.layer.add(copiedLine);
            this.stageShape.push(copiedLine);
        });
        
    }
    

    update(x, y) {
       this.stageShape.map(line=>{
            let newPoints = [];
            for(let i=0; i<line.attrs.points.length; i+=2){
                newPoints.push(line.attrs.points[i]+this.xspeed);
                newPoints.push(line.attrs.points[i+1]+this.yspeed);
            }
            line.points(newPoints);
       });
       this.position.x += x;
       this.position.y += y;
    }
}