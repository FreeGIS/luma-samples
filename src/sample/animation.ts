import { makeSample, SampleInit } from '../components/SampleLayout';
import { CubeGeometry, Timeline, KeyFrames, Model } from '@luma.gl/engine';
import { setParameters } from '@luma.gl/gltools';
import { dirlight } from '@luma.gl/shadertools';
import { Matrix4, radians } from '@math.gl/core';
import { getRandom as random } from '../utils/index';
import { clear } from '@luma.gl/webgl';
const vs = `#version 300 es
in vec3 positions;
in vec3 normals;
uniform vec3 uColor;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
out vec3 color;
void main(void) {
  vec3 normal = vec3(uModel * vec4(normals, 0.0));
  // Set up data for modules
  color = uColor;
  project_setNormal(normal);
  gl_Position = uProjection * uView * uModel * vec4(positions, 1.0);
}
`;

const fs = `#version 300 es
precision highp float;
in vec3 color;
out vec4 outColor;
void main(void) {
  outColor = vec4(color, 1.);
  outColor = dirlight_filterColor(outColor);
}
`;

const init: SampleInit = async ({ canvasRef, gui }) => {
  if (canvasRef.current === null) return;
  const gl = canvasRef.current.getContext('webgl2');
  clear(gl, { color: [0, 0, 0, 1], depth: true });
  setParameters(gl, {
    clearColor: [0, 0, 0, 1],
    clearDepth: 1,
    depthTest: true,
    depthFunc: gl.LEQUAL,
  });

  const meta = {
    play: true,
    time: 0,
  };

  // eslint-disable-next-line prefer-const
  let timeline = new Timeline();
  gui.add(meta, 'play').onFinishChange(function (value) {
    if (value) timeline.play();
    else timeline.pause();
  });
  gui.add(meta, 'time', 0, 30000).onFinishChange(function (value) {
    timeline.setTime(Number(value));
  });

  const translations = [
    [2, -2, 0],
    [2, 2, 0],
    [-2, 2, 0],
    [-2, -2, 0],
  ];

  const rotations = [
    [random(), random(), random()],
    [random(), random(), random()],
    [random(), random(), random()],
    [random(), random(), random()],
  ];

  const colors = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
    [1, 1, 0],
  ];

  timeline.play();

  const channels = [
    timeline.addChannel({
      delay: 2000,
      rate: 0.5,
      duration: 8000,
      repeat: 2,
    }),
    timeline.addChannel({
      delay: 10000,
      rate: 0.2,
      duration: 20000,
      repeat: 1,
    }),
    timeline.addChannel({
      delay: 7000,
      rate: 1,
      duration: 4000,
      repeat: 8,
    }),
    timeline.addChannel({
      delay: 0,
      rate: 0.8,
      duration: 5000,
      repeat: Number.POSITIVE_INFINITY,
    }),
  ];

  const keyFrameData = [
    [0, 0],
    [1000, 2 * Math.PI],
    [2000, Math.PI],
    [3000, 2 * Math.PI],
    [4000, 0],
  ];

  const keyFrames = [
    new KeyFrames(keyFrameData),
    new KeyFrames(keyFrameData),
    new KeyFrames(keyFrameData),
    new KeyFrames(keyFrameData),
  ];

  const cubes = new Array(4);
  const aspect = (gl.canvas.width * 1.0) / gl.canvas.height;
  for (let i = 0; i < 4; ++i) {
    timeline.attachAnimation(keyFrames[i], channels[i]);

    cubes[i] = {
      translation: translations[i],
      rotation: rotations[i],
      keyFrames: keyFrames[i],
      model: new Model(gl, {
        vs,
        fs,
        modules: [dirlight],
        geometry: new CubeGeometry(),
        uniforms: {
          uProjection: new Matrix4().perspective({
            fovy: radians(60),
            aspect,
            near: 1,
            far: 20.0,
          }),
          uView: new Matrix4().lookAt({
            center: [0, 0, 0],
            eye: [0, 0, -8],
          }),
          uColor: colors[i],
        },
      }),
    };
  }

  function frame(time) {
    const modelMatrix = new Matrix4();
    //const tick = (time / 1000) * 60;
    if (timeline.playing === true) timeline.update(time);
    // Draw the cubes
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    for (let i = 0; i < 4; ++i) {
      const cube = cubes[i];
      const startRotation = cube.keyFrames.getStartData();
      const endRotation = cube.keyFrames.getEndData();
      const rotation =
        startRotation + cube.keyFrames.factor * (endRotation - startRotation);
      const rotationX = cube.rotation[0] + rotation;
      const rotationY = cube.rotation[1] + rotation;
      const rotationZ = cube.rotation[2];
      modelMatrix
        .identity()
        .translate(cube.translation)
        .rotateXYZ([rotationX, rotationY, rotationZ]);
      cube.model
        .setUniforms({
          uModel: modelMatrix,
        })
        .draw();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return gl;
};

const Animation: () => JSX.Element = () =>
  makeSample({
    name: 'Animation',
    description:
      'Animation需要Timeline和KeyFrames，这是Luma中简单但重要的特性.',
    gui: true,
    init,
    sources: [
      {
        name: __filename.substring(__dirname.length + 1),
        contents: __SOURCE__,
      },
    ],
    filename: __filename,
  });

export default Animation;
