
import { assert } from 'console'
import Matter from 'matter-js'
import particle from './particle'

// module aliases
var Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Svg = Matter.Svg,
    Vertices = Matter.Vertices,
    Composite = Matter.Composite,
    Events = Matter.Events




export default class Physic {
    // create engine and render
    engine = Engine.create()
    render = Render.create({
        element: document.getElementById('opencv'),
        engine: this.engine,
        options: {
            showPositions: true,
            showAngleIndicator: true,
            background: '#800000',
            wireframeBackground: 'none'
        }
    })

    // contains all the particles drawn
    particles =[]

    // needed to be refactored
    motion =[];

    constructor() {
        var ground = Bodies.rectangle(400, 610, 1200, 60, { isStatic: true });

        Composite.add(this.engine.world, ground);

        this.run();
    }


    add_particle(particle) {
        this.particles.push(particle);
        Composite.add(this.engine.world, particle.physicBody);
        // console.log(this.particles);
    }

    // motion is defined [{x,y}]
    add_motion(motion){
        this.motion = motion;
    }



    get_velocity(particle){
        let min=Infinity;
        let i=0;


        for(let k=0;k<this.motion.length;k++)
        {

            let number = Math.pow(this.motion[k].x-particle.physicBody.position.x,2)+Math.pow(this.motion[k].y-particle.physicBody.position.y,2);
            assert(number!=0,"number shouldnt be zero");
            if(number<min)
            {
                min=number;
                i=k;
            }
        }

        let result={x:0,y:0};

        if(i<this.motion.length-1)
        {
            result.x = this.motion[i+1].x-this.motion[i].x;
            result.y = this.motion[i+1].y-this.motion[i].y;
        }
        
        return result;
    }

    run() {
        var runner;

        Render.run(this.render);
        // create runner
        runner = Runner.create();
        // run the engine
        Runner.run(runner, this.engine)

        Events.on(runner, 'beforeUpdate', () => {
            if(this.motion.length>0)
            {
                this.particles.map(p=>{
                    Body.setVelocity(p.physicBody, this.get_velocity(p))
                })
            }
        })


        Events.on(runner, 'afterUpdate', () => {
            this.particles.map(p=>{
                p.update();
            })
        })
    }
}