import { makeSample, SampleInit } from '../../components/SampleLayout';
// 风数据的元数据和灰度图像
import windData from '../../../assets/wind/2016112000.json';
import windImageUri from '../../../assets/wind/2016112000.png';
import { Image } from '@loaders.gl/gltf/dist/lib/types/gltf-json-schema';
import { Model, Transform } from '@luma.gl/engine';
import {
  loadImage,
  Buffer,
  clear,
  Framebuffer,
  Texture2D,
} from '@luma.gl/webgl';
import { setParameters } from '@luma.gl/gltools';
import drawVert from './shaders/draw.vert';
import drawFrag from './shaders/draw.frag';
import quadVert from './shaders/quad.vert';
import screenFrag from './shaders/screen.frag';
import transformVs from './shaders/transform.vert';

// 定义风的gl图层
interface WindInfo {
  width: number;
  height: number;
  uMin: number;
  uMax: number;
  vMin: number;
  vMax: number;
  image: Image;
}

const defaultRampColors = {
  0.0: '#3288bd',
  0.1: '#66c2a5',
  0.2: '#abdda4',
  0.3: '#e6f598',
  0.4: '#fee08b',
  0.5: '#fdae61',
  0.6: '#f46d43',
  1.0: '#d53e4f',
};

function getColorRamp(colors) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = 256;
  canvas.height = 1;

  const gradient = ctx.createLinearGradient(0, 0, 256, 0);
  for (const stop in colors) {
    gradient.addColorStop(+stop, colors[stop]);
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 1);

  return new Uint8Array(ctx.getImageData(0, 0, 256, 1).data);
}

class WindGL {
  gl: WebGL2RenderingContext;
  fadeOpacity: number;
  speedFactor: number;
  dropRate: number;
  dropRateBump: number;
  quadBuffer: Buffer;
  backgroundTexture: Texture2D;
  screenTexture: Texture2D;
  colorRampTexture: Texture2D;
  windTexture: Texture2D;
  _numParticles: number;
  windData: WindInfo;
  framebuffer: Framebuffer;
  drawModel: Model;
  screenModel: Model;
  transform: Transform;
  positionBuffer: Buffer;
  positions: Float32Array;
  constructor(gl: WebGL2RenderingContext, data: WindInfo) {
    this.gl = gl;
    this.setWind(data);
    const height = gl.canvas.width;
    const width = gl.canvas.width;
    this.fadeOpacity = 0.996; // how fast the particle trails fade on each frame
    this.speedFactor = 0.25; // how fast the particles move
    this.dropRate = 0.003; // how often the particles move to a random place
    this.dropRateBump = 0.01; // drop rate increase relative to individual particle speed
    // 初始化设置粒子数量
    this.numParticles = 65536;
    this.quadBuffer = new Buffer(
      gl,
      new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1])
    );
    this.setColorRamp(defaultRampColors);
    // 创建transform
    this.transform = new Transform(gl, {
      // 顶点转换着色器
      vs: transformVs,
      // 定义输入
      sourceBuffers: {
        position: this.positionBuffer,
      },
      // 定义输出
      feedbackMap: {
        position: 'vPosition',
      },
      elementCount: this.positions.length / 2,
    });
    // 创建model
    this.drawModel = new Model(gl, {
      vs: drawVert,
      fs: drawFrag,
      uniforms: {
        u_wind: this.windTexture,
        u_wind_min: [this.windData.uMin, this.windData.vMin],
        u_wind_max: [this.windData.uMax, this.windData.vMax],
        u_color_ramp: this.colorRampTexture,
      },
      drawMode: gl.POINTS,
      vertexCount: this.numParticles,
    });

    //framebuffer
    this.framebuffer = new Framebuffer(gl, {
      color: true,
      depth: false,
      width: width,
      height: height,
    });
    this.framebuffer.checkStatus();
    this.screenModel = new Model(gl, {
      vs: quadVert,
      fs: screenFrag,
      attributes: {
        a_pos: this.quadBuffer,
      },
      drawMode: gl.TRIANGLES,
      vertexCount: 6,
    });
    this.resize();
  }

  resize() {
    const gl = this.gl;
    const emptyPixels = new Uint8Array(gl.canvas.width * gl.canvas.height * 4);
    // screen textures to hold the drawn screen for the previous and the current frame
    this.backgroundTexture = new Texture2D(gl, {
      data: emptyPixels,
      width: gl.canvas.width,
      height: gl.canvas.height,
      format: gl.RGBA, //webgl中格式
      dataFormat: gl.RGBA, //输入数据源格式
      type: gl.UNSIGNED_BYTE,
      parameters: {
        [gl.TEXTURE_MAG_FILTER]: gl.NEAREST,
        [gl.TEXTURE_MIN_FILTER]: gl.NEAREST,
        [gl.TEXTURE_WRAP_S]: gl.CLAMP_TO_EDGE,
        [gl.TEXTURE_WRAP_T]: gl.CLAMP_TO_EDGE,
      },
    });

    this.screenTexture = new Texture2D(gl, {
      data: emptyPixels,
      width: gl.canvas.width,
      height: gl.canvas.height,
      format: gl.RGBA, //webgl中格式
      dataFormat: gl.RGBA, //输入数据源格式
      type: gl.UNSIGNED_BYTE,
      parameters: {
        [gl.TEXTURE_MAG_FILTER]: gl.NEAREST,
        [gl.TEXTURE_MIN_FILTER]: gl.NEAREST,
        [gl.TEXTURE_WRAP_S]: gl.CLAMP_TO_EDGE,
        [gl.TEXTURE_WRAP_T]: gl.CLAMP_TO_EDGE,
      },
    });
  }

  setColorRamp(colors) {
    // lookup texture for colorizing the particles according to their speed
    const gl = this.gl;
    this.colorRampTexture = new Texture2D(gl, {
      data: getColorRamp(colors),
      width: 16,
      height: 16,
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
  }

  set numParticles(numParticles) {
    const gl = this.gl;
    this._numParticles = numParticles;
    // 每个粒子是xy两个uv坐标
    this.positions = new Float32Array(numParticles * 2);
    for (let i = 0; i < this.positions.length; i++) {
      this.positions[i] = Math.random();
    }
    this.positionBuffer = new Buffer(gl, this.positions);
    if (this.transform !== undefined) {
      this.transform.update({
        sourceBuffers: {
          position: this.positionBuffer,
        },
        elementCount: this.positions.length / 2,
      });
    }
  }
  get numParticles() {
    return this._numParticles;
  }

  setWind(windData) {
    const gl = this.gl;
    this.windData = windData;
    this.windTexture = new Texture2D(gl, {
      data: windData.image,
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
  }

  draw() {
    const gl = this.gl;
    clear(gl, { color: [0, 0, 0, 1] });
    setParameters(gl, {
      [gl.DEPTH_TEST]: false,
      [gl.STENCIL_TEST]: false,
    });
    this.transform.run({
      uniforms: {
        u_wind: this.windTexture,
        u_wind_min: [this.windData.uMin, this.windData.vMin],
        u_wind_max: [this.windData.uMax, this.windData.vMax],
        u_wind_res: [this.windData.width, this.windData.height],
        u_speed_factor: this.speedFactor,
        u_drop_rate: this.dropRate,
        u_drop_rate_bump: this.dropRateBump,
        u_rand_seed: Math.random(),
      },
    });
    // luma的fbo会resize颜色挂件，设置false，然后设置视口，就和原生的一样了
    this.framebuffer.attach(
      {
        [gl.COLOR_ATTACHMENT0]: this.screenTexture,
      },
      {
        resizeAttachments: false,
      }
    );
    setParameters(gl, {
      viewport: [0, 0, gl.canvas.width, gl.canvas.height],
    });
    this.screenModel
      .setUniforms({
        u_screen: this.backgroundTexture,
        u_opacity: this.fadeOpacity,
      })
      .draw({
        framebuffer: this.framebuffer,
      });
    const updatePosBuffer = this.transform.getBuffer('vPosition');
    this.drawModel.setAttributes({ position: updatePosBuffer }).draw({
      framebuffer: this.framebuffer,
    });
    this.transform.swap();
    setParameters(gl, {
      blend: true,
      blendFunc: [gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA],
    });
    this.screenModel
      .setUniforms({
        u_screen: this.screenTexture,
        u_opacity: 1.0,
      })
      .draw();

    gl.disable(gl.BLEND);

    // save the current screen as the background for the next frame
    const temp = this.backgroundTexture;
    this.backgroundTexture = this.screenTexture;
    this.screenTexture = temp;
  }
}

const init: SampleInit = async ({ canvasRef, gui }) => {
  const canvas = canvasRef.current;
  if (canvas === null) return;
  // 强制修改下canvas使其与父容器同宽，否则展示挤在一起了
  canvas.width = canvas.parentElement.clientWidth;
  const gl = canvas.getContext('webgl2');
  // 加载风数据
  const windImage: Image = await loadImage(windImageUri);
  const windInfo: WindInfo = {
    width: windData.width,
    height: windData.height,
    uMin: windData.uMin,
    uMax: windData.uMax,
    vMin: windData.vMin,
    vMax: windData.vMax,
    image: windImage,
  };
  const wind = new WindGL(gl, windInfo);

  const meta = {
    numParticles: 65536,
    fadeOpacity: 0.996,
    speedFactor: 0.25,
    dropRate: 0.003,
    dropRateBump: 0.01,
    '2016-11-20+h': 0,
  };
  // 显示gui
  gui.add(meta, 'numParticles', 1024, 160000).onChange((value) => {
    console.log(value);
    wind.numParticles = value;
  });
  gui
    .add(meta, 'fadeOpacity', 0.96, 0.999)
    .step(0.001)
    .updateDisplay()
    .onChange((value) => {
      wind.fadeOpacity = value;
    });
  gui.add(meta, 'speedFactor', 0.05, 1.0).onChange((value) => {
    wind.speedFactor = value;
  });
  gui.add(meta, 'dropRate', 0, 0.1).onChange((value) => {
    wind.dropRate = value;
  });
  gui.add(meta, 'dropRateBump', 0, 0.2).onChange((value) => {
    wind.dropRateBump = value;
  });
  function frame() {
    wind.draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return gl;
};

const WindGLTest: () => JSX.Element = () =>
  makeSample({
    name: 'Mapbox Wind',
    description:
      '基于Mapbox Wind使用luma api改写，并使用transform-feedback特性更新粒子位置.',
    gui: true,
    init,
    sources: [
      {
        name: __filename.substring(__dirname.length + 1),
        contents: __SOURCE__,
      },
      {
        name: './shaders/draw.vert.ts',
        contents: drawVert,
        editable: false,
      },
      {
        name: './shaders/draw.frag.ts',
        contents: drawFrag,
        editable: false,
      },
      {
        name: './shaders/quad.vert.ts',
        contents: quadVert,
        editable: false,
      },
      {
        name: './shaders/screen.frag.ts',
        contents: screenFrag,
        editable: false,
      },
      {
        name: './shaders/transform.vert.ts',
        contents: transformVs,
        editable: false,
      },
    ],
    filename: __filename,
  });

export default WindGLTest;
