import Konva from 'konva'
import Matter from 'matter-js'

import _ from 'lodash'

var Bodies = Matter.Bodies

export default class particle {
    physicBody: any
    stageShape: any
    lastPos: { x: number, y: number }


    constructor(position:{x:number,y:number},shape: any) {

        // get all the points from the konva line
        let vertex = shape.attrs.points;

        // transform to something that matter needs
        let vertexSet: { x: number, y: number }[] = []
        for (let i = 0; i < vertex.length; i += 2) {
            vertexSet.push({ x: vertex[i], y: vertex[i + 1] })
        }

        // mark last position
        this.lastPos = vertexSet[0];

        this.physicBody = Bodies.fromVertices(position.x, position.y, vertexSet);
        this.stageShape = shape;

    }

    update() {
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