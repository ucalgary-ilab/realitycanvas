import particle from "./particle.js"


export default class emitter {
    emitLine
    particleShape
    firstPointOffset

    particles = []
    bodyPartID

    color 
    xspeed = 0
    yspeed = 1

    constructor(id, line, shape, stage, color, offset){
        this.bodyPartID = id;
        this.emitLine = line;
        this.stage = stage;
        this.color = color;
        this.particleShape = shape;
        this.firstPointOffset = offset;

        // create particles
        for(let i=0; i<100; i++){
            // let position =
            this.particles.push(new particle(this.particleShape,this.stage,this.color, position));
        }
    }



    update(bodyParts){
        console.log("here!!!")
        // update the emit line
        this.update_emit_line(bodyParts);
        
        // update each particle
        this.particles.map(particle=>{
            particle.update(); // particle is self updating elements, no bodyPart information need
        })
    }



    update_emit_line(bodyParts){
        let bodyPart = bodyParts[this.bodyPartID];
        let offsetX = Math.floor((bodyPart.x * this.WIDTH) - this.firstPointOffset.x - this.emitLine.attrs.points[0]);
        let offsetY = Math.floor((bodyPart.y * this.HEIGHT) - this.firstPointOffset.y - this.emitLine.attrs.points[1]);

        let newPoints = [];
        for(let i=0; i<this.emitLine.attrs.points; i+=2){
            newPoints.push(this.emitLine.attrs.points[i]+offsetX);
            newPoints.push(this.emitLine.attrs.points[i+1]+offsetY);
        }
        this.emitLine.points(newPoints);
    }





};


