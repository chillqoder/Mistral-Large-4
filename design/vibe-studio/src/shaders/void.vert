// Vertex shader for the void background
precision highp float;

attribute vec2 aPosition;
attribute vec2 aUv;

varying vec2 vUv;
varying vec2 vPosition;

void main() {
  vUv = aUv;
  vPosition = aPosition;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
