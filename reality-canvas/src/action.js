export default class Action {

    type
    animation
    triggered = false

    actionInitial = false
    actionComplete = false
    WIDTH = 1280
    HEIGHT = 720

    constructor(type, animation) {
        this.type = type;
        this.animation = animation;
    }


    detectAction(bodyParts) {
        if (this.type == "Wave") { // left 
            if (this.triggered) {
                return;
            }

            let A = { x: bodyParts[11].x * this.WIDTH, y: bodyParts[11].y * this.HEIGHT };
            let B = { x: bodyParts[13].x * this.WIDTH, y: bodyParts[13].y * this.HEIGHT };
            let C = { x: bodyParts[15].x * this.WIDTH, y: bodyParts[15].y * this.HEIGHT };
            let AB = Math.sqrt(Math.pow(B.x - A.x, 2) + Math.pow(B.y - A.y, 2));
            let BC = Math.sqrt(Math.pow(B.x - C.x, 2) + Math.pow(B.y - C.y, 2));
            let AC = Math.sqrt(Math.pow(C.x - A.x, 2) + Math.pow(C.y - A.y, 2));
            let angle = Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB)) * 180 / Math.PI;

            if (A.x < 0 || A.y < 0) {
                return;
            }
            if (B.x < 0 || B.y < 0) {
                return;
            }
            if (C.x < 0 || B.y < 0) {
                return;
            }
            // console.log(angle);

            // console.log(A, B, C, angle);
            if (angle < 90) {
                // console.log("initialized", angle);
                this.actionInitial = true;
            }
            else if (this.actionInitial && angle >= 90) {
                // console.log("completed", angle);
                this.actionComplete = true;
            }

            if (this.actionComplete) {
                console.log("Triggered");
                this.triggered = true;

                this.actionInitial = false;
                this.actionComplete = false;
            }
        }

        if (this.type == "Stomp") { // left
            if (this.triggered) {
                return;
            }

            let A = { x: bodyParts[23].x * this.WIDTH, y: bodyParts[23].y * this.HEIGHT };
            let B = { x: bodyParts[25].x * this.WIDTH, y: bodyParts[25].y * this.HEIGHT };
            let C = { x: bodyParts[27].x * this.WIDTH, y: bodyParts[27].y * this.HEIGHT };
            let AB = Math.sqrt(Math.pow(B.x - A.x, 2) + Math.pow(B.y - A.y, 2));
            let BC = Math.sqrt(Math.pow(B.x - C.x, 2) + Math.pow(B.y - C.y, 2));
            let AC = Math.sqrt(Math.pow(C.x - A.x, 2) + Math.pow(C.y - A.y, 2));
            let angle = Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB)) * 180 / Math.PI;

            if (A.x < 0 || A.y < 0) {
                return;
            }
            if (B.x < 0 || B.y < 0) {
                return;
            }
            if (C.x < 0 || B.y < 0) {
                return;
            }
            // console.log(angle);

            // console.log(A, B, C, angle);
            if (angle < 120) {
                // console.log("initialized", angle);
                this.actionInitial = true;
            }
            else if (this.actionInitial && angle >= 150) {
                // console.log("completed", angle);
                this.actionComplete = true;
            }

            if (this.actionComplete) {
                console.log("Triggered");
                this.triggered = true;

                this.actionInitial = false;
                this.actionComplete = false;
            }
        }
    }

    // alter update behavior of animation
    update(x, y, bodyParts) {
        // if it is alreayd last frame, reset trigger
        if (this.animation.fpsCount == this.animation.frames.length - 1) {
            this.triggered = false;
        }
        this.animation.update(x, y);
        // not show and reset fps count
        if (!this.triggered) {
            this.animation.hide_all_frame();
            this.animation.fpsCount = -1;
        }

        this.detectAction(bodyParts);
    }
};
