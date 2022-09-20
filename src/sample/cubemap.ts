import { makeSample, SampleInit } from '../components/SampleLayout';
import { Model, CubeGeometry } from '@luma.gl/engine';
import { Texture2D, TextureCube, loadImage, clear } from '@luma.gl/webgl';
import { setParameters } from '@luma.gl/gltools';
import { Matrix4, radians } from '@math.gl/core';
import logoImage from '../../assets/img/vis-logo.png';
import negx from '../../assets/img/cubemap1/sky-negx.png';
import negy from '../../assets/img/cubemap1/sky-negy.png';
import negz from '../../assets/img/cubemap1/sky-negz.png';
import posx from '../../assets//img/cubemap1/sky-posx.png';
import posy from '../../assets/img/cubemap1/sky-posy.png';
import posz from '../../assets/img/cubemap1/sky-posz.png';

class RoomCube extends Model {
  constructor(gl, props) {
    const vs = `#version 300 es
in vec3 positions;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
out vec3 vPosition;
void main(void) {
  gl_Position = uProjection * uView * uModel * vec4(positions, 1.0);
  vPosition = positions;
}
`;
    const fs = `#version 300 es
precision highp float;
uniform samplerCube uTextureCube;
in vec3 vPosition;
out vec4 outColor;
void main(void) {
  // The outer cube just samples the texture cube directly
  outColor = textureCube(uTextureCube, normalize(vPosition));
}
`;

    super(
      gl,
      Object.assign({ geometry: new CubeGeometry() }, props, { fs, vs })
    );
  }
}

class Prism extends Model {
  constructor(gl, props) {
    const vs = `#version 300 es
in vec3 positions;
in vec3 normals;
in vec2 texCoords;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
out vec3 vPosition;
out vec3 vNormal;
out vec2 vUV;
void main(void) {
  gl_Position = uProjection * uView * uModel * vec4(positions, 1.0);
  vPosition = vec3(uModel * vec4(positions,1));
  vNormal = vec3(uModel * vec4(normals, 0));
  vUV = texCoords;
}
`;
    const fs = `#version 300 es
precision highp float;
uniform sampler2D uTexture;
uniform samplerCube uTextureCube;
uniform vec3 uEyePosition;
in vec3 vPosition;
in vec3 vNormal;
in vec2 vUV;
out vec4 outColor;
void main(void) {
  vec4 color = texture(uTexture, vec2(vUV.x, 1.0 - vUV.y));
  vec3 reflectedDir = reflect(normalize(vPosition - uEyePosition), vNormal);
  vec4 reflectedColor = textureCube(uTextureCube, reflectedDir);
  outColor = color * reflectedColor;
}
`;
    super(
      gl,
      Object.assign({ geometry: new CubeGeometry() }, props, { vs, fs })
    );
  }
}

const init: SampleInit = async ({ canvasRef }) => {
  if (canvasRef.current === null) return;
  const gl = canvasRef.current.getContext('webgl2');
  clear(gl, { color: [0, 0, 0, 1], depth: true });
  setParameters(gl, {
    clearColor: [0, 0, 0, 1],
    clearDepth: 1,
    depthTest: true,
    depthFunc: gl.LEQUAL,
  });

  const cubemap = new TextureCube(gl, {
    data: {
      [gl.TEXTURE_CUBE_MAP_POSITIVE_X]: loadImage(posx),
      [gl.TEXTURE_CUBE_MAP_NEGATIVE_X]: loadImage(negx),
      [gl.TEXTURE_CUBE_MAP_POSITIVE_Y]: loadImage(posy),
      [gl.TEXTURE_CUBE_MAP_NEGATIVE_Y]: loadImage(negy),
      [gl.TEXTURE_CUBE_MAP_POSITIVE_Z]: loadImage(posz),
      [gl.TEXTURE_CUBE_MAP_NEGATIVE_Z]: loadImage(negz),
    },
  });
  const texture = new Texture2D(gl, {
    data: loadImage(logoImage),
    mipmaps: true,
    parameters: {
      [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
      [gl.TEXTURE_MIN_FILTER]: gl.LINEAR_MIPMAP_NEAREST,
    },
  });

  const cube = new RoomCube(gl, {
    uniforms: {
      uTextureCube: cubemap,
      uModel: new Matrix4().scale([20, 20, 20]),
    },
  });
  const prism = new Prism(gl, {
    uniforms: {
      uTextureCube: cubemap,
      uTexture: texture,
    },
  });
  const aspect = (gl.canvas.width * 1.0) / gl.canvas.height;
  function frame(time) {
    const tick = (time / 1000) * 60;
    const eyePosition = [5, -3, 5];
    const view = new Matrix4().lookAt({ eye: eyePosition });
    const projection = new Matrix4().perspective({ fovy: radians(75), aspect });

    //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    cube.draw({
      uniforms: {
        uView: view,
        uProjection: projection,
      },
    });

    prism.draw({
      uniforms: {
        uEyePosition: eyePosition,
        uView: view,
        uProjection: projection,
        uModel: new Matrix4().rotateX(tick * 0.01).rotateY(tick * 0.013),
      },
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return gl;
};

const CubeMap: () => JSX.Element = () =>
  makeSample({
    name: 'CubeMap',
    description: '天空盒示例.',
    init,
    sources: [
      {
        name: __filename.substring(__dirname.length + 1),
        contents: __SOURCE__,
      },
    ],
    filename: __filename,
  });

export default CubeMap;
