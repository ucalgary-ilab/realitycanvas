var _a;
import Canvas from './canvas.js';
class App {
    constructor() {
        this.canvas = new Canvas();
    }
}
const app = new App();
const animate = () => {
    app.canvas.animate();
};
(_a = document.getElementById('animate_button')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', animate);
