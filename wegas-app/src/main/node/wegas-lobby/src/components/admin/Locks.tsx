/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { faSync } from '@fortawesome/free-solid-svg-icons';
import * as React from 'react';
import { getRestClient } from '../../API/api';
import ActionIconButton from '../common/ActionIconButton';

export function Locks(): JSX.Element {
  const [data, setData] = React.useState('<h3>Loading...</h3>');

  const reload = React.useCallback(async () => {
    setData(await getRestClient().AdminStuff.getLocks());
  }, []);

  React.useEffect(() => {
    reload();
  }, [reload]);

  return (
    <div>
      <ActionIconButton title="" icon={faSync} onClick={reload} />
      <div dangerouslySetInnerHTML={{ __html: data }}></div>
    </div>
  );
}
