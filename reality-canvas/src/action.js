export default class Action {

    bodyPartID
    type
    animation
    triggered = false

    constructor(type, animation) {
        this.type = type;
        this.animation = animation;
        this.bodyPartID = this.animation.bodyPartID;
    }


    // alter update behavior of animation
    update(x, y) {
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

        
    }
};
