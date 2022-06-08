import Canvas from './Canvas.tsx'
function App() {  
  return (
    <div className="App">
      <Canvas></Canvas>

      <a-scene>
          <a-camera id="camera" look-controls="false" position="0 8 0" cursor="fuse: false; rayOrigin: mouse;"></a-camera>
          <a-plane drawing-plane id="drawing-plane" class="cantap" position="0 5 -10" rotation="0 0 0" width="10" height="10" color="#7BC8A4"></a-plane>
        </a-scene>
    </div>
  );
}

export default App;
