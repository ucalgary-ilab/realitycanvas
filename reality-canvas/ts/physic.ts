
import Matter from 'matter-js'


// module aliases
var Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Svg = Matter.Svg,
    Vertices = Matter.Vertices,
    Composite = Matter.Composite;

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


    constructor() {
        // create two boxes and a ground
        var boxA = Bodies.rectangle(400, 200, 80, 80);
        var boxB = Bodies.rectangle(450, 50, 80, 80);
        // var boxC = Bodies.rectangle(550, 50, 80, 80);
        var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });


        // var loadSvg = function(url) {
        //     return fetch(url)
        //         .then(function(response) { return response.text(); })
        //         .then(function(raw) { return (new window.DOMParser()).parseFromString(raw, 'image/svg+xml'); });
        // };

        // let vertexSet = loadSvg("./apple.svg").then(function(path) { return Vertices.scale(Svg.pathToVertices(path, 30), 0.4, 0.4); });

      
        // Composite.add(this.engine.world, Bodies.fromVertices(600,600,vertexSet));

        // add all of the bodies to the world
        Composite.add(this.engine.world, [boxA, boxB, ground]);
        // Composite.add(this.engine.world, boxC);

        // Render.run(this.render);


    }


    add_body(x: number, y: number, 
        vertices: { x: number, y: number }[][]) {

        let body =Bodies.fromVertices(x, y, vertices);
        console.log(body);
        Composite.add(this.engine.world, body);
    }


    run() {
        var runner;

        Render.run(this.render);
        // create runner
        runner = Runner.create();
        // run the engine
        Runner.run(runner, this.engine)

    }
}