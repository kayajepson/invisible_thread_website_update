import * as THREE from 'three/src/Three'
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { apply as applyThree, Canvas, useRender, useThree } from 'react-three-fiber'
import { apply as applySpring, useSpring, a, interpolate, config } from 'react-spring/three'
import { a as aDom } from '@react-spring/web'
import './styles.css'
import { Images, Image } from './sceneElements/Images'
import Text from './sceneElements/Text'
import Thread from './sceneElements/Thread'
import Stars from './sceneElements/Stars'
import heart from './images/heart.mp4'
import video1 from './images/small/video1.mp4'
import video2 from './images/small/video2.mp4'
import Logo from './sceneElements/Logo'

import ContactFormElement from './sceneElements/ContactFormElement'

import useYScroll from './helpers/useYScroll'

import { CSS3DRenderer, CSS3DObject } from "three/examples/jsm/renderers/CSS3DRenderer";

// Import and register postprocessing classes as three-native-elements for both react-three-fiber & react-spring
// They'll be available as native elements <effectComposer /> from then on ...
import { EffectComposer } from './postprocessing/EffectComposer'
import { RenderPass } from './postprocessing/RenderPass'
import { GlitchPass } from './postprocessing/GlitchPass'
import { WaterPass } from './postprocessing/WaterPass'

import ContactForm from './sceneElements/ContactForm'
import { Vector3, Camera } from 'three/src/Three';

applySpring({ EffectComposer, RenderPass, GlitchPass, WaterPass })
applyThree({ EffectComposer, RenderPass, GlitchPass, WaterPass })

function App() {
  const [{ top, mouse }, set] = useSpring(() => ({ top: 0, mouse: [0, 0] }));
  const onMouseMove = useCallback(({ clientX: x, clientY: y }) => set({ mouse: [x - window.innerWidth / 2, y - window.innerHeight / 2] }), []);
  // const onScroll = useCallback(e => set({ top: e.target.scrollTop }), []);
  const cam = new THREE.PerspectiveCamera(45, 0, 0.1, 1000);
  cam.position.z = 0;

  const { y, setLock, setY } = useYScroll([0, 200], { domTarget: window })

  return (
    <>
      <Canvas className="canvas" camera={cam} onMouseMove={onMouseMove}>
        <Scene top={y} mouse={mouse} setY={setY} setLock={setLock} />
      </Canvas>
      <aDom.div className="bar" style={{ height: y.interpolate([0, 200], ['0%', '100%']) }} />

      <ContactFormElement />

      <video id="video1" loop crossOrigin="anonymous" style={{ display: 'none' }}>
        <source src={heart} type='video/mp4; codecs="avc1.42E01E, mp4a.40.2"' />
      </video>
      <video id="video2" loop crossOrigin="anonymous" style={{ display: 'none' }}>
        <source src={video1} type='video/mp4; codecs="avc1.42E01E, mp4a.40.2"' />
      </video>
      <video id="video3" loop crossOrigin="anonymous" style={{ display: 'none' }}>
        <source src={video2} type='video/mp4; codecs="avc1.42E01E, mp4a.40.2"' />
      </video>
    </>
  );
}

export default App;


function Scene({ top, mouse, setY, setLock }) {
  const { size } = useThree()
  const scrollMax = size.height * 4.5
  const { camera } = useThree();
  const [{ rotation }, set] = useSpring(() => ({ rotation: 0, config: config.slow }));
  // {rotation: 0, from: {rotation: 0}, to: {rotation: 90}, config: config.molasses});


  const [snapped, setSnapped] = useState(false);


  const snap = useCallback((snapTo, y) => {
    if (snapTo) {
      setY(-( y + 2.5 ));
      setSnapped(true);
    } else {
      setY(top.getValue() - 2);
      setSnapped(false);
    }
  }, [setY])

  useRender(() => {
    const pos = top.getValue();
    const rotationValue = rotation.getValue();
    camera.position.x = 0;
    camera.position.z = 0;

    // if (pos < vh(2)) {
    //   set({ rotation: 0 });
    //   // set({ rotation: -(pos / (vh(100) * 0.9)) });
    // } else {
    //   set({ rotation: -90 });
    // }
    // camera.rotation.x = THREE.Math.degToRad(rotationValue);

    // setLock((rotationValue > -90 && rotationValue < 0))


    // if (pos < vh(2)) {
    //   camera.position.y = 0;
    // } else {
    //   camera.position.y = -pos;
    // }

    camera.position.y = -pos;
    camera.rotation.x = THREE.Math.degToRad(-90);


    //Set mouse hover offset
    const mousePos = mouse.getValue();
    let cameraOffset = new THREE.Vector3(
      (mousePos[0] * 10) / 50000 - camera.position.x,
      camera.position.y,
      (mousePos[1] * 10) / 50000 - camera.position.z)
    camera.position.lerp(cameraOffset, 0.8);
  })

  return (
    <>
      {/* <a.spotLight intensity={1.2} color="white" position={mouse.interpolate((x, y) => [x / 100, -y / 100, 6.5])} /> */}
      <a.pointLight intensity={1.2} color="white" position={mouse.interpolate((x, y) => [x / 100, -y / 100, 6.5])} />
      <Logo top={top} />
      {/* <Effects factor={top.interpolate([0, 150], [1, 0])} /> */}
      {/* <Stars position={top.interpolate(top => [0, -1 + top / 20, 0])} /> */}
      <Images top={top} mouse={mouse} scrollMax={scrollMax} snap={snap} />
      {/* <Thing /> */}
      {/* <Background color={top.interpolate([0, scrollMax * 0.25, scrollMax * 0.8, scrollMax], ['#27282F', '#247BA0', '#70C1B3', '#f8f3f1'])} /> */}
      {/* <ContactForm /> */}
      {/* <Text opacity={1} fontSize={210} >
        Invisible Thread
      </Text> */}
      {/* <Text opacity={1} position={top.interpolate(top => [0, -20 + ((top * 10) / scrollMax) * 2, 0])} fontSize={150}>
        Ipsum
      </Text> */}
    </>
  )
}




function vh(value) {
  return (window.innerHeight / 100) * value
}

// /** This component creates a glitch effect */
const Effects = React.memo(({ factor }) => {
  const { gl, scene, camera, size } = useThree()
  const composer = useRef()

  useEffect(() => void composer.current.setSize(size.width, size.height), [size])
  // This takes over as the main render-loop (when 2nd arg is set to true)
  useRender(() => composer.current.render(), true)
  return (
    <effectComposer ref={composer} args={[gl]}>
      {/* Main Pass that renders the Scene */}
      <renderPass attachArray="passes" args={[scene, camera]} />
      <a.waterPass attachArray="passes" factor={factor} renderToScreen />

      {/* <a.unrealBloomPass attachArray="passes" factor={factor} renderToScreen /> */}
      {/* Effect Passes renderToScreen draws current pass to screen*/}
      {/* <a.glitchPass attachArray="passes" renderToScreen factor={factor} /> */}
    </effectComposer>
  )
})

// /** This component creates a fullscreen colored plane */
function Background({ color }) {
  const { viewport } = useThree()
  return (
    <mesh scale={[viewport.width, viewport.height, 1]} position={new Vector3(0, 0, 0)}>
      <planeGeometry attach="geometry" args={[1, 1]} />
      <a.meshBasicMaterial attach="material" color={color} depthTest={false} />
    </mesh>
  )
}


function Thing({ vertices = [[-1, 0, 0], [0, 1, 0], [1, 0, 0], [0, -1, 0], [-1, 0, 0]] }) {
  return (
    <group ref={ref => console.log('we have access to the instance')}>
      <line>
        <geometry
          attach="geometry"
          vertices={vertices.map(v => new THREE.Vector3(...v))}
          onUpdate={self => (self.verticesNeedUpdate = true)}
        />
        <lineBasicMaterial attach="material" color="black" />
      </line>
      <mesh onClick={e => console.log('click')} onPointerOver={e => console.log('hover')} onPointerOut={e => console.log('unhover')}>
        <octahedronGeometry attach="geometry" />
        <meshBasicMaterial attach="material" color="peachpuff" opacity={0.5} transparent />
      </mesh>
    </group>
  )
}
