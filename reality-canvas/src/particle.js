import Konva from 'konva';
import Matter from 'matter-js';
var Bodies = Matter.Bodies;
export default class particle {
    constructor(position, lines) {
        this.limiter = 10;
        // mark last position
        this.lastPos = position;
        this.physicBody = Bodies.fromVertices(position.x, position.y, lines);
        // flatten the 2d array
        let points = [];
        lines.map(line => {
            points = points.concat(line);
        });
        let newPoints = [];
        points.map(pos => {
            newPoints.push(pos.x);
            newPoints.push(pos.y);
        });
        this.stageShape = new Konva.Line({
            stroke: '#df4b26',
            strokeWidth: 3,
            globalCompositeOperation: 'source-over',
            lineCap: 'round',
            // points has the pattern [x1,y1,x2,y2]
            points: newPoints,
        });
    }
    update() {
        if (--this.limiter > 0) {
            console.log(this.lastPos);
            console.log(this.physicBody.position);
        }
        // associate the shape's position with physic's position
        let x_offset = this.lastPos.x - this.physicBody.position.x;
        let y_offset = this.lastPos.y - this.physicBody.position.y;
        // apply the offsets
        let newPoints = [];
        for (let i = 0; i < this.stageShape.attrs.points.length; i += 2) {
            newPoints.push(this.stageShape.attrs.points[i] - x_offset);
            newPoints.push(this.stageShape.attrs.points[i + 1] - y_offset);
        }
        // update the points
        this.stageShape.points(newPoints);
        this.lastPos = this.physicBody.position;
    }
}
