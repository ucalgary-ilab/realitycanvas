import Matter from 'matter-js';
import _ from 'lodash';
var Bodies = Matter.Bodies;
export default class particle {
    constructor(position, shape) {
        // we want an array of {x,y} to create matter-js object
        // given [line,line....] 
        let vertex = shape.flatMap(line => {
            // return [x,y,x,y]
            return line.attrs.points;
        });
        // result should be a list of [x,y,x,y....]
        // transform to [{x,y}] that matter needs
        let vertexSet = [];
        for (let i = 0; i < vertex.length; i += 2) {
            vertexSet.push({ x: vertex[i], y: vertex[i + 1] });
        }
        // initialize last position
        this.lastPos = vertexSet[0];
        // create the physic body 
        this.physicBody = Bodies.fromVertices(position.x, position.y, vertexSet);
        // store the konva.lines
        this.stageShape = shape;
    }
    update() {
        // associate the shape's position with physic's position
        // get the offset
        let x_offset = this.lastPos.x - this.physicBody.position.x;
        let y_offset = this.lastPos.y - this.physicBody.position.y;
        this.lastPos = _.cloneDeep(this.physicBody.position);
        // apply the offsets
        // since we an array of lines
        // we need to loop through all the lines
        // then loop through all the points of the current line
        this.stageShape.map(line => {
            let newPoints = [];
            for (let i = 0; i < line.attrs.points.length; i += 2) {
                newPoints.push(line.attrs.points[i] - x_offset);
                newPoints.push(line.attrs.points[i + 1] - y_offset);
            }
            // update the points
            line.points(newPoints);
        });
    }
}
