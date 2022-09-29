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

const fs_normalized = `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D diffuse;
in vec2 v_st;
out vec4 color;
void main()
{
    color = texture(diffuse, v_st);
}`;

const fs_uint = `#version 300 es
precision highp float;
precision highp int;
precision highp usampler2D;
uniform usampler2D diffuse;
in vec2 v_st;
out vec4 color;
void main()
{
    ivec2 size = textureSize(diffuse, 0);
    vec2 texcoord = v_st * vec2(size);
    ivec2 coord = ivec2(texcoord);
    uvec4 texel = uvec4(texelFetch(diffuse, coord, 0));
    color = vec4(texel) / 255.0;
}`;
const init: SampleInit = async ({ canvasRef }) => {
  const canvas = canvasRef.current;
  if (canvas === null) return;
  // 强制修改下canvas使其与父容器同宽，否则展示挤在一起了
  canvas.width = canvas.parentElement.clientWidth;
  const gl = canvas.getContext('webgl2');
  clear(gl, { color: [0, 0, 0, 1], depth: true });
  // -- Viewport
  const windowSize = {
    x: canvas.width,
    y: canvas.height,
  };

  const Views = {
    BOTTOM_LEFT: 0,
    BOTTOM_CENTER: 1,
    BOTTOM_RIGHT: 2,
    MIDDLE_LEFT: 3,
    MIDDLE_CENTER: 4,
    MIDDLE_RIGHT: 5,
    TOP_LEFT: 6,
    TOP_CENTER: 7,
    TOP_RIGHT: 8,
    MAX: 9,
  };
  const viewport = new Array(Views.MAX);
  for (let i = 0; i < Views.MAX; ++i) {
    const row = Math.floor(i / 3);
    const col = i % 3;
    viewport[i] = {
      x: (windowSize.x * col) / 3.0,
      y: (windowSize.y * row) / 3.0,
      z: windowSize.x / 3.0,
      w: windowSize.y / 3.0,
    };
  }

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
  const TextureTypes = {
    RGB: 0,
    RGB8: 1,
    RGBA: 2,
    RGB16F: 3,
    RGBA32F: 4,
    R16F: 5,
    RG16F: 6,
    RGB8UI: 7,
    RGBA8UI: 8,
    MAX: 9,
  };
  const textureFormats = new Array(TextureTypes.MAX);
  textureFormats[TextureTypes.RGB] = {
    internalFormat: gl.RGBA,
    format: gl.RGBA,
    type: gl.UNSIGNED_BYTE,
  };
  textureFormats[TextureTypes.RGB8] = {
    internalFormat: gl.RGB8,
    format: gl.RGB,
    type: gl.UNSIGNED_BYTE,
  };
  textureFormats[TextureTypes.RGBA] = {
    internalFormat: gl.RGBA,
    format: gl.RGBA,
    type: gl.UNSIGNED_BYTE,
  };
  textureFormats[TextureTypes.RGB16F] = {
    internalFormat: gl.RGB16F,
    format: gl.RGB,
    type: gl.HALF_FLOAT,
  };
  textureFormats[TextureTypes.RGBA32F] = {
    internalFormat: gl.RGBA32F,
    format: gl.RGBA,
    type: gl.FLOAT,
  };
  textureFormats[TextureTypes.R16F] = {
    internalFormat: gl.R16F,
    format: gl.RED,
    type: gl.HALF_FLOAT,
  };

  textureFormats[TextureTypes.RG16F] = {
    internalFormat: gl.RG16F,
    format: gl.RG,
    type: gl.HALF_FLOAT,
  };

  textureFormats[TextureTypes.RGB8UI] = {
    internalFormat: gl.RGB8UI,
    format: gl.RGB_INTEGER,
    type: gl.UNSIGNED_BYTE,
  };
  textureFormats[TextureTypes.RGBA8UI] = {
    internalFormat: gl.RGBA8UI,
    format: gl.RGBA_INTEGER,
    type: gl.UNSIGNED_BYTE,
  };

  const textures = new Array(TextureTypes.MAX);
  for (let i = 0; i < TextureTypes.MAX; i++) {
    textures[i] = new Texture2D(gl, {
      data: imageData,
      format: textureFormats[i].internalFormat, //webgl中格式
      dataFormat: textureFormats[i].format, //输入数据源格式
      type: textureFormats[i].type,
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
  }
  const model = new Model(gl, {
    vs,
    fs: fs_uint,
    attributes: {
      position: positionBuffer,
      texcoord: texBuffer,
    },
    vertexCount: 6,
  });

  const normalized_model = new Model(gl, {
    vs,
    fs: fs_normalized,
    attributes: {
      position: positionBuffer,
      texcoord: texBuffer,
    },
    vertexCount: 6,
  });

  function frame() {
    for (let i = 0; i < TextureTypes.RGB8UI; ++i) {
      gl.viewport(viewport[i].x, viewport[i].y, viewport[i].z, viewport[i].w);
      normalized_model.draw({
        uniforms: {
          diffuse: textures[i],
        },
      });
    }
    for (let i = TextureTypes.RGB8UI; i < TextureTypes.MAX; ++i) {
      gl.viewport(viewport[i].x, viewport[i].y, viewport[i].z, viewport[i].w);
      model.draw({
        uniforms: {
          diffuse: textures[i],
        },
      });
    }
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
