import { h, Component } from 'preact';

import { bind, linkRef, Fileish } from '../../lib/initial-util';
import * as style from './style.scss';
import { FileDropEvent } from 'file-drop-element';
import 'file-drop-element';
import SnackBarElement, { SnackOptions } from '../../lib/SnackBar';
import '../../lib/SnackBar';
import Intro from '../intro';
import '../custom-els/LoadingSpinner';

// This is imported for TypeScript only. It isn't used.
import Compress from '../compress';
import { AppRouter } from '../Router';

const compressPromise = import(
  /* webpackChunkName: "main-app" */
  '../compress',
);
const routerPromise = import(
  /* webpackChunkName: "router" */
  '../router',
);
const offlinerPromise = import(
  /* webpackChunkName: "offliner" */
  '../../lib/offliner',
);

export interface SourceImage {
  file: File | Fileish;
  data: ImageData;
  vectorImage?: HTMLImageElement;
}

interface Props {}

interface State {
  file?: File | Fileish;
  isEditorOpen: Boolean;
  Compress?: typeof Compress;
  appRouter?: AppRouter;
}

export default class App extends Component<Props, State> {
  state: State = {
    isEditorOpen: false,
    file: undefined,
    Compress: undefined,
    appRouter: undefined,
  };

  snackbar?: SnackBarElement;

  constructor() {
    super();

    compressPromise.then((module) => {
      this.setState({ Compress: module.default });
    }).catch(() => {
      this.showSnack('Failed to load app');
    });

    routerPromise.then(({ default: appRouter }) => {
      appRouter.addPopStateListener((enteredEditor: boolean) =>
        this.setState({ isEditorOpen: enteredEditor }),
      );

      this.setState({ appRouter });
    });

    offlinerPromise.then(({ offliner }) => offliner(this.showSnack));

    // In development, persist application state across hot reloads:
    if (process.env.NODE_ENV === 'development') {
      this.setState(window.STATE);
      const oldCDU = this.componentDidUpdate;
      this.componentDidUpdate = (props, state) => {
        if (oldCDU) oldCDU.call(this, props, state);
        window.STATE = this.state;
      };
    }
  }

  @bind
  private async routeToEditor() {
    const { default: appRouter } = await routerPromise;
    this.setState({ isEditorOpen: true });
    appRouter.routeToEditor();
  }

  @bind
  private onFileDrop({ file }: FileDropEvent) {
    if (!file) return;
    this.setState({ file }, this.routeToEditor);
  }

  @bind
  private onIntroPickFile(file: File | Fileish) {
    this.setState({ file }, this.routeToEditor);
  }

  @bind
  private showSnack(message: string, options: SnackOptions = {}): Promise<string> {
    if (!this.snackbar) throw Error('Snackbar missing');
    return this.snackbar.showSnackbar(message, options);
  }

  componentWillUnmount() {
    routerPromise.then(({ default: appRouter }) => {
      appRouter.destroy();
    });
  }

  render({}: Props, { file, isEditorOpen, Compress, appRouter }: State) {
    return (
      <div id="app" class={style.app}>
        <file-drop accept="image/*" onfiledrop={this.onFileDrop} class={style.drop}>
          {(!file || !isEditorOpen)
            ? <Intro onFile={this.onIntroPickFile} showSnack={this.showSnack} />
            : (Compress && appRouter)
              ? <Compress file={file} showSnack={this.showSnack} onBack={appRouter.history.back} />
              : <loading-spinner class={style.appLoader}/>
          }
          <snack-bar ref={linkRef(this, 'snackbar')} />
        </file-drop>
      </div>
    );
  }
}
