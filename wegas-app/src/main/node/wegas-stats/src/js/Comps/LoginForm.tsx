import * as React from 'react';
import {bootstrapUser} from '../Actions/userActions';
import {useAppDispatch, useAppSelector} from '../Store/hooks';

interface Props{
  children: React.ReactNode;
}

export default function Login({children}: Props): JSX.Element {
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    dispatch(bootstrapUser());
  }, [dispatch])

  const {isLoggedIn, user} = useAppSelector(state => state.user);

  if (isLoggedIn && user != null) {
    return (
      <div>
        {user.name}
        <div>
          {children}
        </div>
      </div>
    );
  } else {
    return (<div>Access denied: please login</div>
    );
  }
}