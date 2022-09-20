import { makeSample, SampleInit } from '../components/SampleLayout';
import { Geometry, Model } from '@luma.gl/engine';
import { clear } from '@luma.gl/webgl';
const vs = `#version 300 es
  in vec2 position;
  in vec3 color;
  out vec3 vColor;
  void main() {
    vColor = color;
    gl_Position = vec4(position, 0.0, 1.0);
  }`;

const fs = `#version 300 es
  in vec3 vColor;
  out vec4 outColor;
  void main() {
    outColor = vec4(vColor, 1.0);
  }`;
const init: SampleInit = async ({ canvasRef }) => {
  if (canvasRef.current === null) return;
  const gl = canvasRef.current.getContext('webgl2');
  clear(gl, { color: [0, 0, 0, 1], depth: true });
  /*
    attributes包含典型的indices、positions、normals、colors、texCoords、pickingColors这些渲染相关的可选数据属性
  */
  const triangleGeometry = new Geometry({
    // attributes 可以通过 属性名称或 索引号定位，如将position改成0，color改成1也是可以的
    attributes: {
      position: {
        size: 2,
        value: new Float32Array([-0.5, -0.5, 0.5, -0.5, 0.0, 0.5]),
      },
      color: {
        size: 3,
        value: new Float32Array([1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0]),
      },
    },
    vertexCount: 3,
  });

  const model = new Model(gl, {
    vs,
    fs,
    geometry: triangleGeometry,
  });

  function frame() {
    // clear(gl, { color: [0, 0, 0, 1] });
    model.draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return gl;
};

const LumaGeometry: () => JSX.Element = () =>
  makeSample({
    name: 'Luma Geometry',
    description:
      'Luma提供三种形式的顶点参数，分别是attribute data（前文示例使用），Geometry,VertexArray，本示例使用Geometry示范，通过Geometry可以将常用的图形进行封装.',
    init,
    sources: [
      {
        name: __filename.substring(__dirname.length + 1),
        contents: __SOURCE__,
      },
    ],
    filename: __filename,
  });

export default LumaGeometry;
