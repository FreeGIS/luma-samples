import { makeSample, SampleInit } from '../components/SampleLayout';
import { Model, CubeGeometry } from '@luma.gl/engine';
import { Texture2D, clear } from '@luma.gl/webgl';
import { setParameters } from '@luma.gl/gltools';
import { Matrix4 } from '@math.gl/core';
import logoImage from '../../assets/img/vis-logo.png';

const vs = `#version 300 es
in vec3 positions;
in vec2 texCoords;

uniform mat4 uMVP;

out vec2 vUV;

void main(void) {
  gl_Position = uMVP * vec4(positions, 1.0);
  vUV = texCoords;
}
`;

const fs = `#version 300 es
precision highp float;

uniform sampler2D uTexture;
uniform vec3 uEyePosition;

in vec2 vUV;
out vec4 outColor;
void main(void) {
  outColor = texture(uTexture, vec2(vUV.x, 1.0 - vUV.y));
}
`;
function loadImage(imageSource) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return new Promise((res, rej) => {
    const image = new Image();
    image.src = imageSource; // MUST BE SAME DOMAIN!!!
    image.onload = function () {
      res(image);
    };
  });
}

const init: SampleInit = async ({ canvasRef }) => {
  if (canvasRef.current === null) return;
  const gl = canvasRef.current.getContext('webgl2');

  setParameters(gl, {
    depthTest: true,
    depthFunc: gl.LEQUAL,
  });
  const imageData = await loadImage(logoImage);
  const texture = new Texture2D(gl, {
    data: imageData,
  });
  const eyePosition = [0, 0, 5];
  const viewMatrix = new Matrix4().lookAt({ eye: eyePosition });
  const mvpMatrix = new Matrix4();

  const model = new Model(gl, {
    vs,
    fs,
    geometry: new CubeGeometry(),
    uniforms: {
      uTexture: texture,
    },
  });
  const aspect = (gl.canvas.width * 1.0) / gl.canvas.height;
  function frame(time) {
    const tick = (time / 1000) * 60;
    mvpMatrix
      .perspective({ fovy: Math.PI / 3, aspect })
      .multiplyRight(viewMatrix)
      .rotateX(tick * 0.01)
      .rotateY(tick * 0.013);

    clear(gl, { color: [0, 0, 0, 1] });

    model.setUniforms({ uMVP: mvpMatrix }).draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
};

const LumaCube: () => JSX.Element = () =>
  makeSample({
    name: 'Cube Geometry',
    description: '方块图形.',
    init,
    sources: [
      {
        name: __filename.substring(__dirname.length + 1),
        contents: __SOURCE__,
      },
    ],
    filename: __filename,
  });

export default LumaCube;
