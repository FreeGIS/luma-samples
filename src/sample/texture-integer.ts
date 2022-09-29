import { makeSample, SampleInit } from '../components/SampleLayout';
import { Model } from '@luma.gl/engine';
import { Buffer, clear, loadImage, Texture2D } from '@luma.gl/webgl';
import diImage from '../../assets/img/Di-3d.png';
const vs = `#version 300 es
precision highp float;
precision highp int;
in vec2 position;
in vec2 texcoord;
out vec2 v_st;
void main()
{
    v_st = texcoord;
    gl_Position = vec4(position, 0.0, 1.0);
}`;

const fs = `#version 300 es
precision highp float;
precision highp int;
precision highp usampler2D;
uniform usampler2D diffuse;
in vec2 v_st;
out vec4 color;
void main()
{
  // 使用usampler2D的纹理，采样后是0-255(u8)的颜色整型数值
  uvec4 intColor = texture(diffuse, v_st) / 32u * 32u;
  color = vec4(intColor) / 255.0;
}`;
const init: SampleInit = async ({ canvasRef }) => {
  const canvas = canvasRef.current;
  if (canvas === null) return;
  const gl = canvas.getContext('webgl2');
  clear(gl, { color: [0, 0, 0, 1], depth: true });
  const positionBuffer = new Buffer(
    gl,
    new Float32Array([
      -1.0,
      -1.0,
      1.0,
      -1.0,
      1.0,
      1.0,
      1.0,
      1.0,
      -1.0,
      1.0,
      -1.0,
      -1.0,
    ])
  );
  const texBuffer = new Buffer(
    gl,
    new Float32Array([
      0.0,
      1.0,
      1.0,
      1.0,
      1.0,
      0.0,
      1.0,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0,
    ])
  );

  const imageData = await loadImage(diImage);

  const texture = new Texture2D(gl, {
    data: imageData,
    format: gl.RGBA8UI, //webgl中格式
    dataFormat: gl.RGBA_INTEGER, //输入数据源格式
    type: gl.UNSIGNED_BYTE,
    mipmaps: false,
    pixelStore: {
      [gl.UNPACK_FLIP_Y_WEBGL]: false,
    },
    parameters: {
      [gl.TEXTURE_MAG_FILTER]: gl.NEAREST,
      [gl.TEXTURE_MIN_FILTER]: gl.NEAREST,
      [gl.TEXTURE_BASE_LEVEL]: 0,
      [gl.TEXTURE_MAX_LEVEL]: 0,
    },
  });

  const model = new Model(gl, {
    vs,
    fs,
    attributes: {
      position: positionBuffer,
      texcoord: texBuffer,
    },
    vertexCount: 6,
  });

  function frame() {
    model.draw({
      uniforms: {
        diffuse: texture,
      },
    });

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return gl;
};

const TextureFormat: () => JSX.Element = () =>
  makeSample({
    name: 'Texture Format',
    description: 'webgl2中常用的纹理格式使用示例.',
    init,
    sources: [
      {
        name: __filename.substring(__dirname.length + 1),
        contents: __SOURCE__,
      },
    ],
    filename: __filename,
  });

export default TextureFormat;
