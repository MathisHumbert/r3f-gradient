import { Suspense, useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import vertex from './gradient/vertex.glsl';
import fragment from './gradient/fragment.glsl';
import { Flowmap } from './Flowmap';

function Gradient() {
  const geometry = new THREE.PlaneGeometry(1, 1, 16, 16);

  const mesh = useRef();
  const material = useRef();

  const mouse = useRef(new THREE.Vector2(-1, -1));
  const lastMouse = useRef(new THREE.Vector2());
  const velocity = useRef(new THREE.Vector2());

  let lastTime = 0;

  const { viewport, size, gl, scene } = useThree();

  const shaderArgs = {
    uniforms: {
      uTime: { value: 0 },
      uColor3: { value: new THREE.Color('#9F327E') },
      uColor2: { value: new THREE.Color('#EA6644') },
      uColor1: { value: new THREE.Color('#F5B532') },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      tFlow: { value: null },
    },
    vertexShader: vertex,
    fragmentShader: fragment,
  };

  const flowmap = new Flowmap(gl, scene, viewport);

  useEffect(() => {
    mesh.current.scale.x = viewport.width;
    mesh.current.scale.y = viewport.height;
  }, [viewport]);

  useEffect(() => {
    const onMouseMove = (e) => {
      let x = e.clientX || (e.touches && e.touches[0].clientX);
      let y = e.clientY || (e.touches && e.touches[0].clientY);

      if (x === undefined) return;

      const mouseX = x / window.innerWidth;
      const mouseY = 1 - y / window.innerHeight;

      const currentTime = performance.now();
      const deltaTime = Math.max(14, currentTime - (lastTime || currentTime));

      const deltaX = x - lastMouse.current.x;
      const deltaY = y - lastMouse.current.y;

      velocity.current.set(deltaX / deltaTime, deltaY / deltaTime);

      lastMouse.current.set(x, y);
      lastTime = currentTime;

      mouse.current.set(mouseX, mouseY);
    };

    window.addEventListener('mousemove', (e) => onMouseMove(e));

    return () => {
      window.removeEventListener('mousemove', (e) => onMouseMove(e));
    };
  }, []);

  useFrame((state) => {
    if (!velocity.current.length()) {
      mouse.current.set(-1, -1);
    }

    flowmap.mouse.copy(mouse.current);
    flowmap.velocity.lerp(
      velocity.current,
      velocity.current.length() ? 0.5 : 0.1
    );

    const flowTexture = flowmap.update();
    shaderArgs.uniforms.tFlow.value = flowTexture;
    shaderArgs.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh ref={mesh} geometry={geometry}>
      <rawShaderMaterial args={[shaderArgs]} ref={material} />
    </mesh>
  );
}

export function WebGL() {
  return (
    <Canvas
      gl={{
        powerPreference: 'high-performance',
        antialias: true,
        alpha: true,
      }}
      dpr={[1, 2]}
      legacy={true}
    >
      <Suspense>
        <Gradient />
      </Suspense>
    </Canvas>
  );
}
