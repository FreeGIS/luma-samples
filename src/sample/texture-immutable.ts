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
  color = texture(diffuse, v_st);
}`;

const init: SampleInit = async ({ canvasRef }) => {
  const canvas = canvasRef.current;
  if (canvas === null) return;
  const gl = canvas.getContext('webgl2');
  clear(gl, { color: [0, 0, 0, 1], depth: true });

  const Corners = {
    LEFT: 0,
    RIGHT: 1,
    MAX: 2,
  };
  const viewports = new Array(Corners.MAX);
  viewports[Corners.LEFT] = {
    x: 0,
    y: canvas.height / 4,
    z: canvas.width / 2,
    w: canvas.height / 2,
  };

  viewports[Corners.RIGHT] = {
    x: canvas.width / 2,
    y: canvas.height / 4,
    z: canvas.width / 2,
    w: canvas.height / 2,
  };

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

  // 固定纹理相关参数，类似gl.texStorage2D
  const texture = new Texture2D(gl, {
    width: 512,
    height: 512,
    format: gl.RGB8, //webgl中格式
    dataFormat: gl.RGB, //输入数据源格式
    type: gl.UNSIGNED_BYTE,
    mipmaps: false,
    parameters: {
      [gl.TEXTURE_MAG_FILTER]: gl.NEAREST,
      [gl.TEXTURE_MIN_FILTER]: gl.NEAREST,
      [gl.TEXTURE_WRAP_S]: gl.CLAMP_TO_EDGE,
      [gl.TEXTURE_WRAP_T]: gl.CLAMP_TO_EDGE,
    },
  });
  //Write a sub image into the texture
  // webgl2中通过以下语句创建固定宽高的纹理，并更改子区域纹理数据
  // luma中不存在创建固定宽高纹理，texture都是可resize的，所以直接重写子区域数据即可
  //gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGB8, 512, 512);
  //gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGB, gl.UNSIGNED_BYTE, image);
  texture.setSubImageData({
    data: imageData,
    x: 0,
    y: 0,
    level: 0,
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

const TextureImmutable: () => JSX.Element = () =>
  makeSample({
    name: 'Texture Immutable',
    description:
      '不可变纹理是指纹理的分配，而不是纹理的内容。因此，可以上传新的像素数据，但纹理存储的大小无法更改.',
    init,
    sources: [
      {
        name: __filename.substring(__dirname.length + 1),
        contents: __SOURCE__,
      },
    ],
    filename: __filename,
  });

export default TextureImmutable;
