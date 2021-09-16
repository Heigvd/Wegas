import * as React from 'react';
import {
  flexRow,
  expandBoth,
  flex,
  expandHeight,
  grow,
  flexColumn,
} from '../css/classes';
import { cx } from '@emotion/css';
import { Toggler } from '../Components/Inputs/Boolean/Toggler';
import { wlog } from '../Helper/wegaslog';

function Level({
  value,
  children,
}: React.PropsWithChildren<{ value?: boolean }>) {
  return (
    <div className={cx(flex, flexColumn)}>
      <div>Value : {String(value)}</div>
      <div className={grow}>{children}</div>
    </div>
  );
}

interface TestObject {
  prop: boolean;
  next?: TestObject;
}

function Nested({ value }: { value: TestObject }) {
  React.useEffect(() => wlog(value), [value]);
  return (
    <div className={cx(flex, flexColumn)}>
      <div>Value : {String(value.prop)}</div>
      {value.next != undefined && <Nested value={value.next} />}
    </div>
  );
}

export default function ObjectChangesTester() {
  const statelessTestObject: TestObject = {
    prop: false,
    next: {
      prop: false,
    },
  };

  const [statefullTestObject, setStatefullTestObject] =
    React.useState<TestObject>({
      prop: false,
      next: {
        prop: false,
      },
    });

  const [nestedTestObject, setNestedTestObject] = React.useState<TestObject>({
    prop: false,
    next: {
      prop: false,
      next: {
        prop: false,
        next: {
          prop: false,
        },
      },
    },
  });

  return (
    <div className={cx(flex, flexRow, expandBoth)}>
      <div className={cx(flex, flexColumn, grow)}>
        STATELESS
        <div className={cx(flex, flexRow, expandBoth)}>
          <div className={expandHeight}>
            <Toggler
              value={statelessTestObject.prop}
              onChange={v => (statelessTestObject.prop = v)}
            />
            <Toggler
              value={statelessTestObject.next?.prop}
              onChange={v => {
                if (statelessTestObject.next != null) {
                  statelessTestObject.next.prop = v;
                }
              }}
            />
          </div>
          <div className={cx(grow, expandHeight, flex, flexColumn)}>
            <Level value={statelessTestObject.prop}>
              <Level value={statelessTestObject.next?.prop} />
            </Level>
          </div>
        </div>
      </div>
      <div className={cx(flex, flexColumn, grow)}>
        STATEFULL
        <div className={cx(flex, flexRow, expandBoth)}>
          <div className={expandHeight}>
            <Toggler
              value={statefullTestObject.prop}
              onChange={v => setStatefullTestObject(o => ({ ...o, prop: v }))}
            />
            <Toggler
              value={statefullTestObject.next?.prop}
              onChange={v =>
                setStatefullTestObject(o => ({
                  ...o,
                  next: { ...o.next, prop: v },
                }))
              }
            />
          </div>
          <div className={cx(grow, expandHeight, flex, flexColumn)}>
            <Level value={statefullTestObject.prop}>
              <Level value={statefullTestObject.next?.prop} />
            </Level>
          </div>
        </div>
      </div>
      <div className={cx(flex, flexColumn, grow)}>
        NESTED
        <div className={cx(flex, flexRow, expandBoth)}>
          <div className={expandHeight}>
            <Toggler
              value={nestedTestObject.prop}
              onChange={v => setNestedTestObject(o => ({ ...o, prop: v }))}
            />
            <Toggler
              value={nestedTestObject.next?.prop}
              onChange={v =>
                setNestedTestObject(o => ({
                  ...o,
                  next: { ...o.next, prop: v },
                }))
              }
            />
            <Toggler
              value={nestedTestObject.next?.next?.prop}
              onChange={v =>
                setNestedTestObject(o => ({
                  ...o,
                  next: {
                    ...(o.next || { prop: false }),
                    next: { ...o.next?.next, prop: v },
                  },
                }))
              }
            />
            <Toggler
              value={nestedTestObject.next?.next?.next?.prop}
              onChange={v =>
                setNestedTestObject(o => ({
                  ...o,
                  next: {
                    ...(o.next || { prop: false }),
                    next: {
                      ...(o.next?.next || { prop: false }),
                      next: { ...o.next?.next?.next, prop: v },
                    },
                  },
                }))
              }
            />
          </div>
          <div className={cx(grow, expandHeight, flex, flexColumn)}>
            <Nested value={nestedTestObject} />
          </div>
        </div>
      </div>
    </div>
  );
}
