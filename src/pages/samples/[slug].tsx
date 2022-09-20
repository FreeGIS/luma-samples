import dynamic from 'next/dynamic';
import { GetStaticPaths, GetStaticProps } from 'next';

type PathParams = {
  slug: string;
};

type Props = {
  slug: string;
};

export const pages = {
  HelloTriangle: dynamic(() => import('../../sample/hello-triangle')),
  Instanced: dynamic(() => import('../../sample/instanced')),
  VertexArray: dynamic(() => import('../../sample/vertex-array')),
  VaoInstanced: dynamic(() => import('../../sample/vao-instanced')),
  Indices: dynamic(() => import('../../sample/indices')),
  CustomeGeometry: dynamic(() => import('../../sample/geometry')),
  ShaderModules: dynamic(() => import('../../sample/shader-modules')),
  ShaderHooks: dynamic(() => import('../../sample/shader-hooks')),
  TransformFeedback: dynamic(() => import('../../sample/transform-feedback')),
  TransformUniform: dynamic(() => import('../../sample/transform-uniform')),
  TransformParticles: dynamic(() => import('../../sample/transform-particles')),
  GeoSpatial: dynamic(() => import('../../sample/geospatial')),
  CubeGeometry: dynamic(() => import('../../sample/cube-geometry')),
  Lighting: dynamic(() => import('../../sample/lighting')),
  InstancedTransform: dynamic(() => import('../../sample/instanced-transform')),
  ProgramManagement: dynamic(() => import('../../sample/program-management')),
  CubeMap: dynamic(() => import('../../sample/cubemap')),
  Texture3D: dynamic(() => import('../../sample/texture3d')),
  Animation: dynamic(() => import('../../sample/animation')),
  Wind: dynamic(() => import('../../sample/wind/index')),
};

function Page({ slug }: Props): JSX.Element {
  const PageComponent = pages[slug];
  return <PageComponent />;
}

export const getStaticPaths: GetStaticPaths<PathParams> = async () => {
  return {
    paths: Object.keys(pages).map((p) => {
      return { params: { slug: p } };
    }),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<Props, PathParams> = async ({
  params,
}) => {
  return {
    props: {
      ...params,
    },
  };
};

export default Page;
