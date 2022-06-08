import React, { useEffect, useState } from 'react'

import { Stage, Layer, Rect, Text, Line } from 'react-konva'
import Konva from 'konva'

import Button from 'react-bootstrap/Button';


interface Line {
    x: number;
    y: number;
    radius: number;
    points: any[];
    mode: string;
    physics: boolean;
}

interface Position {
    x: number;
    y: number;
}

function Canvas() {

    const [mode, setMode] = useState('drawing');
    const [lines, setLines] = useState<Line[]>([]);
    const [currentPoints, setCurrentPoints] = useState<number[]>([]);
    const [physicsState, setPhysicsState] = useState(true);
    const [sketchState, setSketchState] = useState(true);

    // initialization; this function is called when first render
    useEffect(() => {

    });


    // returns a color for given mode
    const color = (mode: string) => {
        if (mode === 'drawing') return 'red';
        if (mode === 'emitter') return 'blue';
        if (mode === 'motion') return 'purple';
        return 'black';
    }

    // react for the mouse down
    const mouseDown = (pos: Position) => {
        // start sketching
        setSketchState(true);
        setCurrentPoints([pos.x, pos.y, pos.x, pos.y]);
    }

    // react for the mouse movement
    const mouseMove = (pos: Position) => {
        // if not sketching, abort
        if (!sketchState) { return false; }

        // if it is paiting, get the points
        let points = currentPoints;

        // if the new position is the same as the last position, abort
        if (points[points.length - 2] === pos.x
            && points[points.length - 1] === pos.y) { return false; }

        // concate the new points into currentPoints
        points = points.concat([pos.x, pos.y])
        setCurrentPoints(points)
    }

    // react for mouse up
    const mouseUp = (pos: Position) => {
        // stop sketching
        setSketchState(false);
        // if not drawn dots, abort
        if (currentPoints.length === 0) { return false; }

        let newLines = lines
        let isPhysics = (physicsState && mode === 'drawing')
        let points = currentPoints
        
        // use points to create sketched object
        let sketchedObject = new Konva.Line({ points: points })
        let sketchedObjectBound = sketchedObject.getClientRect();

        let x = 0, y = 0
        
        // if (this.state.mode !== 'emitter') {
        //     x = bb.x + bb.width / 2
        //     y = bb.y + bb.height / 2
        //     points = points.map((num, i) => {
        //         return (i % 2 === 0) ? num - x : num - y
        //     })
        // }
        newLines.push({
            x: x, y: y,
            radius:  Math.min(sketchedObjectBound.width, sketchedObjectBound.height),
            points: points,
            mode: mode,
            physics: isPhysics,
        })

        setLines(newLines);
        setCurrentPoints([]);
        // if (this.state.mode === 'emitter') {
        //     this.emit.start()
        // }
    }



    return (
        <>
            {/* buttons for switch mode */}
            <div style={{ position: 'fixed', top: '10px', width: '100%', textAlign: 'center', zIndex: 1 }}>
                <Button>
                    Animate
                </Button>
                <Button onClick={() => setMode('drawing')}>
                    Drawing Line
                </Button>
                <Button onClick={() => setMode('motion')}>
                    Motion Line
                </Button>
                <Button onClick={() => setMode('emitter')}>
                    Emitter Line
                </Button>
                {/* <input name="isGoing" type="checkbox" checked={this.state.isPhysics} onChange={this.enablePhysics.bind(this)} />Enable Physics */}
            </div>

            {/* real canvas for drawing */}
            <div >
                <div id="physics-container"></div>
                <Stage width={1024} height={1024}>
                    <Layer>
                        {/* <Layer ref={ref => (this.layer = ref)}> */}
                        <Line
                            points={currentPoints}
                            stroke={'black'}
                        />
                        {/* draw all the lines */}
                        {lines.map((line, i) => {
                            return (
                                <Line
                                    key={i}
                                    id={`line-${i}`}
                                    name={`line-${i}`}
                                    physics={line.physics}
                                    x={line.x}
                                    y={line.y}
                                    radius={line.radius}
                                    points={line.points}
                                    stroke={color(line.mode)}
                                />
                            )
                        })}
                        {/* <Emit
                        canvas={ this }
                      />
                      <Physics
                        canvas={ this }
                      /> */}
                    </Layer>
                </Stage>
            </div>
        </>
    );
}

export default Canvas