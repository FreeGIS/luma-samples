import { makeSample, SampleInit } from '../../components/SampleLayout';
import { loadImage } from '@luma.gl/webgl';
import WindGL from './windgl';
// 风数据的元数据和灰度图像
import windData from '../../../assets/wind/2016112000.json';
import windImageUri from '../../../assets/wind/2016112000.png';
import { Image } from '@loaders.gl/gltf/dist/lib/types/gltf-json-schema';

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
    'retina resolution': false,
  };
  // 显示gui
  gui.add(meta, 'numParticles', 1024, 160000).onChange((value) => {
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

  gui.add(meta, 'retina resolution').onChange((value) => {
    if (value === true) {
      const ratio = 2;
      canvas.width = canvas.clientWidth * ratio;
      canvas.height = canvas.clientHeight * ratio;
      wind.resize();
    }
  });
  /*const windFiles = {
    0: '2016112000',
    6: '2016112006',
    12: '2016112012',
    18: '2016112018',
    24: '2016112100',
    30: '2016112106',
    36: '2016112112',
    42: '2016112118',
    48: '2016112200',
  };*/

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
    ],
    filename: __filename,
  });

export default WindGLTest;
