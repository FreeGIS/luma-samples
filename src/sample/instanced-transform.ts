import { makeSample, SampleInit } from '../components/SampleLayout';
import { Model, Transform, CubeGeometry } from '@luma.gl/engine';
import { Buffer, Texture2D, clear } from '@luma.gl/webgl';
import { setParameters } from '@luma.gl/gltools';
import { phongLighting } from '@luma.gl/shadertools';
import { Matrix4 } from '@math.gl/core';
import logoImage from '../../assets/img/vis-logo.png';

const transformVs = `#version 300 es
  in float rotations;

  out float vRotation;

  void main() {
    vRotation = rotations + 0.01;
  }
`;

const vs = `#version 300 es
  in vec3 positions;
  in vec3 normals;
  in vec2 texCoords;
  in vec2 offsets;
  in vec3 axes;
  in float rotations;

  uniform mat4 uView;
  uniform mat4 uProjection;

  out vec3 vPosition;
  out vec3 vNormal;
  out vec2 vUV;

  void main(void) {
    float s = sin(rotations);
    float c = cos(rotations);
    float t = 1.0 - c;
    float xt = axes.x * t;
    float yt = axes.y * t;
    float zt = axes.z * t;
    float xs = axes.x * s;
    float ys = axes.y * s;
    float zs = axes.z * s;

    mat3 rotationMat = mat3(
        axes.x * xt + c,
        axes.y * xt + zs,
        axes.z * xt - ys,
        axes.x * yt - zs,
        axes.y * yt + c,
        axes.z * yt + xs,
        axes.x * zt + ys,
        axes.y * zt - xs,
        axes.z * zt + c
    );

    vPosition = rotationMat * positions;
    vPosition.xy += offsets;
    vNormal = rotationMat * normals;
    vUV = texCoords;
    gl_Position = uProjection * uView * vec4(vPosition, 1.0);
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
    vec3 materialColor = texture(uTexture, vec2(vUV.x, 1.0 - vUV.y)).rgb;
    vec3 surfaceColor = lighting_getLightColor(materialColor, uEyePosition, vPosition, normalize(vNormal));

    outColor = vec4(surfaceColor, 1.0);
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
  const offsetBuffer = new Buffer(
    gl,
    new Float32Array([3, 3, -3, 3, 3, -3, -3, -3])
  );

  const axisBufferData = new Float32Array(12);
  for (let i = 0; i < 4; ++i) {
    const vi = i * 3;
    const x = Math.random();
    const y = Math.random();
    const z = Math.random();
    const l = Math.sqrt(x * x + y * y + z * z);

    axisBufferData[vi] = x / l;
    axisBufferData[vi + 1] = y / l;
    axisBufferData[vi + 2] = z / l;
  }
  const axisBuffer = new Buffer(gl, axisBufferData);

  const rotationBuffer = new Buffer(
    gl,
    new Float32Array([
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
    ])
  );

  const imageData = await loadImage(logoImage);
  const texture = new Texture2D(gl, {
    data: imageData,
  });
  const eyePosition = [0, 0, 10];
  const viewMatrix = new Matrix4().lookAt({ eye: eyePosition });
  const projectionMatrix = new Matrix4();

  const transform = new Transform(gl, {
    vs: transformVs,
    sourceBuffers: {
      rotations: rotationBuffer,
    },
    feedbackMap: {
      rotations: 'vRotation',
    },
    elementCount: 4,
  });
  const model = new Model(gl, {
    vs,
    fs,
    geometry: new CubeGeometry(),
    attributes: {
      offsets: [offsetBuffer, { divisor: 1 }],
      axes: [axisBuffer, { divisor: 1 }],
      rotations: [rotationBuffer, { divisor: 1 }],
    },
    uniforms: {
      uTexture: texture,
      uEyePosition: eyePosition,
      uView: viewMatrix,
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
          position: [4, 8, 4],
        },
      ],
    },
    instanceCount: 4,
  });
  const aspect = (gl.canvas.width * 1.0) / gl.canvas.height;
  function frame() {
    projectionMatrix.perspective({ fovy: Math.PI / 3, aspect });

    transform.run();

    clear(gl, { color: [0, 0, 0, 1], depth: true });
    model
      .setAttributes({
        rotations: [transform.getBuffer('vRotation'), { divisor: 1 }],
      })
      .setUniforms({ uProjection: projectionMatrix })
      .draw();

    transform.swap();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
};

const InstancedTransform: () => JSX.Element = () =>
  makeSample({
    name: 'Instanced Transform',
    description: 'Instanced+Transform结合渲染.',
    init,
    sources: [
      {
        name: __filename.substring(__dirname.length + 1),
        contents: __SOURCE__,
      },
    ],
    filename: __filename,
  });

export default InstancedTransform;
