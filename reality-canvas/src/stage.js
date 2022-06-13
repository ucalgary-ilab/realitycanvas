import Matter from 'matter-js';
// module aliases
var Engine = Matter.Engine, Render = Matter.Render, Runner = Matter.Runner, Bodies = Matter.Bodies, Composite = Matter.Composite;
export default class Stage {
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
        var boxA = Bodies.rectangle(400, 200, 80, 80);
        var boxB = Bodies.rectangle(450, 50, 80, 80);
        var boxC = Bodies.rectangle(550, 50, 80, 80);
        var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
        // add all of the bodies to the world
        Composite.add(this.engine.world, [boxA, boxB, ground]);
        Composite.add(this.engine.world, boxC);
        // Render.run(this.render);
    }
    add_body(x, y, vertices) {
        Composite.add(this.engine.world, Bodies.fromVertices(x, y, vertices, { minimumArea: 100 }));
    }
    run() {
        var runner;
        Render.run(this.render);
        // create runner
        runner = Runner.create();
        // run the engine
        Runner.run(runner, this.engine);
    }
}
// setTimeout(() => {
//     // World.clear(world);
//     Engine.clear(engine);
//     Render.stop(render);
//     Runner.stop(runner);
//     render.canvas.remove();
//     render.canvas = null;
//     render.context = null;
//     render.textures = {};
//     // add all of the bodies to the world
//     Composite.add(engine.world, [boxA, boxB, ground]);
// }, 5000)
// setTimeout(() => {
//     Render.run(render);
//     // create runner
//     runner = Runner.create();
//     // run the engine
//     Runner.run(runner, engine)
// }, 8000);
