
import Matter from 'matter-js'
import particle from './particle'

// module aliases
var Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Svg = Matter.Svg,
    Vertices = Matter.Vertices,
    Composite = Matter.Composite,
    Events = Matter.Events

export default class Physic {
    engine = Engine.create()
    render = Render.create({
        element: document.getElementsByTagName('a-scene')[0],
        engine: this.engine,
        options: {
            showPositions: true,
            showAngleIndicator: true,
            background: '#800000',
            wireframeBackground: 'none'
        }
    })
    boxA: any

    constructor() {
        var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });

        Composite.add(this.engine.world, ground);
        this.run();
    }


    add_particle(particle: particle) {
        this.boxA = particle;
        Composite.add(this.engine.world, this.boxA.physicBody);
    }


    run() {
        var runner;

        Render.run(this.render);
        // create runner
        runner = Runner.create();
        // run the engine
        Runner.run(runner, this.engine)

        Events.on(runner, 'afterUpdate', () => {
            if (this.boxA)
            {
                this.boxA.update();
            }
        })
    }
}