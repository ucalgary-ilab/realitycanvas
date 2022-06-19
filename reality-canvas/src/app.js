var _a, _b, _c;
import Canvas from "./canvas.js";
class App {
    constructor() {
        this.canvas = new Canvas();
    }
}
// create application instance
const app = new App();
// register button event handlers
const save = () => {
    app.canvas.save_particle();
};
(_a = document.getElementById('save_button')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', save);
const emit = () => {
    app.canvas.mode = "emitting";
};
(_b = document.getElementById('emit_button')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', emit);
const motion = () => {
    app.canvas.mode = "motion";
};
(_c = document.getElementById('motion_button')) === null || _c === void 0 ? void 0 : _c.addEventListener('click', motion);
