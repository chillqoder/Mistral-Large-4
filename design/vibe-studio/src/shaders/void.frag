// Fragment shader for the void - a living, breathing fluid
precision highp float;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uMouseIntensity;
uniform float uScroll;
uniform float uHeartbeat;

varying vec2 vUv;
varying vec2 vPosition;

// Simplex noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m;
  m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// Fractal Brownian Motion
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 6; i++) {
    value += amplitude * snoise(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

// Domain warping
vec2 warp(vec2 p, float t) {
  vec2 q = vec2(
    fbm(p + vec2(0.0, t * 0.1)),
    fbm(p + vec2(5.2, t * 0.15))
  );
  vec2 r = vec2(
    fbm(p + 4.0 * q + vec2(1.7, 9.2) + t * 0.2),
    fbm(p + 4.0 * q + vec2(8.3, 2.8) + t * 0.25)
  );
  return p + 0.5 * r;
}

void main() {
  vec2 uv = vUv;
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 p = (uv - 0.5) * aspect;
  
  float t = uTime * 0.1;
  
  // Mouse influence
  vec2 mouse = (uMouse - 0.5) * aspect;
  float mouseDist = length(p - mouse);
  float mouseEffect = exp(-mouseDist * 3.0) * uMouseIntensity;
  
  // Heartbeat pulse
  float pulse = sin(uTime * 2.0) * 0.5 + 0.5;
  pulse = pow(pulse, 3.0) * uHeartbeat;
  
  // Scroll influence
  p.y += uScroll * 0.5;
  
  // Domain warping
  vec2 wp = warp(p * 2.0 + vec2(t, -t), t);
  
  // Layered noise
  float n1 = fbm(wp * 3.0);
  float n2 = fbm(wp * 6.0 + vec2(100.0));
  float n3 = fbm(wp * 12.0 + vec2(200.0));
  
  // Combine
  float noise = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
  noise += mouseEffect * 0.5;
  noise += pulse * 0.1;
  
  // Create flowing tendrils
  float tendrils = sin(wp.x * 10.0 + t * 2.0) * sin(wp.y * 10.0 - t * 1.5);
  tendrils = smoothstep(0.3, 0.7, tendrils) * 0.3;
  
  // Distance from center for vignette
  float dist = length(p);
  float vignette = 1.0 - smoothstep(0.3, 1.2, dist);
  
  // Color mixing
  vec3 color1 = vec3(0.02, 0.02, 0.05); // Deep void
  vec3 color2 = vec3(0.0, 0.5, 0.45);   // Phosphor
  vec3 color3 = vec3(0.8, 0.0, 0.8);    // Magenta accent
  
  // Base color from noise
  vec3 col = mix(color1, color2, smoothstep(-0.5, 0.5, noise) * vignette);
  
  // Add tendrils
  col += color2 * tendrils * vignette * 0.5;
  
  // Mouse glow
  col += color2 * mouseEffect * 0.3;
  col += color3 * mouseEffect * 0.1 * sin(uTime * 5.0);
  
  // Heartbeat glow
  col += color2 * pulse * 0.05 * vignette;
  
  // Scanline effect
  float scanline = sin(uv.y * uResolution.y * 2.0) * 0.02;
  col += scanline;
  
  // Vignette darkening
  col *= vignette * 0.8 + 0.2;
  
  // Film grain
  float grain = fract(sin(dot(uv * uResolution, vec2(12.9898, 78.233))) * 43758.5453);
  col += (grain - 0.5) * 0.03;
  
  gl_FragColor = vec4(col, 1.0);
}
