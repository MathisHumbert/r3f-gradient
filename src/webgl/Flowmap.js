import * as THREE from 'three';

export class Flowmap {
  constructor(renderer, scene, options = {}) {
    this.renderer = renderer;
    this.mainScene = scene;

    const { width = 512, height = 512, dissipation = 0.98 } = options;

    this.mouse = new THREE.Vector2(-1, -1);
    this.velocity = new THREE.Vector2(0, 0);

    this.renderTargetA = new THREE.WebGLRenderTarget(width, height, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });
    this.renderTargetB = this.renderTargetA.clone();
    this.currentRenderTarget = this.renderTargetA;
    this.nextRenderTarget = this.renderTargetB;

    this.material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      uniforms: {
        uMouse: { value: this.mouse },
        uVelocity: { value: this.velocity },
        uPrevTexture: { value: null },
        uDissipation: { value: dissipation },
      },
      vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
      fragmentShader: `
                uniform vec2 uMouse;
                uniform vec2 uVelocity;
                uniform sampler2D uPrevTexture;
                uniform float uDissipation;

                varying vec2 vUv;

                void main() {
                    vec4 prevFlow = texture2D(uPrevTexture, vUv) * uDissipation;

                    float stamp = smoothstep(0.2, 0.0, distance(vUv, uMouse));

                    vec3 newFlow = mix(prevFlow.rgb, vec3(uVelocity, 1.0), stamp);

                    gl_FragColor = vec4(newFlow, 1.0);
                }
            `,
    });

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const geometry = new THREE.PlaneGeometry(2, 2);
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.mesh);

    this.material.uniforms.uPrevTexture.value =
      this.currentRenderTarget.texture;
    renderer.setRenderTarget(this.currentRenderTarget);
    renderer.render(this.scene, this.camera);
    renderer.setRenderTarget(null);
  }

  update() {
    this.material.uniforms.uPrevTexture.value =
      this.currentRenderTarget.texture;

    this.renderer.setRenderTarget(this.nextRenderTarget);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);

    [this.currentRenderTarget, this.nextRenderTarget] = [
      this.nextRenderTarget,
      this.currentRenderTarget,
    ];

    return this.currentRenderTarget.texture;
  }
}
