import { makeSample, SampleInit } from '../components/SampleLayout';
import { Model } from '@luma.gl/engine';
import { Buffer, clear, VertexArray } from '@luma.gl/webgl';
const vs = `#version 300 es
  layout(location=0) in vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }`;

const fs = `#version 300 es
  out vec4 outColor;
  void main() {
    outColor = vec4(0.75,0.0,0.0,0.75);
  }`;
const init: SampleInit = async ({ canvasRef }) => {
  if (canvasRef.current === null) return;
  const gl = canvasRef.current.getContext('webgl2');

  const positionBuffer = new Buffer(
    gl,
    new Float32Array([-0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5])
  );

  const indices = new Uint8Array([0, 1, 3, 3, 1, 2]);
  const indicesBuffer = new Buffer(gl, {
    target: gl.ELEMENT_ARRAY_BUFFER,
    data: indices,
  });
  const model = new Model(gl, {
    vs,
    fs,
    vertexCount: indices.length,
  });
  // program是必填的，因此得先new Model，再binding Program
  const vertexArray = new VertexArray(gl, {
    attributes: {
      [0]: positionBuffer,
    },
    elements: indicesBuffer,
    program: model.getProgram(),
  });
  // 源码有问题，不改源码需手动更新下该语句
  //model.vertexArray = vertexArray;
  function frame() {
    clear(gl, { color: [0, 0, 0, 1] });
    // 改modle.js的draw源码，将this.vertexArray更改为vertexArray即可。
    model.draw({
      vertexArray: vertexArray,
    });
    // 不改源码，通过上文手动绑定，绘制不指定即可。
    //model.draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
};

const IndicesSample: () => JSX.Element = () =>
  makeSample({
    name: 'Draw Indices',
    description: '根据顶点索引绘制，是webgl绘制大量数据常用优化方案之一.',
    init,
    sources: [
      {
        name: __filename.substring(__dirname.length + 1),
        contents: __SOURCE__,
      },
    ],
    filename: __filename,
  });

export default IndicesSample;
