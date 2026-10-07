// Particle vertex shader
precision highp float;

attribute vec3 aPosition;
attribute vec3 aTarget;
attribute float aSize;
attribute float aRandom;
attribute float aPhase;

uniform mat4 uProjection;
uniform mat4 uView;
uniform float uTime;
uniform float uProgress; // 0 = scattered, 1 = formed
uniform vec2 uMouse;
uniform float uPixelRatio;

varying float vAlpha;
varying float vRandom;
varying vec3 vColor;

void main() {
  // Interpolate between scattered and target position
  vec3 pos = mix(aPosition, aTarget, uProgress);
  
  // Add floating motion
  pos.x += sin(uTime * 0.5 + aPhase) * 0.1 * (1.0 - uProgress);
  pos.y += cos(uTime * 0.3 + aPhase) * 0.1 * (1.0 - uProgress);
  pos.z += sin(uTime * 0.4 + aPhase) * 0.1 * (1.0 - uProgress);
  
  // Mouse repulsion
  vec4 mvPosition = uView * vec4(pos, 1.0);
  vec4 mousePos = uView * vec4(uMouse, 0.0, 1.0);
  float dist = length(mvPosition.xy - mousePos.xy);
  float repulse = smoothstep(0.5, 0.0, dist) * 0.5;
  mvPosition.xy += normalize(mvPosition.xy - mousePos.xy) * repulse;
  
  vec4 finalPos = uProjection * mvPosition;
  gl_Position = finalPos;
  
  // Size attenuation
  float size = aSize * (1.0 + sin(uTime + aPhase) * 0.3);
  gl_PointSize = size * uPixelRatio * (300.0 / -mvPosition.z);
  
  // Alpha based on progress and distance
  vAlpha = mix(0.3, 1.0, uProgress) * (1.0 - smoothstep(5.0, 15.0, -mvPosition.z));
  vRandom = aRandom;
  
  // Color based on random
  vColor = mix(
    vec3(0.0, 0.7, 0.6),
    vec3(1.0, 0.0, 1.0),
    aRandom
  );
}
