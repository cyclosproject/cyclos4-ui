/* SystemJS module definition */
declare var module: NodeModule;
interface NodeModule {
  id: string;
}

// JSON loading, basically used for translations
declare module '*.json' {
    const value: any;
    export default value;
}
