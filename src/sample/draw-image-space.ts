import { makeSample, SampleInit } from '../components/SampleLayout';
import { Model } from '@luma.gl/engine';
import { clear, loadImage, Texture2D } from '@luma.gl/webgl';
import diImage from '../../assets/img/Di-3d.png';
const vs = `#version 300 es
  precision highp float;
  precision highp int;

  void main()
  {
      // gl_VertexID=[0,1,2]===>顶点 [-1 -1,1 -1,-1 1]
      gl_Position = vec4(2.f * float(uint(gl_VertexID) % 2u) - 1.f, 2.f * float(uint(gl_VertexID) / 2u) - 1.f, 0.0, 1.0);
  }`;

const fs = `#version 300 es
  precision highp float;
  precision highp int;
  uniform sampler2D diffuse;
  uniform vec2 u_imageSize;
  out vec4 color;
  void main()
  {
    /*
    1、gl_FragCoord是fragment shader的输入变量，只读。
    2、gl_FragCoord是个vec4，四个分量分别对应x, y, z和1/w。其中，x和y是当前片元的窗口相对坐标，
    不过它们不是整数，小数部分恒为0.5。x - 0.5和y - 0.5分别位于[0, windowWidth - 1]和[0, windowHeight - 1]内。
    windowWidth和windowHeight都以像素为单位，亦即用glViewPort指定的宽高。w即为乘过了投影矩阵之后点坐标的w，
    用于perspective divide的那个值。gl_FragCoord.z / gl_FragCoord.w可以得到当前片元和camera之间的距离。
    */
    color = texture(diffuse, vec2(gl_FragCoord.x, u_imageSize.y - gl_FragCoord.y) / u_imageSize);
  }`;
const init: SampleInit = async ({ canvasRef }) => {
  if (canvasRef.current === null) return;
  const canvas = canvasRef.current;
  const gl = canvas.getContext('webgl2');
  clear(gl, { color: [0, 0, 0, 1], depth: true });
  const imageData = await loadImage(diImage);
  const texture = new Texture2D(gl, {
    data: imageData,
    format: gl.RGBA, //webgl中格式
    dataFormat: gl.RGBA, //输入数据源格式
    type: gl.UNSIGNED_BYTE,
    parameters: {
      [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
      [gl.TEXTURE_MIN_FILTER]: gl.LINEAR,
      [gl.TEXTURE_WRAP_S]: gl.CLAMP_TO_EDGE,
      [gl.TEXTURE_WRAP_T]: gl.CLAMP_TO_EDGE,
    },
  });
  const model = new Model(gl, {
    vs,
    fs,
    uniforms: {
      diffuse: texture,
      u_imageSize: [canvas.width, canvas.height],
    },
    vertexCount: 3,
  });

  function frame() {
    model.draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return gl;
};

const DrawImageSpace: () => JSX.Element = () =>
  makeSample({
    name: 'DrawImageSpace',
    description: '该例子说明了内置变量gl_VertexID和gl_FragCoord的作用.',
    init,
    sources: [
      {
        name: __filename.substring(__dirname.length + 1),
        contents: __SOURCE__,
      },
    ],
    filename: __filename,
  });

export default DrawImageSpace;
