import { useState, Suspense, useLayoutEffect, useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useLenis } from 'lenis/react';

import vertex from './gradient/vertex.glsl';
import fragment from './gradient/fragment.glsl';
import { Flowmap } from './Flowmap';

function Gradient({ element, geometry }) {
  const mesh = useRef();
  const material = useRef();
  const bounds = useRef();
  const currentScroll = useRef();

  const mouse = new THREE.Vector2(-1, -1);
  const velocity = new THREE.Vector2();

  let lastTime = 0;
  const lastMouse = new THREE.Vector2();

  let time = 0;

  const { viewport, size, gl, scene } = useThree();

  const shaderArgs = {
    uniforms: {
      uTime: { value: 0 },
      uColor3: { value: new THREE.Color('#9F327E') },
      uColor2: { value: new THREE.Color('#EA6644') },
      uColor1: { value: new THREE.Color('#F5B532') },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uRatio: { value: 16 / 9 },
      tFlow: { value: null },
    },
    vertexShader: vertex,
    fragmentShader: fragment,
  };

  const flowmap = new Flowmap(gl, scene, viewport);

  useLenis(({ scroll }) => {
    if (bounds.current !== undefined) {
      updateY(scroll);
    }

    currentScroll.current = scroll;
  });

  useEffect(() => {
    window.addEventListener('mousemove', (e) => {
      let x = e.clientX || (e.touches && e.touches[0].clientX);
      let y = e.clientY || (e.touches && e.touches[0].clientY);

      if (x === undefined) return;

      const mouseX = x / window.innerWidth;
      const mouseY = 1 - y / window.innerHeight;

      const currentTime = performance.now();
      const deltaTime = Math.max(14, currentTime - (lastTime || currentTime));

      const deltaX = x - lastMouse.x;
      const deltaY = y - lastMouse.y;

      velocity.set(deltaX / deltaTime, deltaY / deltaTime);

      lastMouse.set(x, y);
      lastTime = currentTime;

      mouse.set(mouseX, mouseY);
    });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react/prop-types
    const rect = element.getBoundingClientRect();

    bounds.current = {
      top: rect.top + currentScroll.current,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    };

    const aspect = window.innerWidth / window.innerHeight;
    flowmap.aspect = aspect;

    updateScale();
    updateX();
    updateY(currentScroll.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewport, size]);

  useFrame(() => {
    if (mesh.current === undefined) return;

    if (!velocity.length()) {
      mouse.set(-1, -1);
    }

    flowmap.mouse.copy(mouse);
    flowmap.velocity.lerp(velocity, velocity.length() ? 0.5 : 0.1);

    const flowTexture = flowmap.update();
    shaderArgs.uniforms.tFlow.value = flowTexture;

    time++;

    mesh.current.material.uniforms.uTime.value = time;
  });

  const updateScale = () => {
    mesh.current.scale.x = (viewport.width * bounds.current.width) / size.width;
    mesh.current.scale.y =
      (viewport.height * bounds.current.height) / size.height;
  };

  const updateX = (x = 0) => {
    mesh.current.position.x =
      -viewport.width / 2 +
      mesh.current.scale.x / 2 +
      ((bounds.current.left - x) / size.width) * viewport.width;
  };

  const updateY = (y = 0) => {
    mesh.current.position.y =
      viewport.height / 2 -
      mesh.current.scale.y / 2 -
      ((bounds.current.top - y) / size.height) * viewport.height;
  };

  return (
    <mesh ref={mesh} geometry={geometry}>
      <rawShaderMaterial args={[shaderArgs]} ref={material} />
    </mesh>
  );
}

function Content() {
  const [itemElements, setItemElements] = useState([]);
  const planeGeometry = new THREE.PlaneGeometry(1, 1, 16, 16);

  useLayoutEffect(() => {
    const items = document.querySelectorAll('.webgl-item');
    setItemElements([...items]);
  }, []);

  if (!itemElements) return;

  return (
    <>
      {itemElements.length > 0
        ? itemElements.map((element, index) => {
            return (
              <Gradient
                key={index}
                element={element}
                geometry={planeGeometry}
              />
            );
          })
        : null}
    </>
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
        <Content />
      </Suspense>
    </Canvas>
  );
}
