import styles from './HomePage.module.css';

const HomePage: React.FunctionComponent = () => {
  return (
    <main className={styles.homePage}>
      <p>These samples run in Google Chrome or Edge.</p>

      <p id="not-supported" style={{ display: 'none' }}>
        Webgl2 is not supported on this platform yet!
      </p>
    </main>
  );
};

export default HomePage;
