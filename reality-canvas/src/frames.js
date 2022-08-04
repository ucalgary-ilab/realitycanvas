
export default class frames {
    stage
    firstPointOffset
    bodyPartID
    frames = []
    fpsCount = 0

    constructor(id, stage, bodyPartID) {
        this.bodyPartID = id;
        this.stage = stage;

        this.stage = stage;
        this.bodyPartID = bodyPartID;
    }

    first_frame(frame, offset) {
        // store the first point offset for future update
        this.firstPointOffset = offset;
        // add the first frame
        this.new_frame(frame);
    }

    new_frame(frame) {
        // hide the frame
        this.hide_frame(frame);
        // add the new frame
        this.frames.push(frame);
    }

    final_frame(frame) {
        this.new_frame(frame);
        this.show_frame(frames[this.fpsCount]);
    }

    hide_frame(frame) {
        frame.map(line => {
            line.hide();
        })
    }

    show_frame(frame) {
        frame.map(line => {
            line.show();
        })
    }

    update(x, y) {
        // update frames' positions
        let offsetX = Math.floor(x - this.firstPointOffset[i].x - this.frameShapes[0][0].attrs.points[0]);
        let offsetY = Math.floor(y - this.firstPointOffset[i].y - this.frameShapes[0][0].attrs.points[1]);

        this.frames.map(frame => {
            frame.map(line => {
                let newPoints = [];
                for (let i = 0; i < line.attrs.points.length; i += 2) {
                    newPoints.push(line.attrs.points[i] + offsetX);
                    newPoints.push(line.attrs.points[i + 1] + offsetY);
                }
                line.points(newPoints);
            })
        })

        // flip a frame
        this.hide_frame(this.frames[this.fpsCount]);
        if (this.fpsCount == this.frames.length - 1) {
            this.fpsCount = 0;
        }
        else {
            this.fpsCount++;
        }
        this.show_frame(this.frames[this.fpsCount]);
    }

}