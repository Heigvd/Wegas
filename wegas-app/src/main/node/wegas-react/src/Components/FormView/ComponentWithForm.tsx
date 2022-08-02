import { css, cx } from '@emotion/css';
import * as React from 'react';
import { ReflexContainer, ReflexElement, ReflexSplitter } from 'react-reflex';
import { autoScroll, flex, grow, halfOpacity } from '../../css/classes';
import { createStoreConnector } from '../../data/connectStore';
import { Edition } from '../../data/Reducer/editingState';
import {
  editingStoreFactory,
  useEditingStore,
} from '../../data/Stores/editingStore';
import { store, StoreDispatch } from '../../data/Stores/store';
import { fullscreenCTX } from '../Contexts/FullscreenContext';
import { getEntity, VariableForm } from '../EntityEditor';
import { shallowDifferent } from '../Hooks/storeHookFactory';
import { schemaProps } from '../PageComponents/tools/schemaProps';

const growBig = css({
  flex: '30 1 auto',
});

interface ComponentWithFormChildrenProps {
  localState: Readonly<Edition> | undefined;
  localDispatch: StoreDispatch;
}

export interface ComponentWithFormFlexValues {
  main?: number;
  form?: number;
}

const defaultFlexValues: ComponentWithFormFlexValues = {
  main: 4,
  form: 4,
};

export const flexValuesSchema = schemaProps.hashlist({
  label: 'Flex values',
  choices: [
    {
      label: 'Main pannel flex number',
      value: {
        prop: 'main',
        schema: schemaProps.number({
          label: 'Main pannel flex number',
          value: defaultFlexValues.main,
        }),
      },
    },
    {
      label: 'Second pannel flex number',
      value: {
        prop: 'form',
        schema: schemaProps.number({
          label: 'Form flex number',
          value: defaultFlexValues.form,
        }),
      },
    },
  ],
});

interface ComponentWithFormProps extends DisabledReadonly {
  children: (
    props: ComponentWithFormChildrenProps,
  ) => React.ReactElement | null;
  flexValues?: ComponentWithFormFlexValues;
}

export function ComponentWithForm({
  children,
  readOnly,
  disabled,
  flexValues = defaultFlexValues,
}: ComponentWithFormProps) {
  const { fullscreen } = React.useContext(fullscreenCTX);

  const { useStore: useLocalStore, getDispatch: getLocalDispatch } =
    React.useMemo(() => createStoreConnector(editingStoreFactory()), []);

  const globalState = useEditingStore(state => state.editing);

  const fullscreenFSM = globalState?.type === 'VariableFSM' && fullscreen;

  const localState = (fullscreenFSM ? useEditingStore : useLocalStore)(
    s => s,
    shallowDifferent,
  );
  const localDispatch = fullscreenFSM ? store.dispatch : getLocalDispatch();
  const localEntity = getEntity(localState.editing);

  return (
    <ReflexContainer
      className={cx(flex, grow, { [halfOpacity]: disabled })}
      orientation="vertical"
    >
      <ReflexElement
        flex={
          flexValues.main == null ? defaultFlexValues.main : flexValues.main
        }
        className={cx(flex, growBig, autoScroll)}
      >
        {children({
          localState: localState.editing,
          localDispatch,
        })}
      </ReflexElement>
      {localState.editing && localEntity && <ReflexSplitter />}
      {localState.editing && localEntity && (
        <ReflexElement
          flex={
            flexValues.form == null ? defaultFlexValues.form : flexValues.form
          }
        >
          <VariableForm
            editing={localState.editing}
            entity={getEntity(localState.editing)}
            events={localState.events}
            readOnly={readOnly}
            localDispatch={localDispatch}
          />
        </ReflexElement>
      )}
    </ReflexContainer>
  );
}
