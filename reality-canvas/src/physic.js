import Matter from 'matter-js';
// module aliases
var Engine = Matter.Engine, Render = Matter.Render, Runner = Matter.Runner, Bodies = Matter.Bodies, Svg = Matter.Svg, Vertices = Matter.Vertices, Composite = Matter.Composite, Events = Matter.Events;
export default class Physic {
    constructor() {
        this.engine = Engine.create();
        this.render = Render.create({
            element: document.getElementsByTagName('a-scene')[0],
            engine: this.engine,
            options: {
                showPositions: true,
                showAngleIndicator: true,
                background: '#800000',
                wireframeBackground: 'none'
            }
        });
        this.particles = [];
        var ground = Bodies.rectangle(400, 610, 1200, 60, { isStatic: true });
        Composite.add(this.engine.world, ground);
        this.run();
    }
    add_particle(particle) {
        this.particles.push(particle);
        console.log(particle);
        Composite.add(this.engine.world, particle.physicBody);
        // console.log(this.particles);
    }
    run() {
        var runner;
        Render.run(this.render);
        // create runner
        runner = Runner.create();
        // run the engine
        Runner.run(runner, this.engine);
        Events.on(runner, 'afterUpdate', () => {
            this.particles.map(p => {
                console.log(p);
                p.update();
            });
        });
    }
}
