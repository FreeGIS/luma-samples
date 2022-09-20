import { makeSample, SampleInit } from '../components/SampleLayout';
import { Model, Transform } from '@luma.gl/engine';
import { Buffer, clear } from '@luma.gl/webgl';
import { mat4 } from 'gl-matrix';
const transformVs = `#version 300 es
    in vec2 oldPosition;
    in vec2 velocity;
    uniform float deltaTime;
    uniform vec2 canvasDimensions;
    out vec2 newPosition;
    out vec2 newVelocity;
    vec2 euclideanModulo(vec2 n, vec2 m) {
      // 偏移300、300开始绘制
      // return vec2(300.0)+mod(mod(n-vec2(300.0), m) + m, m);
      return mod(mod(n, m) + m, m);
    }

  void main() {
    newPosition = euclideanModulo(oldPosition + velocity * deltaTime,canvasDimensions);
    //newPosition = oldPosition + velocity * deltaTime;
    newVelocity = velocity;
  }
  `;
const drawParticlesVS = `#version 300 es
  in vec2 position;
  uniform mat4 matrix;

  void main() {
    // do the common matrix math
    gl_Position = matrix * vec4(position,0.0,1.0);
    gl_PointSize = 5.0;
  }
  `;

const drawParticlesFS = `#version 300 es
  precision highp float;
  out vec4 outColor;
  void main() {
    outColor = vec4(1, 0, 0, 1);
  }
  `;
const rand = (min, max) => {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  return Math.random() * (max - min) + min;
};
function createPoints(num, ranges: number[][]) {
  const points = new Float32Array(num * 2);
  for (let i = 0; i < num; i++) {
    points[i * 2] = rand(ranges[0][0], ranges[0][1]);
    points[i * 2 + 1] = rand(ranges[1][0], ranges[1][1]);
  }
  return points;
}
const init: SampleInit = async ({ canvasRef }) => {
  if (canvasRef.current === null) return;
  const gl = canvasRef.current.getContext('webgl2');
  const canvas = canvasRef.current;
  clear(gl, { color: [0, 0, 0, 1], depth: true });
  const numParticles = 200;

  // 随机初始位置
  const positions = createPoints(numParticles, [
    [0, canvas.width],
    [0, canvas.height],
  ]);
  const velocities = createPoints(numParticles, [
    [-300, 300],
    [-300, 300],
  ]);

  const positionBuffer = new Buffer(gl, positions);
  const velocityBuffer = new Buffer(gl, velocities);

  const transform = new Transform(gl, {
    // 顶点转换着色器
    vs: transformVs,
    // 定义输入
    sourceBuffers: {
      oldPosition: positionBuffer,
      velocity: velocityBuffer,
    },
    // 定义输出
    feedbackMap: {
      oldPosition: 'newPosition',
      velocity: 'newVelocity',
    },
    elementCount: numParticles,
  });
  const matrix = mat4.ortho(
    mat4.create(),
    0,
    canvas.width,
    0,
    canvas.height,
    -1,
    1
  );
  // 这里binding顶点会卡
  const model = new Model(gl, {
    vs: drawParticlesVS,
    fs: drawParticlesFS,
    uniforms: {
      matrix: matrix,
    },
    vertexCount: numParticles,
    drawMode: gl.POINTS,
  });
  let then = new Date().getTime();
  function frame() {
    const time1 = new Date().getTime();
    const deltaTime = (time1 - then) * 0.001;
    then = time1;
    transform.run({
      uniforms: {
        deltaTime: deltaTime,
        canvasDimensions: [canvas.width, canvas.height],
      },
    });
    //clear(gl, { color: [0, 0, 0, 1] });
    model
      .setAttributes({ position: transform.getBuffer('newPosition') })
      .draw();
    // 对应model提前绑定顶点
    //model.draw();
    transform.swap();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return gl;
};

const TransformPaticles: () => JSX.Element = () =>
  makeSample({
    name: 'Transform Paticles',
    description:
      'Transform Feedback是webgl2新增的特色，本例使用Luma Transform对象演示粒子动画.',
    init,
    sources: [
      {
        name: __filename.substring(__dirname.length + 1),
        contents: __SOURCE__,
      },
    ],
    filename: __filename,
  });

export default TransformPaticles;
