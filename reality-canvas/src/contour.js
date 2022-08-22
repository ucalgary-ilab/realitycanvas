export default class Contour {
    contourLine
    type
    progress
    size = 80
    stage
    constructor(stage, type) {
        this.contourLine = new Konva.Line({
            stroke: 'white',
            strokeWidth: window.thickness,
            globalCompositeOperation: 'source-over',
            // round cap for smoother lines
            lineCap: 'round',
            // add point twice, so we have some drawings even on a simple click
            points: [],
        });
        this.type = type;
        this.stage = stage;
        this.stage.layer.add(this.contourLine);
        this.progress = 0;
    }


    update(contourPoints) {
        if (this.type == "line around") {
            let newPoints = this.contourLine.attrs.points;
            // initialize the line
            if (newPoints.length == 0) {
                for (let i = 0; i < contourPoints.length && i < this.size; i += 2) {
                    newPoints.push(contourPoints[i]);
                }
            }
            else {  // find the closet on the contour, add the next, pop the last
                let theClosetPoint = 0;
                let headPoint = { x: newPoints[newPoints.length - 2], y: newPoints[newPoints.length - 1] };

                for (let i = 0; i < contourPoints.length; i += 2) {
                    let disNew = Math.pow(headPoint.x - contourPoints[i], 2) + Math.pow(headPoint.y - contourPoints[i + 1], 2);
                    let disOld = Math.pow(headPoint.x - contourPoints[theClosetPoint], 2) + Math.pow(headPoint.y - contourPoints[theClosetPoint + 1], 2);

                    if (disNew < disOld) {
                        theClosetPoint = i;
                    }
                }


                // move the line 2 points forward along the contour, but only enque one point
                theClosetPoint = (theClosetPoint + 4) % contourPoints.length;

                // delete the trailing point
                newPoints = newPoints.slice(2);
                newPoints.push(contourPoints[theClosetPoint]);
                newPoints.push(contourPoints[theClosetPoint + 1]);
            }
            // update the line
            this.contourLine.points(newPoints);
        }
        else if (this.type == "bottom up") {
            if (this.progress >= 100) {
                this.progress = 0;
                return;
            }
            let headY = 1280, footY = -1;
            for (let i = 0; i < contourPoints.length; i += 2) {
                if (contourPoints[i + 1] > footY) {
                    footY = contourPoints[i + 1];
                }
                if (contourPoints[i + 1] < headY) {
                    headY = contourPoints[i + 1];
                }
            }
            let cutOff = Math.floor(footY - (footY - headY) * this.progress / 100);
            let newPoints = [];
            for (let i = 0; i < contourPoints.length; i += 2) {
                if (contourPoints[i + 1] <= footY && contourPoints[i + 1] >= cutOff) {
                    newPoints.push(contourPoints[i]);
                    newPoints.push(contourPoints[i + 1]);
                }
            }
            this.contourLine.points(newPoints);
            this.progress += 3;
        }

    }
}