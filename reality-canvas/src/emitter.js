import Particle from "./particle.js"
export default class Emitter {
    emitLine
    particleShape
    firstPointOffset

    particles = []
    bodyPartID

    color
    xspeed = 0
    yspeed = 1
    WIDTH = 1280
    HEIGHT = 720/* #container {
        position: fixed;
        top: 0px;
        left: 0px;
    } */


    constructor(id, line, shape, stage, color, offset) {
        this.bodyPartID = id;

        this.emitLine = line;
        this.stage = stage;
        this.color = color;
        this.particleShape = shape;
        this.firstPointOffset = offset;


        // get the length of the emitter line
        let emitLineLength = this.emitLine.attrs.points.length / 2 - 1;
        // create particles
        for (let i = 0; i < 40; i++) {
            // select a random point on the line to be the spawning position for the new particle
            let randomPoint = Math.floor(Math.random() * emitLineLength);
            this.particles.push(new Particle(
                this.particleShape,
                this.stage,
                this.color,
                {
                    x: this.emitLine.attrs.points[randomPoint * 2],
                    y: this.emitLine.attrs.points[randomPoint * 2 + 1]
                }));
        }
    }


    update(bodyParts) {

        // update the emit line
        let bodyPart = bodyParts[this.bodyPartID];
        let offsetX = Math.floor((bodyPart.x * this.WIDTH) - this.firstPointOffset.x - this.emitLine.attrs.points[0]);
        let offsetY = Math.floor((bodyPart.y * this.HEIGHT) - this.firstPointOffset.y - this.emitLine.attrs.points[1]);

        // console.log(offsetX, offsetY)

        let newPoints = [];

        for (let i = 0; i < this.emitLine.attrs.points.length; i += 2) {
            newPoints.push(this.emitLine.attrs.points[i] + offsetX);
            newPoints.push(this.emitLine.attrs.points[i + 1] + offsetY);
        }
        this.emitLine.points(newPoints);

        // update each particle
        this.particles.map(particle => {
            particle.update(offsetX, offsetY); // particle is self updating elements, no bodyPart information need
        })
    }


};


