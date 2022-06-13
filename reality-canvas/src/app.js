import Canvas from './canvas.js';
class App {
    constructor(parent) {
        // let parentTag = document.getElementsByTagName(parent);
        // parentTag[0].appendChild(this.create_drawing_plane());
        this.canvas = new Canvas(parent);
    }
}
const app = new App("a-scene");
// console.log("success")
