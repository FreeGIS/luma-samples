import { makeSample, SampleInit } from '../components/SampleLayout';
import { Model } from '@luma.gl/engine';
import { Buffer, clear } from '@luma.gl/webgl';
const vs = `#version 300 es
  in vec2 position;
  in vec3 color;
  out vec3 vColor;
  void main() {
    vColor = color;
    gl_Position = vec4(position, 0.0, 1.0);
  }`;

const fs = `#version 300 es
  in vec3 vColor;
  out vec4 outColor;
  void main() {
    outColor = vec4(vColor, 1.0);
  }`;
const init: SampleInit = async ({ canvasRef }) => {
  if (canvasRef.current === null) return;
  const gl = canvasRef.current.getContext('webgl2');
  clear(gl, { color: [0, 0, 0, 1], depth: true });
  const positionBuffer = new Buffer(
    gl,
    new Float32Array([-0.5, -0.5, 0.5, -0.5, 0.0, 0.5])
  );
  const colorBuffer = new Buffer(
    gl,
    new Float32Array([1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0])
  );

  const model = new Model(gl, {
    vs,
    fs,
    attributes: {
      position: positionBuffer,
      color: colorBuffer,
    },
    vertexCount: 3,
  });

  function frame() {
    // clear(gl, { color: [0, 0, 0, 1] });
    model.draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return gl;
};

const HelloTriangle: () => JSX.Element = () =>
  makeSample({
    name: 'Hello Triangle',
    description: 'Shows rendering a basic triangle.',
    init,
    sources: [
      {
        name: __filename.substring(__dirname.length + 1),
        contents: __SOURCE__,
      },
    ],
    filename: __filename,
  });

export default HelloTriangle;
