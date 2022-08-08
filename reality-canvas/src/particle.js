
import Konva from 'konva'
import _ from 'lodash'

export default class Particle {
    // stage shape should be an array of konva lines
    animation = []
    stage
    yspeed = Math.floor(Math.random() * 20 + 5)
    xspeed = 0
    position

    constructor(animation, stage, color, position) {
        this.stage = stage;
        this.position = position;

        // the first point of the drawing would match the position
        let offsetX = this.position.x - shape[0].attrs.points[0];
        let offsetY = this.position.y - shape[0].attrs.points[1];


        animation.map(frame => {
            let newFrame = [];
            frame.map(line => {
                let newPoints = [];
                for (let i = 0; i < line.attrs.points.length; i += 2) {
                    newPoints.push(line.attrs.points[i] + offsetX);
                    newPoints.push(line.attrs.points[i + 1] + offsetY);
                }

                let copiedLine = new Konva.Line({
                    stroke: color,
                    strokeWidth: 4,
                    globalCompositeOperation: 'source-over',
                    // round cap for smoother lines
                    lineCap: 'round',

                    // copy the points from the prototype
                    points: newPoints,
                });

                this.stage.layer.add(copiedLine);
                newFrame.push(copiedLine);
            })
            this.animation.push(newFrame);
        });

    }


    update(x, y) {
        // the position is the respawning point
        this.position.x += x;
        this.position.y += y;

        let offsetX = this.position.x - this.animation[0][0].attrs.points[0];
        let offsetY = this.position.y - this.animation[0][0].attrs.points[1];

        // if out of the screen, reset on the respawning point
        if (this.animation[0][0].attrs.points[1] > 720) {
            this.animation.map(
                frame => {
                    frame.map(
                        line => {
                            let newPoints = [];
                            for (let i = 0; i < line.attrs.points.length; i += 2) {
                                newPoints.push(line.attrs.points[i] + offsetX);
                                newPoints.push(line.attrs.points[i + 1] + offsetY);
                            }
                            line.points(newPoints);
                        })
                }

            );
        }
        else {
            this.animation.map(
                frame => {
                    frame.map(
                        line => {
                            let newPoints = [];
                            for (let i = 0; i < line.attrs.points.length; i += 2) {
                                newPoints.push(line.attrs.points[i] + this.xspeed);
                                newPoints.push(line.attrs.points[i + 1] + this.yspeed);
                            }
                            line.points(newPoints);
                        })
                }
            );

        }
    }
}