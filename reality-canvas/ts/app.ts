
import Physic from "./physic.js"
import Stage from "./stage.js"



class App{


    physic: Physic = new Physic()
    stage: Stage = new Stage()

    constructor()
    {
    }

}

new App();

// const animate = () =>{
//     app.canvas.animate();
// }

// document.getElementById('animate_button')?.addEventListener('click',animate)