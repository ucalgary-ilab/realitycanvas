export default class Contour {
    contourLine
    size = 80
    stage
    constructor(stage) {
        this.contourLine = new Konva.Line({
            stroke: 'white',
            strokeWidth: 8,
            globalCompositeOperation: 'source-over',
            // round cap for smoother lines
            lineCap: 'round',
            // add point twice, so we have some drawings even on a simple click
            points: [],
        });
        this.stage = stage;
        this.stage.layer.add(this.contourLine);
    }

    update(contourPoints) {
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

            theClosetPoint = (theClosetPoint + 4) % contourPoints.length;

            newPoints = newPoints.slice(2);
            newPoints.push(contourPoints[theClosetPoint]);
            newPoints.push(contourPoints[theClosetPoint + 1]);
        }
        console.log(newPoints);
        this.contourLine.points(newPoints);
    }
}