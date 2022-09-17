import { makeSample, SampleInit } from '../components/SampleLayout';
import { Model } from '@luma.gl/engine';
import { Buffer, clear } from '@luma.gl/webgl';

const vs1 = `#version 300 es
  in vec2 position;
  void main() {
    gl_Position = vec4(position - vec2(0.5, 0.0), 0.0, 1.0);
  }
`;

const fs1 = `#version 300 es
  uniform vec3 hsvColor;
  out vec4 outColor;
  void main() {
    outColor = vec4(color_hsv2rgb(hsvColor), 1.0);
  }
`;

const vs2 = `#version 300 es
  in vec2 position;
  void main() {
    gl_Position = vec4(position + vec2(0.5, 0.0), 0.0, 1.0);
  }
`;

const fs2 = `#version 300 es
  uniform vec3 hsvColor;
  out vec4 outColor;
  void main() {
    outColor = vec4(color_hsv2rgb(hsvColor) - 0.3, 1.0);
  }
`;
// 该模块将一个颜色转换函数注入FS（片元着色器）
//  to convert from HSV to RGB colorspace
// From http://lolengine.net/blog/2013/07/27/rgb-to-hsv-in-glsl
const colorModule = {
  name: 'color',
  fs: `
    vec3 color_hsv2rgb(vec3 hsv) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(hsv.xxx + K.xyz) * 6.0 - K.www);
      vec3 rgb = hsv.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), hsv.y);
      return rgb;
    }
  `,
};

const init: SampleInit = async ({ canvasRef }) => {
  if (canvasRef.current === null) return;
  const gl = canvasRef.current.getContext('webgl2');

  const positionBuffer = new Buffer(
    gl,
    new Float32Array([-0.3, -0.5, 0.3, -0.5, 0.0, 0.5])
  );

  const model1 = new Model(gl, {
    vs: vs1,
    fs: fs1,
    modules: [colorModule],
    attributes: {
      position: positionBuffer,
    },
    uniforms: {
      hsvColor: [0.7, 1.0, 1.0],
    },
    vertexCount: 3,
  });

  const model2 = new Model(gl, {
    vs: vs2,
    fs: fs2,
    modules: [colorModule],
    attributes: {
      position: positionBuffer,
    },
    uniforms: {
      hsvColor: [1.0, 1.0, 1.0],
    },
    vertexCount: 3,
  });

  function frame() {
    clear(gl, { color: [0, 0, 0, 1] });
    model1.draw();
    model2.draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
};

const ShaderModules: () => JSX.Element = () =>
  makeSample({
    name: 'Shader Modules',
    description: '着色器模块化是luma.gl非常有竞争力的一个核心模块.',
    init,
    sources: [
      {
        name: __filename.substring(__dirname.length + 1),
        contents: __SOURCE__,
      },
    ],
    filename: __filename,
  });

export default ShaderModules;
