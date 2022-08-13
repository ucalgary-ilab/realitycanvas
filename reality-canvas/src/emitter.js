import Particle from "./particle.js"
export default class Emitter {
    emitLine
    particleAnimation
    firstPointOffset

    particles = []
    bodyPartID
    type
    maxNumParticles
    color
    xspeed = 0
    yspeed = 1

    constructor(id, line, animation, stage, color, offset, type) {
        this.bodyPartID = id;
        this.type = type;
        this.emitLine = line;
        this.stage = stage;
        this.color = color;
        this.particleAnimation = animation;
        this.firstPointOffset = offset;

        if (this.type == "Respawn") {
            // get the length of the emitter line
            let emitLineLength = this.emitLine.attrs.points.length / 2 - 1;
            // create particles
            for (let i = 0; i < 40; i++) {
                // select a random point on the line to be the spawning position for the new particle
                let randomPoint = Math.floor(Math.random() * emitLineLength);
                this.particles.push(new Particle(
                    this.particleAnimation,
                    this.stage,
                    this.color,
                    {
                        x: this.emitLine.attrs.points[randomPoint * 2],
                        y: this.emitLine.attrs.points[randomPoint * 2 + 1]
                    }));
            }
        }

    }


    update(x, y) {
        if (this.type == "Respawn") {
            // update the emit line
            let offsetX = Math.floor(x - this.firstPointOffset.x - this.emitLine.attrs.points[0]);
            let offsetY = Math.floor(y - this.firstPointOffset.y - this.emitLine.attrs.points[1]);
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
        else {
            this.particles.map(particle => {
                if (particle.fpsCount == particle.frames.length - 1) {
                    this.particles.remove(particle);
                }
                else {
                    particle.update(0, 0);
                }
            })
            if (this.particles.length < 5) {
                this.particles.push(new Particle(
                    this.particleAnimation,
                    this.stage,
                    this.color,
                    {
                        x: x,
                        y: y
                    }));
            }
        }
    }


};


