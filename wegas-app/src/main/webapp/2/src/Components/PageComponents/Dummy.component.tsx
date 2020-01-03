import * as React from 'react';
import { registerComponent, pageComponentFactory } from './componentFactory';
import { schemaProps } from './schemaProps';
import { wlog } from '../../Helper/wegaslog';
import { omit } from 'lodash';

interface DummyProps {
  test1?: IScript;
  // test2?: IScript;
}

const Dummy: React.FunctionComponent<DummyProps> = (props: DummyProps) => {
  const dummyProps = omit(props, ['children', 'path']);
  wlog(dummyProps);
  return (
    <div>
      {Object.keys(dummyProps).map(k => (
        <div key={k}>{JSON.stringify(dummyProps[k as keyof DummyProps])}</div>
      ))}
    </div>
  );
};

registerComponent(
  pageComponentFactory(
    Dummy,
    'Dummy',
    'question',
    {
      test1: schemaProps.script('Test1', false, ["ISNumberInstance","ISStringDescriptor"], 'NONE'),
      // test2: schemaProps.script('Test2', false, undefined, 'SET'),
    },
    [],
    () => ({}),
  ),
);
