import * as React from 'react';
import { useNavigate} from 'react-router-dom';
import {reset} from '../Actions/global';
import {useAppDispatch} from '../Store/hooks';
import Login from './LoginForm';
import Overlay from './Overlay';
import RequestIndicator from './RequestIndicator';

const style: React.CSSProperties = {
  textAlign: 'center',
};

export default function App(props: {children?: React.ReactNode}): JSX.Element {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const resetCb = React.useCallback(() => {
    dispatch(reset());
    navigate("/");
  }, [navigate, dispatch]);

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
