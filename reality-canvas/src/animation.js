
export default class Animation {
    stage
    firstPointOffsets = []
    bodyPartID
    frames = []
    fpsCount = -1
    finished = false

    constructor(id, stage) {
        this.bodyPartID = id;
        this.stage = stage;
    }

    finish() {
        this.finished = true;
    }

    add_frame(frame, offset) {
        // hide the frame
        this.hide_frame(frame);
        // add the new frame
        this.frames.push(frame);
        // add the first point offset
        this.firstPointOffsets.push(offset);
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

    hide_all_frame() {
        this.frames.map(frame => {
            this.hide_frame(frame);
        })
    }

    actionUpdate(x,y) {}

    update(x, y) {
        if (!this.finished) {
            return;
        }

        for (let i = 0; i < this.frames.length; i++) {
            let frame = this.frames[i];
            // update frames' positions
            let offsetX = Math.floor(x - this.firstPointOffsets[i].x - this.frames[i][0].attrs.points[0]);
            let offsetY = Math.floor(y - this.firstPointOffsets[i].y - this.frames[i][0].attrs.points[1]);

            frame.map(line => {
                let newPoints = [];
                for (let i = 0; i < line.attrs.points.length; i += 2) {
                    newPoints.push(line.attrs.points[i] + offsetX);
                    newPoints.push(line.attrs.points[i + 1] + offsetY);
                }
                line.points(newPoints);
            })
        }

        // flip a frame
        if (this.fpsCount >= 0)
            this.hide_frame(this.frames[this.fpsCount]);
        if (this.fpsCount == this.frames.length - 1) {
            this.fpsCount = 0;
        }
        else {
            this.fpsCount++;
        }
        // console.log(this.frames[this.fpsCount]);
        this.show_frame(this.frames[this.fpsCount]);
    }

}