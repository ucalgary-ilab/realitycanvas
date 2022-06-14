import Canvas from './canvas.js'



class App{
    canvas: Canvas = new Canvas()

    constructor()
    {
    }

}

const app = new App();

const animate = () =>{
    app.canvas.animate();
}

document.getElementById('animate_button')?.addEventListener('click',animate)