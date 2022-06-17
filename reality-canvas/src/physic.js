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
        // create two boxes and a ground
        this.boxA = Bodies.rectangle(400, 200, 80, 80);
        var boxB = Bodies.rectangle(450, 50, 80, 80);
        // var boxC = Bodies.rectangle(550, 50, 80, 80);
        var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
        Composite.add(this.engine.world, [this.boxA, boxB, ground]);
        this.run();
    }
    add_body(x, y, vertices) {
        let body = Bodies.fromVertices(x, y, vertices);
        console.log(body);
        Composite.add(this.engine.world, body);
    }
    run() {
        var runner;
        Render.run(this.render);
        // create runner
        runner = Runner.create();
        // run the engine
        Runner.run(runner, this.engine);
        Events.on(this.engine, 'afterUpdate', () => {
            console.log(this.boxA.position);
        });
    }
}
