/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import * as React from 'react';
import { IRoleWithId } from 'wegas-ts-api';
import Card from '../common/Card';
import FitSpace from '../common/FitSpace';
import { cardTitleStyle } from '../styling/style';

interface RoleCardProps {
  role: IRoleWithId;
  children?: React.ReactNode;
}

export function RoleCard({ role, children }: RoleCardProps): JSX.Element {
  return (
    <Card key={role.id} illustration="ICON_grey_users_fa">
      <FitSpace direction="column">
        <div className={cardTitleStyle}>{role.name}</div>
      </FitSpace>
      {children}
    </Card>
  );
}
