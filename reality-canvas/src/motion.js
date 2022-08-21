export default class Motion {
    bodyPartID
    trailing
    stage
    type
    constructor(id, type, stage) {
        this.bodyPartID = id;
        this.stage = stage;
        this.type = type;

        if (this.type === "trailing") {
            this.trailing = new Konva.Line({
                stroke: window.color,
                strokeWidth: window.thickness,
                globalCompositeOperation: 'source-over',
                // round cap for smoother lines
                lineCap: 'round',
                // add point twice, so we have some drawings even on a simple click
                points: [],
            });
            this.stage.layer.add(this.trailing);
        }
    }


    update(x, y) {
        if (this.type === "trailing") {
            let newPoints = []

            for (let i = 0; i < this.trailing.attrs.points.length; i++) {
                newPoints.push(this.trailing.attrs.points[i]);
            }
            newPoints.push(Math.floor(x));
            newPoints.push(Math.floor(y));

            if (newPoints.length > 35) {
                newPoints = newPoints.slice(2);
            }

            this.trailing.points(newPoints);
        }
    }

};
