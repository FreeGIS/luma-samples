import { makeSample, SampleInit } from '../components/SampleLayout';
import { Buffer, clear, Program, VertexArray } from '@luma.gl/webgl';
import { assembleShaders } from '@luma.gl/shadertools';
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
  const canvas = canvasRef.current;
  canvas.width = canvas.parentElement.clientWidth;
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
  const assembled = assembleShaders(gl, {
    vs,
    fs,
  });

  const program = new Program(gl, assembled);

  const vertexArray = new VertexArray(gl, {
    program,
    attributes: {
      position: positionBuffer,
    },
  });

  function frame() {
    gl.viewport(0, 0, canvas.width / 2, canvas.height);
    program.draw({
      vertexArray,
      vertexCount: 6,
      offset: 0,
      instanceCount: 1,
    });
    gl.viewport(canvas.width / 2, 0, canvas.width / 2, canvas.height);
    program.draw({
      vertexArray,
      vertexCount: 6,
      offset: 6,
      instanceCount: 1,
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return gl;
};

const RangeArrays: () => JSX.Element = () =>
  makeSample({
    name: 'Draw range Arrays',
    description:
      '通过viewport变化绘制图形位置，高级api model不支持，需要使用中等api program.',
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
