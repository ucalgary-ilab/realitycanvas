import { assert } from 'console'
import Konva from 'konva'
import _ from 'lodash'

export default class particle {
    // stage shape should be an array of konva lines
    stageShape = []
    stage 
    yspeed = 1
    xspeed = 0

    constructor(shape, stage, color) {
        console.log(color)
        this.stage = stage;
        shape.map(line=>{
            let copiedLine = new Konva.Line({
                    stroke: color,
                    strokeWidth: 4,
                    globalCompositeOperation: 'source-over',
                    // round cap for smoother lines
                    lineCap: 'round',

                    // copy the points from the prototype
                    points: _.cloneDeep(line.attrs.points),
                });
            
            this.stage.layer.add(copiedLine);
            
            this.stageShape.push(copiedLine);
        });
        
    }
    

    update() {
       this.stageShape.map(line=>{
            let newPoints = [];
            for(let i=0; i<line.attrs.points.length; i+=2){
                newPoints.push(line.attrs.points[i]+this.xspeed);
                newPoints.push(line.attrs.points[i+1]+this.yspeed);
            }
            line.points(newPoints);
       });
    }
}