import Konva from 'konva'
import Matter from 'matter-js'

import _ from 'lodash'

var Bodies = Matter.Bodies

export default class particle {
    physicBody: any
    stageShape: any
    lastPos: { x: number, y: number }

    limiter: number = 10;

    constructor(position: { x: number, y: number }, lines: { x: number, y: number }[][]) {

        // mark last position
        this.lastPos = position
        this.physicBody = Bodies.fromVertices(position.x, position.y, lines);


        // flatten the 2d array
        let points: { x: number, y: number }[] = []
        lines.map(line => {
            points = points.concat(line);
        })

        let newPoints: number[] = []
        points.map(pos => {
            newPoints.push(pos.x);
            newPoints.push(pos.y);
        })


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
            console.log(this.physicBody);
        }

        // associate the shape's position with physic's position
        let x_offset = this.lastPos.x - this.physicBody.position.x;
        let y_offset = this.lastPos.y - this.physicBody.position.y;



        this.lastPos = _.cloneDeep(this.physicBody.position);

        // apply the offsets
        let newPoints: number[] = [];
        for (let i = 0; i < this.stageShape.attrs.points.length; i += 2) {
            newPoints.push(this.stageShape.attrs.points[i] - x_offset);
            newPoints.push(this.stageShape.attrs.points[i + 1] - y_offset);
        }



        // update the points
        this.stageShape.points(newPoints);

    }
}