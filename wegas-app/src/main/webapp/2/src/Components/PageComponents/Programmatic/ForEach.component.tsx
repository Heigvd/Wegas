import * as React from 'react';
import { IScript } from 'wegas-ts-api/typings/WegasEntities';
import { pageCTX } from '../../../Editor/Components/Page/PageEditor';
import { ScriptCTX } from '../../Contexts/ScriptContext';
import { useScript } from '../../Hooks/useScript';
import {
  FlexListProps,
  FlexList,
  flexListSchema,
} from '../../Layouts/FlexList';
import {
  registerComponent,
  pageComponentFactory,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { schemaProps } from '../tools/schemaProps';

interface ForEachProps extends WegasComponentProps, FlexListProps {
  getItemsFn?: IScript;
  exposeAs: string;
}

function ForEach({
  getItemsFn,
  exposeAs,
  children,
  ...flexListProps
}: ForEachProps) {
  const { identifiers } = React.useContext(ScriptCTX);
  const { editMode } = React.useContext(pageCTX);
  let items = useScript<object[]>(getItemsFn);

  if (editMode) {
    items = items == null || items.length === 0 ? undefined : [items[0]];
  }

  return (
    <FlexList {...flexListProps}>
      {items == null
        ? children
        : items.map(item => {
            return (
              /* For each item, create a new script context.
               * Such context expose current item as "exposeAs" name.
               */
              <ScriptCTX.Provider
                value={{
                  identifiers: { ...identifiers, [exposeAs]: item },
                }}
                key={JSON.stringify(item)}
              >
                {children}
              </ScriptCTX.Provider>
            );
          })}
    </FlexList>
  );
}

registerComponent(
  pageComponentFactory({
    component: ForEach,
    componentType: 'Programmatic',
    containerType: 'FOREACH',
    name: 'For each',
    icon: 'code',
    schema: {
      ...flexListSchema,
      getItemsFn: schemaProps.customScript({
        label: 'Items',
        returnType: ['Readonly<object[]>'],
      }),
      exposeAs: schemaProps.string({
        label: 'Expose as',
        required: true,
        value: 'item',
      }),
    },
    allowedVariables: ['TextDescriptor'],
    getComputedPropsFromVariable: () => ({ exposeAs: 'item' }),
  }),
);
