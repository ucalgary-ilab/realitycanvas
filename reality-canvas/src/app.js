import Physic from "./physic.js";
import Stage from "./stage.js";
class App {
    constructor() {
        this.physic = new Physic();
        this.stage = new Stage();
    }
}
new App();
// const animate = () =>{
//     app.canvas.animate();
// }
// document.getElementById('animate_button')?.addEventListener('click',animate)
