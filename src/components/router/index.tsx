import { bind } from '../../lib/initial-util';
import history from '../../lib/history';

const ROUTE_EDITOR = '/editor';

export class AppRouter {
  public history = history;
  private popStateAction?: () => void;

  addPopStateListener = (cb: (enteredEditor: boolean) => void) => {
    this.popStateAction = () => cb(history.pathname === ROUTE_EDITOR);
    history.addPopStateListener(this.popStateAction);
  }

  @bind
  public destroy() {
    this.popStateAction &&
      this.history.removePopStateListener(this.popStateAction);
  }

  public routeToEditor() {
    this.history.push(ROUTE_EDITOR);
  }
}

export default new AppRouter();
