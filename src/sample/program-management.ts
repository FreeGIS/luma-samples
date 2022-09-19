import { makeSample, SampleInit } from '../components/SampleLayout';
import { Model, CubeGeometry, ProgramManager } from '@luma.gl/engine';
import { dirlight as dirlightBase } from '@luma.gl/shadertools';
import { setParameters } from '@luma.gl/gltools';
import { Matrix4, radians } from '@math.gl/core';
import { getRandom as random } from '../utils/index';

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
  LUMAGL_normal(normal);
  gl_Position = uProjection * uView * uModel * vec4(positions, 1.0);
}
`;

const fs = `#version 300 es
precision highp float;
in vec3 color;
out vec4 outColor;
void main(void) {
  outColor = vec4(color, 1.);
  LUMAGL_fragmentColor(outColor);
}
`;

// Create a new version of module with injections
const dirlight = Object.assign(
  {
    inject: {
      'vs:LUMAGL_normal': 'project_setNormal(normal);',
      'fs:LUMAGL_fragmentColor': 'color = dirlight_filterColor(color);',
    },
  },
  dirlightBase
);

const init: SampleInit = async ({ canvasRef }) => {
  if (canvasRef.current === null) return;
  const gl = canvasRef.current.getContext('webgl2');

  setParameters(gl, {
    clearColor: [0, 0, 0, 1],
    clearDepth: 1,
    depthTest: true,
    depthFunc: gl.LEQUAL,
  });

  const programManager = new ProgramManager(gl);
  programManager.addShaderHook('vs:LUMAGL_normal(inout vec3 normal)', {});
  programManager.addShaderHook('fs:LUMAGL_fragmentColor(inout vec4 color)', {});

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

  const cubes = new Array(4);
  const aspect = (gl.canvas.width * 1.0) / gl.canvas.height;
  for (let i = 0; i < 4; ++i) {
    cubes[i] = {
      translation: translations[i],
      rotation: rotations[i],
      model: new Model(gl, {
        programManager,
        vs,
        fs,
        modules: i % 2 === 0 ? [] : [dirlight],
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
    const tick = (time / 1000) * 60;
    if (tick % 240 === 0) {
      if (tick % 480 === 0) {
        programManager.removeDefaultModule(dirlight);
      } else {
        programManager.addDefaultModule(dirlight);
      }
    }

    if (tick % 120 === 0) {
      const even = tick % 240 === 0;
      for (let i = 0; i < 4; ++i) {
        cubes[i].model.setProgram({
          vs,
          fs,
          modules: i % 2 === Number(even) ? [] : [dirlight],
        });
      }
    }

    const modelMatrix = new Matrix4();

    // Draw the cubes
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    for (let i = 0; i < 4; ++i) {
      const cube = cubes[i];

      cube.rotation[0] += 0.01;
      cube.rotation[1] += 0.01;
      cube.rotation[2] += 0.01;

      modelMatrix
        .identity()
        .translate(cube.translation)
        .rotateXYZ(cube.rotation);

      cube.model
        .setUniforms({
          uModel: modelMatrix,
        })
        .draw();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
};

const ProgramManagement: () => JSX.Element = () =>
  makeSample({
    name: 'Program Management',
    description: 'Program管理，多个program绘制时管理使用.',
    init,
    sources: [
      {
        name: __filename.substring(__dirname.length + 1),
        contents: __SOURCE__,
      },
    ],
    filename: __filename,
  });

export default ProgramManagement;
