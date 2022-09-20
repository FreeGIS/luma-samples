import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { instrumentGLContext } from '@luma.gl/gltools';
import { Buffer } from '@luma.gl/webgl';
import { Model } from '@luma.gl/engine';
import { makeSample, SampleInit } from '../components/SampleLayout';

mapboxgl.accessToken = 'pk.eyJ1IjoiZnJlZWdpcyIsImEiOiJjam04dXRudWwwNXczM3Fqb3dkd201dGZzIn0.jvDsB3YWibUpk1oR9vva1A'; // eslint-disable-line

const coordinates = [
  [-73.9819, 40.7681], // Columbus Circle
  [-73.98513, 40.758896], // Times Square
  [-73.9786, 40.7589], // Rockafeller Center
];

class CustomLayer {
  id: string;
  type: string;
  renderingMode: string;
  map: any;
  positionBuffer: Buffer;
  colorBuffer: Buffer;
  model: Model;
  constructor() {
    this.id = 'lumagl-layer';
    this.type = 'custom';
    this.renderingMode = '3d';
  }

  onAdd(m, gl) {
    // instrumentGLContext能让luma.gl需要用到的对象binding到这个外部的gl上。
    instrumentGLContext(gl);
    this.map = m;

    const vertexSource = `#version 300 es
        in vec2 positions;
        in vec3 colors;
        uniform mat4 uPMatrix;
        out vec3 vColor;
        void main() {
            vColor = colors;
            gl_Position = uPMatrix * vec4(positions, 0, 1.0);
        }
    `;

    const fragmentSource = `#version 300 es
        in vec3 vColor;
        out vec4 outColor;
        void main() {
          outColor = vec4(vColor, 0.5);
        }
    `;

    const positions = new Float32Array(6);

    coordinates.forEach((point, i) => {
      const coords = mapboxgl.MercatorCoordinate.fromLngLat(point);
      positions[i * 2] = coords.x;
      positions[i * 2 + 1] = coords.y;
    });

    this.positionBuffer = new Buffer(gl, new Float32Array(positions));
    this.colorBuffer = new Buffer(
      gl,
      new Float32Array([1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0])
    );

    // Model to draw a triangle on the map
    this.model = new Model(gl, {
      id: 'my-program',
      vs: vertexSource,
      fs: fragmentSource,
      attributes: {
        positions: this.positionBuffer,
        colors: this.colorBuffer,
      },
      vertexCount: 3,
    });
  }

  render(gl, matrix) {
    // Mapbox passes us a projection matrix
    this.model
      .setUniforms({
        uPMatrix: matrix,
      })
      .draw();
  }

  onRemove() {
    // Cleanup
    this.positionBuffer.delete();
    this.colorBuffer.delete();
    this.model.delete();
  }
}

const init: SampleInit = async ({ canvasRef }) => {
  if (canvasRef.current === null) return;
  // 父容器创建一个map div并设置样式
  const mapDiv = document.createElement('div');
  mapDiv.style.cssText = 'position: absolute;top: 0;bottom: 0;width: 100%;';
  canvasRef.current.parentElement.appendChild(mapDiv);
  // 将mapbox改成webgl2
  // 扩展，使其兼容webgl2
  if (
    mapboxgl.Map.prototype._setupPainter.toString().indexOf('webgl2') === -1
  ) {
    const _setupPainterOld = mapboxgl.Map.prototype._setupPainter;
    mapboxgl.Map.prototype._setupPainter = function () {
      const getContextOld = this._canvas.getContext;
      this._canvas.getContext = function (name, attrib) {
        return (
          getContextOld.apply(this, ['webgl2', attrib]) ||
          getContextOld.apply(this, ['webgl', attrib]) ||
          getContextOld.apply(this, ['experimental-webgl', attrib])
        );
      };
      _setupPainterOld.apply(this);
      this._canvas.getContext = getContextOld;
    };
  }

  const map = new mapboxgl.Map({
    container: mapDiv,
    style: 'mapbox://styles/mapbox/streets-v9',
    center: [-73.98213, 40.762896],
    zoom: 14,
    pitch: 40,
    bearing: -10,
    antialias: true,
  });

  map.on('load', () => {
    map.addLayer(new CustomLayer());
  });
  return map;
};

const GeoSpatial: () => JSX.Element = () =>
  makeSample({
    name: 'GeoSpatial',
    description: 'Luma+MapboxGL的GIS案例.',
    init,
    sources: [
      {
        name: __filename.substring(__dirname.length + 1),
        contents: __SOURCE__,
      },
    ],
    filename: __filename,
  });

export default GeoSpatial;
