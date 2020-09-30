import * as React from 'react';
import { IScript } from 'wegas-ts-api/typings/WegasEntities';
import { ScriptContext } from '../../Contexts/ScriptContext';
import { useScript } from '../../Hooks/useScript';
import {
  registerComponent,
  pageComponentFactory,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { schemaProps } from '../tools/schemaProps';

interface ForEachProps extends WegasComponentProps {
  getItemsFn?: IScript;
  exposeAs: string;
}

function ForEach({ getItemsFn, exposeAs, children }: ForEachProps) {
  const { identifiers } = React.useContext(ScriptContext);

  const items = useScript<any[]>(getItemsFn);

  return (
    <>
      {items &&
        items.map(item => {
          return (
            /* For each item, create a new script context.
             * Such context expose current item as "exposeAs" name.
             */
            <ScriptContext.Provider
              value={{
                identifiers: { ...identifiers, [exposeAs]: item },
              }}
              key={JSON.stringify(item)}
            >
              {children}
            </ScriptContext.Provider>
          );
        })}
    </>
  );
}

registerComponent(
  pageComponentFactory({
    component: ForEach,
    componentType: 'Programmatic',
    name: 'For each',
    icon: 'code',
    schema: {
      getItemsFn: schemaProps.script('Items', false),
      exposeAs: schemaProps.string('Expose as', false, 'item'),
    },
    allowedVariables: ['TextDescriptor'],
    getComputedPropsFromVariable: () => ({ exposeAs: 'item' }),
  }),
);
