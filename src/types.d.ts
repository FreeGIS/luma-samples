declare module '*.module.css' {
  const styles: { [className: string]: string };
  export default styles;
}
interface HTMLCanvasElement extends HTMLElement {
  getContext(contextId: 'webgl2'): GPUPresentationContext | null;
}

declare const __SOURCE__: string;

// Defined by webpack.
declare namespace NodeJS {
  interface Process {
    readonly browser: boolean;
  }

  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
  }
}

declare module '*.glsl' {
  const shader: 'string';
  export default shader;
}
