"use strict";
var Matter = require('matter-js');
// module aliases
var Engine = Matter.Engine, Render = Matter.Render, Runner = Matter.Runner, Bodies = Matter.Bodies, Composite = Matter.Composite;
// create an engine
var engine = Engine.create();
// create a renderer
var render = Render.create({
    element: document.getElementsByTagName('a-scene')[0],
    engine: engine,
    options: {
        showPositions: true,
        showAngleIndicator: true,
        background: '#800000',
        wireframeBackground: 'none'
    }
});
let isDrawing = false;
let position = { x: 0, y: 0 };
let canvas = render.canvas;
// add event listeners
canvas.addEventListener('mousedown', e => {
    // set last position to start
    position.x = e.offsetX;
    position.y = e.offsetY;
    isDrawing = true;
});
canvas.addEventListener('mousemove', e => {
    // if it is drawing
    if (isDrawing) {
        // drawing a line between last position with current position
        drawLine(canvas.getContext('2d'), 
        // last position
        position, 
        // current position
        {
            x: e.offsetX,
            y: e.offsetY,
        });
        // update the last position with current position
        position = { x: e.offsetX, y: e.offsetY };
    }
});
// note this is registered on the 'window'
window.addEventListener('mouseup', e => {
    if (isDrawing === true) {
        drawLine(canvas.getContext('2d'), position, { x: e.offsetX, y: e.offsetY });
        // reset
        position = { x: 0, y: 0 };
        isDrawing = false;
    }
});
// draw a line on the canvas respect to  to two points
const drawLine = (context, pos1, pos2) => {
    if (context) {
        console.log('here');
        context.beginPath();
        context.strokeStyle = 'red';
        context.lineWidth = 1;
        context.moveTo(pos1.x, pos1.y);
        context.lineTo(pos2.x, pos2.y);
        context.stroke();
        context.closePath();
    }
};
// create two boxes and a ground
var boxA = Bodies.rectangle(400, 200, 80, 80);
var boxB = Bodies.rectangle(450, 50, 80, 80);
var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
// add all of the bodies to the world
Composite.add(engine.world, [boxA, boxB, ground]);
Render.run(render);
// create runner
var runner = Runner.create();
// run the engine
Runner.run(runner, engine);
setTimeout(() => {
    Render.stop(render);
    Runner.stop(runner);
}, 3000);
setTimeout(() => {
    Render.run(render);
    Runner.run(runner, engine);
}, 10000);
