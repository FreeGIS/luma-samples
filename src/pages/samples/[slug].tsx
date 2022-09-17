import dynamic from 'next/dynamic';
import { GetStaticPaths, GetStaticProps } from 'next';

type PathParams = {
  slug: string;
};

type Props = {
  slug: string;
};

export const pages = {
  helloTriangle: dynamic(() => import('../../sample/helloTriangle')),
  instanced: dynamic(() => import('../../sample/instanced')),
  vertexArray: dynamic(() => import('../../sample/vertexArray')),
  vaoinstanced: dynamic(() => import('../../sample/vaoinstanced')),
  indices: dynamic(() => import('../../sample/indices')),
  lumaGeometry: dynamic(() => import('../../sample/lumaGeometry')),
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
