import { makeSample, SampleInit } from '../components/SampleLayout';
import { Model, Transform } from '@luma.gl/engine';
import { Buffer, clear } from '@luma.gl/webgl';
const transformVs = `#version 300 es
#define SIN2 0.03489949
#define COS2 0.99939082
in vec2 position;
out vec2 vPosition;
void main() {
    mat2 rotation = mat2(
        COS2, SIN2,
        -SIN2, COS2
    );
    vPosition = rotation * position;
}
`;

const renderVs = `#version 300 es
in vec2 position;
in vec3 color;
out vec3 vColor;
void main() {
    vColor = color;
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

const renderFs = `#version 300 es
precision highp float;
in vec3 vColor;
out vec4 fragColor;
void main() {
    fragColor = vec4(vColor, 1.0);
}
`;
const init: SampleInit = async ({ canvasRef }) => {
  if (canvasRef.current === null) return;
  const gl = canvasRef.current.getContext('webgl2');

  const positionBuffer = new Buffer(
    gl,
    new Float32Array([-0.5, -0.5, 0.5, -0.5, 0.0, 0.5])
  );

  const transform = new Transform(gl, {
    // 顶点转换着色器
    vs: transformVs,
    // 定义输入
    sourceBuffers: {
      position: positionBuffer,
    },
    // 定义输出
    feedbackMap: {
      position: 'vPosition',
    },
    elementCount: 3,
  });

  const colorBuffer = new Buffer(
    gl,
    new Float32Array([1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0])
  );

  const model = new Model(gl, {
    vs: renderVs,
    fs: renderFs,
    attributes: {
      position: transform.getBuffer('vPosition'),
      color: colorBuffer,
    },
    vertexCount: 3,
  });

  function frame() {
    transform.run();
    clear(gl, { color: [0, 0, 0, 1] });
    model.setAttributes({ position: transform.getBuffer('vPosition') }).draw();
    transform.swap();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
};

const TransformFeedback: () => JSX.Element = () =>
  makeSample({
    name: 'Transform Feedback',
    description:
      'Transform Feedback是webgl2新增的特色，通常用于粒子位置交换动画等场景.',
    init,
    sources: [
      {
        name: __filename.substring(__dirname.length + 1),
        contents: __SOURCE__,
      },
    ],
    filename: __filename,
  });

export default TransformFeedback;