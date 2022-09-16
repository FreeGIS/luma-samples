import Head from 'next/head';
import { AppProps } from 'next/app';
import Link from 'next/link';
import { useRouter } from 'next/router';

import './styles.css';
import styles from './MainLayout.module.css';

import { pages } from './samples/[slug]';

const title = 'Luma.gl Samples';

const MainLayout: React.FunctionComponent<AppProps> = ({
  Component,
  pageProps,
}) => {
  const router = useRouter();
  const samplesNames = Object.keys(pages);

  const oldPathSyntaxMatch = router.asPath.match(/(\?wgsl=[01])#(\S+)/);
  if (oldPathSyntaxMatch) {
    const slug = oldPathSyntaxMatch[2];
    router.replace(`/samples/${slug}`);
    return <></>;
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta
          name="description"
          content="The Luma.gl Samples are a set of samples demonstrating the use of the Luma API."
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <link
          href="https://fonts.googleapis.com/css?family=Inconsolata&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.48.4/codemirror.min.css"
          rel="stylesheet"
        />
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.48.4/theme/monokai.min.css"
          rel="stylesheet"
        />
        <meta
          httpEquiv="origin-trial"
          content="Ak1q2mlPP/liPtT5bWxAgE12zre448Gqx42aQRq4EsL8vfLPsELqk3xXKBV4iCyK9xKYc7DejNfngi6jyaW/wAwAAABOeyJvcmlnaW4iOiJodHRwczovL2F1c3Rpbi1lbmcuY29tOjQ0MyIsImZlYXR1cmUiOiJXZWJHUFUiLCJleHBpcnkiOjE2NjM3MTgzOTl9"
        />
      </Head>
      <div className={styles.wrapper}>
        <nav className={`${styles.panel} ${styles.container}`}>
          <h1>
            <Link href="/">{title}</Link>
          </h1>
          <a href="https://github.com/FreeGIS/luma-samples">Github</a>
          <hr />
          <ul className={styles.exampleList}>
            {samplesNames.map((slug) => {
              const className =
                router.pathname === `/samples/[slug]` &&
                router.query['slug'] === slug
                  ? styles.selected
                  : undefined;
              return (
                <li
                  key={slug}
                  className={className}
                  onMouseOver={() => {
                    pages[slug].render.preload();
                  }}
                >
                  <Link href={`/samples/${slug}`}>{slug}</Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <Component {...pageProps} />
      </div>
    </>
  );
};

export default MainLayout;
