// Particle fragment shader
precision highp float;

varying float vAlpha;
varying float vRandom;
varying vec3 vColor;

void main() {
  // Circular point sprite
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);
  
  // Soft glow
  float alpha = smoothstep(0.5, 0.0, dist);
  alpha = pow(alpha, 2.0);
  
  // Inner bright core
  float core = smoothstep(0.2, 0.0, dist);
  
  vec3 col = vColor * (0.5 + core * 0.5);
  
  gl_FragColor = vec4(col, alpha * vAlpha);
}
