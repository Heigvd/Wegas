import { css, cx } from '@emotion/css';
import * as React from 'react';
import { DropDown, DropDownDirection } from '../../Components/DropDown';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { Toolbar } from '../../Components/Toolbar';
import { flex, flexRow, expandBoth, justifyCenter } from '../../css/classes';

export default function DropDownTester() {
  const [direction, setDirection] = React.useState<DropDownDirection>('down');
  return (
    <Toolbar className={expandBoth}>
      <Toolbar.Header className={cx(flex, flexRow, justifyCenter)}>
        <div>
          <Button
            icon="caret-down"
            onClick={() => setDirection('down')}
            mode={direction === 'down' ? 'success' : undefined}
          />
          <Button
            icon="caret-left"
            onClick={() => setDirection('left')}
            mode={direction === 'left' ? 'success' : undefined}
          />
          <Button
            icon="caret-up"
            onClick={() => setDirection('up')}
            mode={direction === 'up' ? 'success' : undefined}
          />
          <Button
            icon="caret-right"
            onClick={() => setDirection('right')}
            mode={direction === 'right' ? 'success' : undefined}
          />
        </div>
      </Toolbar.Header>
      <Toolbar.Content style={{ position: 'relative' }}>
        <div className={cx(flex, flexRow)} key={direction}>
          <div className={css({ position: 'absolute', left: 0, top: 0 })}>
            <DropDown
              direction={direction}
              label="Simple string"
              content="Simple string"
            />
          </div>
          <div className={css({ position: 'absolute', right: 0, top: 0 })}>
            <DropDown
              direction={direction}
              label="Simple string"
              content="Simple string"
            />
          </div>
          <div
            className={css({ position: 'absolute', right: '50%', top: '50%' })}
          >
            <DropDown
              direction={direction}
              label={<div style={{ backgroundColor: 'yellow' }}>Outer</div>}
              content={<div style={{ backgroundColor: 'green' }}>Inner</div>}
            />
          </div>
          <div className={css({ position: 'absolute', left: 0, bottom: 0 })}>
            <DropDown
              direction={direction}
              label="Simple string"
              content="Simple string"
            />
          </div>
          <div className={css({ position: 'absolute', right: 0, bottom: 0 })}>
            <DropDown
              direction={direction}
              label="Simple string"
              content="Simple string"
            />
          </div>
        </div>
      </Toolbar.Content>
    </Toolbar>
  );
}
