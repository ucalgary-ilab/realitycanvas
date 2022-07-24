import { assert } from 'console'
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

        let topMostPoint = {x:2000,y:2000};
        
        shape.map(line=>{
            for(let i=0; i<line.attrs.points.length; i+=2){
                if(line.attrs.points[i+1] < topMostPoint.y){
                    topMostPoint.x = line.attrs.points[i];
                    topMostPoint.y = line.attrs.points[i+1];
                }
            }
        })

        let offsetX = position.x - topMostPoint.x;
        let offsetY = position.y - topMostPoint.y;

        shape.map(line=>{
            let newPoints = [];
            for(let i=0; i<line.attrs.points.length; i+=2){
                if(line.attrs.points[i+1] < topMostPoint.y){
                    newPoints.push(line.attrs.points[i]+offsetX);
                    newPoints.push(line.attrs.points[i+1]+offsetY);
                }
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