import Konva from 'konva'
import Matter from 'matter-js'

var Bodies = Matter.Bodies

export default class particle {
    physicBody: any
    stageShape: any
    lastPos: { x: number, y: number }

    constructor(x: number, y: number, lines) {

        // mark last position
        this.lastPos = { x, y }
        this.physicBody = Bodies.fromVertices(x, y, lines);

        // flatten the 2d array
        let points = [].concat(...lines);
        this.stageShape = new Konva.Line({
            stroke: '#df4b26',
            strokeWidth: 3,
            globalCompositeOperation: 'source-over',
            lineCap: 'round',
            // points has the pattern [x1,y1,x2,y2]
            points: points,
        });

    }

    update() {
        // associate the shape's position with physic's position
        let x_offset = this.lastPos.x - this.physicBody.position.x;
        let y_offset = this.lastPos.y - this.physicBody.position.y;

        // apply the offsets
        let newPoints;
        for (let i = 0; i < this.stageShape.points.length; i += 2) {
            newPoints.push(this.stageShape.points[i]+x_offset);
            newPoints.push(this.stageShape.points[i+1]+y_offset);
        }

        // update the points
        this.stageShape.points(newPoints);
    }
}