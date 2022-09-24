import { makeSample, SampleInit } from '../components/SampleLayout';
import { Model } from '@luma.gl/engine';
import { Buffer, clear } from '@luma.gl/webgl';
const vs = `#version 300 es
  in vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }`;

const fs = `#version 300 es
  out vec4 outColor;
  void main() {
    outColor = vec4(1.0, 0.5, 0.0, 1.0);
  }`;
const init: SampleInit = async ({ canvasRef }) => {
  if (canvasRef.current === null) return;
  const gl = canvasRef.current.getContext('webgl2');
  clear(gl, { color: [0, 0, 0, 1], depth: true });
  const positionBuffer = new Buffer(
    gl,
    new Float32Array([
      -0.8,
      -0.8,
      0.8,
      -0.8,
      0.8,
      0.8,
      0.8,
      0.8,
      -0.8,
      0.8,
      -0.8,
      -0.8,
      -0.5,
      -0.5,
      0.5,
      -0.5,
      0.5,
      0.5,
      0.5,
      0.5,
      -0.5,
      0.5,
      -0.5,
      -0.5,
    ])
  );
  const model = new Model(gl, {
    vs,
    fs,
    attributes: {
      position: positionBuffer,
    },
  });

  function frame() {
    // clear(gl, { color: [0, 0, 0, 1] });
    model.draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return gl;
};

const RangeArrays: () => JSX.Element = () =>
  makeSample({
    name: 'Draw range Arrays',
    description: '通过viewport变化绘制图形位置.',
    init,
    sources: [
      {
        name: __filename.substring(__dirname.length + 1),
        contents: __SOURCE__,
      },
    ],
    filename: __filename,
  });

export default RangeArrays;
