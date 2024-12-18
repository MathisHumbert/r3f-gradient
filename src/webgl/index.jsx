import { useState, Suspense, useLayoutEffect, useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useLenis } from 'lenis/react';

import vertex from './gradient/vertex.glsl';
import fragment from './gradient/fragment.glsl';

function Gradient({ element, geometry }) {
  const mesh = useRef();
  const material = useRef();
  const bounds = useRef();
  const currentScroll = useRef();
  let time = 0;

  const { viewport, size } = useThree();

  const shaderArgs = {
    uniforms: {
      uTime: { value: 0 },
      uColor3: { value: new THREE.Color('#9F327E') },
      uColor2: { value: new THREE.Color('#EA6644') },
      uColor1: { value: new THREE.Color('#F5B532') },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uRatio: { value: 16 / 9 },
    },
    vertexShader: vertex,
    fragmentShader: fragment,
  };

  useLenis(({ scroll }) => {
    if (bounds.current !== undefined) {
      updateY(scroll);
    }

    currentScroll.current = scroll;
  });

  useEffect(() => {
    // element.addEventListener('mouseenter', onMouseEnter);
    // element.addEventListener('mouseleave', onMouseLeave);
    // window.addEventListener('mousemove', onMouseMove);
  }, []);

  useEffect(() => {
    const rect = element.getBoundingClientRect();

    bounds.current = {
      top: rect.top + currentScroll.current,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    };

    updateScale();
    updateX();
    updateY(currentScroll.current);
  }, [viewport, size]);

  useFrame((state) => {
    if (mesh.current === undefined) return;

    time++;

    // mesh.current.material.uniforms.uTime.value = state.clock.getElapsedTime();
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
