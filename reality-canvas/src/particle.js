import Konva from 'konva'
import _ from 'lodash'

export default class particle {

    // stage shape should be an array of konva lines
    
    stageShape
    yspeed 
    xspeed

    constructor(shape) {

    }
    
    fall() {
       this.stageShape.map(line=>{
            let newPoints = [];
            for(let i=0; i<line.attrs.points.length; i+=2){
                newPoints.push(line.attrs.points[i]+xspeed);
                newPoints.push(line.attrs.points[i+1]+yspeed);
            }
            line.points(newPoints);
       });  
    }
}