import * as React from 'react';
import ReactSelect from 'react-select';
import {shallowEqual, useAppSelector} from '../Store/hooks';
import {useNavigate} from 'react-router-dom';

export default function LogIdSelector(): JSX.Element {

  const status = useAppSelector(state => state.logIds.status)
  const logIds = useAppSelector(state => state.logIds.value, shallowEqual)

  const navigate = useNavigate();

  const onChangeCb = React.useCallback((selected: {value: string} | null) => {
    if (selected) {
      setTimeout(
        () => navigate(`/${selected.value}`),
        200
      ); // @hack already...
    }
  }, [navigate]);

  const options = logIds.map(logId => ({
    value: logId,
    label: logId,
  }));

  if (status === 0) {
    return <span>loading...</span>;
  } else {
    return (
      <ReactSelect
        isMulti={false}
        name="logids"
        onChange={onChangeCb}
        options={options}
      />
    );
  }
}
