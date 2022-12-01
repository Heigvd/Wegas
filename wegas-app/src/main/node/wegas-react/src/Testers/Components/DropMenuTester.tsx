import { css, cx } from '@emotion/css';
import * as React from 'react';
import { DropDownDirection } from '../../Components/DropDown';
import { DropMenu } from '../../Components/DropMenu';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { Toolbar } from '../../Components/Toolbar';
import { flex, flexRow, expandBoth, justifyCenter } from '../../css/classes';
import { wlog } from '../../Helper/wegaslog';

const testItems = [
  'BLAssssssssssssssssssssssssssssssss1',
  'BLI',
  'BLU',
  '1234',
  'items',
  'BLAssssssssssssssssssssssssssssssss1',
  'BLI',
  'BLU',
  'BLAssssssssssssssssssssssssssssssss1',
  'BLI',
  'BLU',
  'BLAssssssssssssssssssssssssssssssss1',
  'BLI',
  'BLU',
  'BLAssssssssssssssssssssssssssssssss1',
  'BLI',
  'BLU',
  'BLAssssssssssssssssssssssssssssssss1',
  'BLI',
  'BLU',
  'BLAssssssssssssssssssssssssssssssss1',
  'BLI',
  'BLU',
  'BLAssssssssssssssssssssssssssssssss1',
  'BLI',
  'BLU',
  'BLAssssssssssssssssssssssssssssssss1',
  'BLI',
  'BLU',
  'BLAssssssssssssssssssssssssssssssss1',
  'BLI',
  'BLU',
  'BLAssssssssssssssssssssssssssssssss1',
  'BLI',
  'BLU',
] as const;

export default function DropMenuTester() {
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
            <DropMenu
              direction={direction}
              items={testItems.map(i =>
                i === 'items'
                  ? {
                      label: 'more values',
                      value: 'morevalues',
                      items: [
                        { label: 'val1', value: 'val1' },
                        { label: 'val2', value: 'val2' },
                        { label: 'val3', value: 'val3' },
                        { label: 'val4', value: 'val4' },
                      ],
                    }
                  : { label: i, value: i },
              )}
              selected={'1234'}
              onSelect={e => {
                wlog(e);
              }}
            />
          </div>
          <div className={css({ position: 'absolute', right: 0, top: 0 })}>
            <DropMenu
              direction={direction}
              items={testItems.map(i => ({ label: i, value: i }))}
              selected={'1234'}
            />
          </div>
          <div
            className={css({ position: 'absolute', right: '50%', top: '50%' })}
          >
            <DropMenu
              direction={direction}
              items={testItems.map(i => ({ label: i, value: i }))}
              selected={'1234'}
            />
          </div>
          <div className={css({ position: 'absolute', left: 0, bottom: 0 })}>
            <DropMenu
              direction={direction}
              items={testItems.map(i => ({ label: i, value: i }))}
              selected={'1234'}
            />
          </div>
          <div className={css({ position: 'absolute', right: 0, bottom: 0 })}>
            <DropMenu
              direction={direction}
              items={testItems.map(i => ({ label: i, value: i }))}
              selected={'1234'}
            />
          </div>
        </div>
      </Toolbar.Content>
    </Toolbar>
  );
}
