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
uniform sampler2D diffuse;
in vec2 v_st;
out vec4 color;
void main()
{
    // 获取纹理的宽高， -1 便于计算纹理的像素坐标，例如width=3,则坐标范围是[0,2]
    vec2 size = vec2(textureSize(diffuse, 0) - 1);
    // 纹理坐标乘以宽高=像素坐标
    vec2 texcoord = v_st * size;
    // 像素坐标转整型
    ivec2 coord = ivec2(texcoord);
    // 获取该位置相邻4个像素的颜色值
    vec4 texel00 = texelFetch(diffuse, coord + ivec2(0, 0), 0);
    vec4 texel10 = texelFetch(diffuse, coord + ivec2(1, 0), 0);
    vec4 texel11 = texelFetch(diffuse, coord + ivec2(1, 1), 0);
    vec4 texel01 = texelFetch(diffuse, coord + ivec2(0, 1), 0);
    // 获取小数部分
    vec2 sampleCoord = fract(texcoord.xy);
    // 双线线插值
    vec4 texel0 = mix(texel00, texel01, sampleCoord.y);
    vec4 texel1 = mix(texel10, texel11, sampleCoord.y);
    color = mix(texel0, texel1, sampleCoord.x);
}`;
const init: SampleInit = async ({ canvasRef }) => {
  if (canvasRef.current === null) return;
  const gl = canvasRef.current.getContext('webgl2');
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
    format: gl.RGBA, //webgl中格式
    dataFormat: gl.RGBA, //输入数据源格式
    type: gl.UNSIGNED_BYTE,
    parameters: {
      [gl.TEXTURE_MAG_FILTER]: gl.NEAREST,
      [gl.TEXTURE_MIN_FILTER]: gl.NEAREST,
    },
  });
  const model = new Model(gl, {
    vs,
    fs,
    attributes: {
      position: positionBuffer,
      texcoord: texBuffer,
    },
    uniforms: {
      diffuse: texture,
    },
    vertexCount: 6,
  });

  function frame() {
    model.draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return gl;
};

const TextureFetch: () => JSX.Element = () =>
  makeSample({
    name: 'Texture Fetch',
    description:
      'texelFetch是webgl2新增的可通过像素坐标精确获取纹理像素值的api，本示例展示了glsl300中textureSize、texelFetch的API使用，并用双线性插值处理了图像.',
    init,
    sources: [
      {
        name: __filename.substring(__dirname.length + 1),
        contents: __SOURCE__,
      },
    ],
    filename: __filename,
  });

export default TextureFetch;
