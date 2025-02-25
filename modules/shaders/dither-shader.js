
import * as THREE from 'three';
export const DitherShader = {
  uniforms: {
      textureSampler: { value: null },
      resolution: new THREE.Uniform(new THREE.Vector2(window.innerWidth, window.innerHeight)),
      bias: { value: 0.4 },
      excludedColor: { value: new THREE.Vector3(1.0, 0.0, 0.0) }, // Default: Exclude pure red
      tolerance: { value: 0.05 } // Tolerance range for matching color
  },

  vertexShader: /* glsl */`
      varying vec2 vUv;

      void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
  `,

  fragmentShader: /* glsl */`
      precision highp float;

      uniform float bias;
      uniform vec2 resolution;
      uniform sampler2D textureSampler;
      uniform vec3 excludedColor;
      uniform float tolerance;

      varying vec2 vUv;

      const float bayerMatrix8x8[64] = float[64](
          0.0/64.0, 48.0/64.0, 12.0/64.0, 60.0/64.0,  3.0/64.0, 51.0/64.0, 15.0/64.0, 63.0/64.0,
          32.0/64.0, 16.0/64.0, 44.0/64.0, 28.0/64.0, 35.0/64.0, 19.0/64.0, 47.0/64.0, 31.0/64.0,
          8.0/64.0, 56.0/64.0,  4.0/64.0, 52.0/64.0, 11.0/64.0, 59.0/64.0,  7.0/64.0, 55.0/64.0,
          40.0/64.0, 24.0/64.0, 36.0/64.0, 20.0/64.0, 43.0/64.0, 27.0/64.0, 39.0/64.0, 23.0/64.0,
          2.0/64.0, 50.0/64.0, 14.0/64.0, 62.0/64.0,  1.0/64.0, 49.0/64.0, 13.0/64.0, 61.0/64.0,
          34.0/64.0, 18.0/64.0, 46.0/64.0, 30.0/64.0, 33.0/64.0, 17.0/64.0, 45.0/64.0, 29.0/64.0,
          10.0/64.0, 58.0/64.0,  6.0/64.0, 54.0/64.0,  9.0/64.0, 57.0/64.0,  5.0/64.0, 53.0/64.0,
          42.0/64.0, 26.0/64.0, 38.0/64.0, 22.0/64.0, 41.0/64.0, 25.0/64.0, 37.0/64.0, 21.0/64.0
      );

      vec3 orderedDither(vec2 uv, vec3 color) {
          int x = int(mod(uv.x * resolution.x, 8.0));
          int y = int(mod(uv.y * resolution.y, 8.0));
          float threshold = bayerMatrix8x8[y * 8 + x];

          vec3 ditheredColor = step(threshold + bias, color) * color;
          return ditheredColor;
      }

      void main(void) {
          vec4 color = texture(textureSampler, vUv);

          // Check if color is within tolerance of excludedColor
          float diff = distance(color.rgb, excludedColor);
          if (diff < tolerance) {
              gl_FragColor = color; // Keep original color, no dithering
          } else {
              color.rgb = orderedDither(vUv, color.rgb);
              gl_FragColor = color;
          }
      }
  `
};
