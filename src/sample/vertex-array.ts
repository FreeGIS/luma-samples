import { makeSample, SampleInit } from '../components/SampleLayout';
import { Model } from '@luma.gl/engine';
import { Buffer, clear, VertexArray } from '@luma.gl/webgl';
const vs = `#version 300 es
  layout(location=0) in vec2 position;
  layout(location=1) in vec3 color;
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
    vertexCount: 3,
  });
  // program是必填的，因此得先new Model，再binding Program
  const vertexArray = new VertexArray(gl, {
    attributes: {
      [0]: positionBuffer,
      [1]: colorBuffer,
    },
    program: model.getProgram(),
  });
  function frame() {
    //clear(gl, { color: [0, 0, 0, 1] });
    model.draw({
      vertexArray: vertexArray,
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return gl;
};

const VertexArraySample: () => JSX.Element = () =>
  makeSample({
    name: 'VertexArray',
    description:
      'webgl2有vao，即使用这个对象把一批次渲染数据放一起，luma要求绑定attributes和program对象.',
    init,
    sources: [
      {
        name: __filename.substring(__dirname.length + 1),
        contents: __SOURCE__,
      },
    ],
    filename: __filename,
  });

export default VertexArraySample;
