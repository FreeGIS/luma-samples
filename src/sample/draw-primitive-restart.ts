import { makeSample, SampleInit } from '../components/SampleLayout';
import { Model } from '@luma.gl/engine';
import { Buffer, clear, VertexArray } from '@luma.gl/webgl';
const vs = `#version 300 es
  in vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }`;

const fs = `#version 300 es
  precision highp float;
  precision highp int;
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
    new Float32Array([-1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0])
  );
  const MAX_UNSIGNED_SHORT = 65535;
  const num_vertices = 7;
  const indices = new Uint16Array([0, 1, 2, MAX_UNSIGNED_SHORT, 2, 3, 1]);
  const indicesBuffer = new Buffer(gl, {
    target: gl.ELEMENT_ARRAY_BUFFER,
    data: indices,
  });
  const model = new Model(gl, {
    vs,
    fs,
    drawMode: gl.TRIANGLE_STRIP,
    vertexCount: num_vertices,
  });
  const vertexArray = new VertexArray(gl, {
    attributes: {
      [0]: positionBuffer,
    },
    elements: indicesBuffer,
    program: model.getProgram(),
  });
  function frame() {
    model.draw({
      vertexArray: vertexArray,
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return gl;
};
// 参考资料：https://www.cnblogs.com/psklf/p/5750783.html
const PrimitiveRestart: () => JSX.Element = () =>
  makeSample({
    name: 'Draw primitive restart',
    description:
      'Webgl2提供的图元重启，是绘制不连续图形优化方案之一,参考资料：https://www.cnblogs.com/psklf/p/5750783.html.',
    init,
    sources: [
      {
        name: __filename.substring(__dirname.length + 1),
        contents: __SOURCE__,
      },
    ],
    filename: __filename,
  });

export default PrimitiveRestart;
