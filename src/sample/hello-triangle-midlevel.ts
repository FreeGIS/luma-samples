import { makeSample, SampleInit } from '../components/SampleLayout';
import { Buffer, clear, Program, VertexArray } from '@luma.gl/webgl';
import { assembleShaders } from '@luma.gl/shadertools';
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

  const assembled = assembleShaders(gl, {
    vs,
    fs,
  });

  const program = new Program(gl, assembled);

  const vertexArray = new VertexArray(gl, {
    program,
    attributes: {
      position: positionBuffer,
      color: colorBuffer,
    },
  });
  function frame() {
    program.draw({
      vertexArray,
      vertexCount: 3,
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return gl;
};

const HelloTriangleMidLevel: () => JSX.Element = () =>
  makeSample({
    name: 'Hello Triangle Mid Level',
    description:
      '使用luma的中等封装Program替代高级封装的Model,Model对底层细节封装不完整，需要颗粒度更低的webgl api控制可以降级使用Program.',
    init,
    sources: [
      {
        name: __filename.substring(__dirname.length + 1),
        contents: __SOURCE__,
      },
    ],
    filename: __filename,
  });

export default HelloTriangleMidLevel;
