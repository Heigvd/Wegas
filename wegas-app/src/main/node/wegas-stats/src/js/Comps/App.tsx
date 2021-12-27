import * as React from 'react';
import { useHistory} from 'react-router-dom';
import {reset} from '../Actions/global';
import {useAppDispatch} from '../Store/hooks';
import Login from './LoginForm';
import Overlay from './Overlay';
import RequestIndicator from './RequestIndicator';

const style: React.CSSProperties = {
  textAlign: 'center',
};

export default function App(props: {children?: React.ReactNode}): JSX.Element {
  const history = useHistory();
  const dispatch = useAppDispatch();

  const resetCb = React.useCallback(() => {
    dispatch(reset());
    history.push("/");
  }, [history, dispatch]);

  return (
    <div>
      <Overlay />
      <h2 className="header" style={style}>
        Wegas Stats
      </h2>
      <button onClick={resetCb}>
        Restart
      </button>
      <RequestIndicator />
      <div className="body">
        <Login>{props.children}</Login>
      </div>
    </div>
  );
}
