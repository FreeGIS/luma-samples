import { makeSample, SampleInit } from '../components/SampleLayout';
import { Model, ProgramManager } from '@luma.gl/engine';
import { Buffer, clear } from '@luma.gl/webgl';
const vs = `#version 300 es
  in vec2 position;

  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
    OFFSET_POSITION(gl_Position);
  }
`;

const fs = `#version 300 es
  uniform vec3 color;
  out vec4 outColor;
  void main() {
    outColor = vec4(color, 1.0);
  }
`;
const offsetLeftModule = {
  name: 'offsetLeft',
  inject: {
    'vs:OFFSET_POSITION': 'position.x -= 0.5;',
  },
};

const offsetRightModule = {
  name: 'offsetRight',
  inject: {
    'vs:OFFSET_POSITION': 'position.x += 0.5;',
  },
};

const init: SampleInit = async ({ canvasRef }) => {
  if (canvasRef.current === null) return;
  const gl = canvasRef.current.getContext('webgl2');
  clear(gl, { color: [0, 0, 0, 1], depth: true });
  const programManager = new ProgramManager(gl);
  programManager.addShaderHook('vs:OFFSET_POSITION(inout vec4 position)', {});

  const positionBuffer = new Buffer(
    gl,
    new Float32Array([-0.3, -0.5, 0.3, -0.5, 0.0, 0.5])
  );

  const model1 = new Model(gl, {
    vs,
    fs,
    programManager,
    modules: [offsetLeftModule],
    attributes: {
      position: positionBuffer,
    },
    uniforms: {
      color: [1.0, 0.0, 0.0],
    },
    vertexCount: 3,
  });

  const model2 = new Model(gl, {
    vs,
    fs,
    programManager,
    modules: [offsetRightModule],
    attributes: {
      position: positionBuffer,
    },
    uniforms: {
      color: [0.0, 0.0, 1.0],
    },
    vertexCount: 3,
  });

  function frame() {
    //clear(gl, { color: [0, 0, 0, 1] });
    model1.draw();
    model2.draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return gl;
};

const ShaderHooks: () => JSX.Element = () =>
  makeSample({
    name: 'Shader Hooks',
    description:
      '着色器模块系统的钩子函数，可以让用户控制修改注入模块的实现逻辑.',
    init,
    sources: [
      {
        name: __filename.substring(__dirname.length + 1),
        contents: __SOURCE__,
      },
    ],
    filename: __filename,
  });

export default ShaderHooks;
