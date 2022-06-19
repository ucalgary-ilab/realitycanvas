
import Canvas from "./canvas.js";
import Physic from "./physic.js"
import Stage from "./stage.js"



class App {
    canvas = new Canvas();
}

// create application instance
const app = new App();

// register button event handlers
const save = () => {
    app.canvas.save_particle();
}
document.getElementById('save_button')?.addEventListener('click', save)


const emit = () => {
    app.canvas.mode = "emitting";
}
document.getElementById('emit_button')?.addEventListener('click', emit)

const motion = () => {
    app.canvas.mode = "motion";
}
document.getElementById('motion_button')?.addEventListener('click', motion)