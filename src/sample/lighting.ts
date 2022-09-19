import { makeSample, SampleInit } from '../components/SampleLayout';
import { Model, CubeGeometry } from '@luma.gl/engine';
import { Texture2D, clear, loadImage } from '@luma.gl/webgl';
import { setParameters } from '@luma.gl/gltools';
import { phongLighting } from '@luma.gl/shadertools';
import { Matrix4 } from '@math.gl/core';
import logoImage from '../../assets/img/vis-logo.png';

const vs = `#version 300 es
in vec3 positions;
in vec3 normals;
in vec2 texCoords;

uniform mat4 uModel;
uniform mat4 uMVP;

out vec3 vPosition;
out vec3 vNormal;
out vec2 vUV;

void main(void) {
  vPosition = (uModel * vec4(positions, 1.0)).xyz;
  vNormal = mat3(uModel) * normals;
  vUV = texCoords;
  gl_Position = uMVP * vec4(positions, 1.0);
}
`;

const fs = `#version 300 es
precision highp float;

uniform sampler2D uTexture;
uniform vec3 uEyePosition;

in vec3 vPosition;
in vec3 vNormal;
in vec2 vUV;
out vec4 outColor;
void main(void) {
  vec3 materialColor = texture2D(uTexture, vec2(vUV.x, 1.0 - vUV.y)).rgb;
  vec3 surfaceColor = lighting_getLightColor(materialColor, uEyePosition, vPosition, normalize(vNormal));

  gl_FragColor = vec4(surfaceColor, 1.0);
}
`;

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
  const modelMatrix = new Matrix4();
  const viewMatrix = new Matrix4().lookAt({ eye: eyePosition });
  const mvpMatrix = new Matrix4();

  const model = new Model(gl, {
    vs,
    fs,
    geometry: new CubeGeometry(),
    uniforms: {
      uTexture: texture,
      uEyePosition: eyePosition,
    },
    modules: [phongLighting],
    moduleSettings: {
      material: {
        specularColor: [255, 255, 255],
      },
      lights: [
        {
          type: 'ambient',
          color: [255, 255, 255],
        },
        {
          type: 'point',
          color: [255, 255, 255],
          position: [1, 2, 1],
        },
      ],
    },
  });
  const aspect = (gl.canvas.width * 1.0) / gl.canvas.height;
  function frame(time) {
    const tick = (time / 1000) * 60;
    modelMatrix
      .identity()
      .rotateX(tick * 0.01)
      .rotateY(tick * 0.013);

    mvpMatrix
      .perspective({ fovy: Math.PI / 3, aspect })
      .multiplyRight(viewMatrix)
      .multiplyRight(modelMatrix);

    clear(gl, { color: [0, 0, 0, 1], depth: true });

    model.setUniforms({ uMVP: mvpMatrix, uModel: modelMatrix }).draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
};

const Lighting: () => JSX.Element = () =>
  makeSample({
    name: 'Lighting',
    description: '光照是webgl中很重要的一节，需要关注法向量，光照计算方式.',
    init,
    sources: [
      {
        name: __filename.substring(__dirname.length + 1),
        contents: __SOURCE__,
      },
    ],
    filename: __filename,
  });

export default Lighting;
