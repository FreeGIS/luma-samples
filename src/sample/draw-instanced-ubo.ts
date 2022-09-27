import { makeSample, SampleInit } from '../components/SampleLayout';
import { Buffer, clear, Program, VertexArray } from '@luma.gl/webgl';
import { assembleShaders } from '@luma.gl/shadertools';
const vs = `#version 300 es
precision highp float;
precision highp int;

layout(std140, column_major) uniform;

uniform Transform
{
    mat4 MVP[2];
} transform;

layout(location = 0) in vec2 pos;
flat out int instance;

void main()
{
    instance = gl_InstanceID;
    gl_Position = transform.MVP[gl_InstanceID] * vec4(pos, 0.0, 1.0);
}`;

const fs = `#version 300 es
precision highp float;
precision highp int;
layout(std140) uniform;

uniform Material
{
    vec4 Diffuse[2];
} material;

flat in int instance;
out vec4 color;

void main()
{
    color = material.Diffuse[instance % 2];
}`;
const init: SampleInit = async ({ canvasRef }) => {
  if (canvasRef.current === null) return;
  const canvas = canvasRef.current;
  canvas.width = canvas.parentElement.clientWidth;
  const gl = canvasRef.current.getContext('webgl2');
  clear(gl, { color: [0, 0, 0, 1], depth: true });
  const positionBuffer = new Buffer(
    gl,
    new Float32Array([-0.3, -0.5, 0.3, -0.5, 0.0, 0.5])
  );
  const uniformTransformBuffer = new Buffer(gl, {
    target: gl.UNIFORM_BUFFER,
    data: new Float32Array([
      1.0,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0,
      0.0,
      -0.5,
      0.0,
      0.0,
      1.0,

      1.0,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0,
      0.0,
      0.5,
      0.0,
      0.0,
      1.0,
    ]),
  });
  const uniformMaterialBuffer = new Buffer(gl, {
    target: gl.UNIFORM_BUFFER,
    data: new Float32Array([1.0, 0.5, 0.0, 1.0, 0.0, 0.5, 1.0, 1.0]),
  });

  const assembled = assembleShaders(gl, {
    vs,
    fs,
  });

  const program = new Program(gl, assembled);

  const uniformTransformLocation = program.getUniformBlockIndex('Transform');
  const uniformMaterialLocation = program.getUniformBlockIndex('Material');
  program.uniformBlockBinding(uniformTransformLocation, 0);
  program.uniformBlockBinding(uniformMaterialLocation, 1);
  const vertexArray = new VertexArray(gl, {
    program,
    attributes: {
      [0]: positionBuffer,
    },
  });

  function frame() {
    uniformTransformBuffer.bind({
      index: 0,
      size: undefined,
    });
    uniformMaterialBuffer.bind({
      index: 1,
      size: undefined,
    });
    program.draw({
      vertexArray,
      vertexCount: 3,
      instanceCount: 2,
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return gl;
};

const DrawUBO: () => JSX.Element = () =>
  makeSample({
    name: 'DrawUBO',
    description:
      'webgl2的UBO示例，ubo是webgl2的优化策略之一，但luma的api支持很有限，基本手动bind.',
    init,
    sources: [
      {
        name: __filename.substring(__dirname.length + 1),
        contents: __SOURCE__,
      },
    ],
    filename: __filename,
  });

export default DrawUBO;
