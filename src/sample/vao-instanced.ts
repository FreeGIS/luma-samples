import { makeSample, SampleInit } from '../components/SampleLayout';
import { Model } from '@luma.gl/engine';
import { Buffer, clear, VertexArray } from '@luma.gl/webgl';
const vs = `#version 300 es
    in vec2 position;
    in vec3 color;
    in vec2 offset;
    out vec3 vColor;
    void main() {
        vColor = color;
        gl_Position = vec4(position + offset, 0.0, 1.0);
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

  const positionBuffer = new Buffer(
    gl,
    new Float32Array([-0.2, -0.2, 0.2, -0.2, 0.0, 0.2])
  );

  const colorBuffer = new Buffer(
    gl,
    new Float32Array([
      1.0,
      0.0,
      0.0,
      0.0,
      1.0,
      0.0,
      0.0,
      0.0,
      1.0,
      1.0,
      1.0,
      0.0,
    ])
  );

  const offsetBuffer = new Buffer(
    gl,
    new Float32Array([0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, -0.5])
  );

  const model = new Model(gl, {
    vs: vs,
    fs: fs,
    vertexCount: 3,
    instanceCount: 4,
    isInstanced: true,
  });
  const vertexArray = new VertexArray(gl, {
    attributes: {
      position: positionBuffer,
      color: [colorBuffer, { divisor: 1 }],
      offset: [offsetBuffer, { divisor: 1 }],
    },
    program: model.getProgram(),
  });
  function frame() {
    clear(gl, { color: [0, 0, 0, 1] });
    model.draw({
      vertexArray: vertexArray,
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
};

const DrawInstancedByVao: () => JSX.Element = () =>
  makeSample({
    name: 'Draw instanced by Vao',
    description:
      '实例绘制成为webgl2的标准一部分，通过Vao形式绘制，常用于快速绘制许多树，灌木丛或者草.',
    init,
    sources: [
      {
        name: __filename.substring(__dirname.length + 1),
        contents: __SOURCE__,
      },
    ],
    filename: __filename,
  });

export default DrawInstancedByVao;
