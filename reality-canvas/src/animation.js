
export default class Animation {
    stage
    firstPointOffsets
    bodyPartID
    frames = []
    fpsCount = -1

    constructor(id, stage, bodyPartID) {
        this.bodyPartID = id;
        this.stage = stage;
        this.bodyPartID = bodyPartID;
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

    update(x, y) {
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
        this.show_frame(this.frames[this.fpsCount]);
    }

}