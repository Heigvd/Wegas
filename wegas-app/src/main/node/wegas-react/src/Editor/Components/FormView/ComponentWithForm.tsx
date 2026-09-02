import { css, cx } from '@emotion/css';
import * as React from 'react';
import { ReflexContainer, ReflexElement, ReflexSplitter } from 'react-reflex';
import { fullscreenCTX } from '../../../Components/Contexts/FullscreenContext';
import { IconButton } from '../../../Components/Inputs/Buttons/IconButton';
import { schemaProps } from '../../../Components/PageComponents/tools/schemaProps';
import { autoScroll, flex, grow, halfOpacity } from '../../../css/classes';
import { Edition } from '../../../data/Reducer/editingState';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { EditingDispatch, useLocalEdition } from '../../../store/localEdition';
import { closeEditor, selectEdition } from '../../../store/slices/edition';
import { selectEditorEvents } from '../../../store/slices/editorEvents';
import { getEntity, VariableForm } from '../EntityEditor';

const growBig = css({
  flex: '30 1 auto',
});

export interface ComponentWithFormChildrenProps {
  localState: Readonly<Edition> | undefined;
  localDispatch: EditingDispatch;
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

  const appDispatch = useAppDispatch();
  const globalEdition = useAppSelector(selectEdition);
  const events = useAppSelector(selectEditorEvents);
  const local = useLocalEdition();

  // Fullscreen drives the global edition
  const editing = fullscreen ? globalEdition : local.edition;
  const scopedDispatch: EditingDispatch = fullscreen
    ? appDispatch
    : local.dispatch;
  const localEntity = getEntity(editing);

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
          localState: editing,
          localDispatch: scopedDispatch,
        })}
      </ReflexElement>
      {editing && localEntity && <ReflexSplitter />}
      {editing && localEntity && (
        <>
          <ReflexElement
            flex={
              flexValues.form == null ? defaultFlexValues.form : flexValues.form
            }
          >
            <IconButton
              icon="times"
              onClick={() => {
                scopedDispatch(closeEditor());
              }}
            />
            <VariableForm
              editing={editing}
              entity={localEntity}
              events={events}
              readOnly={readOnly}
              localDispatch={scopedDispatch}
            />
          </ReflexElement>
        </>
      )}
    </ReflexContainer>
  );
}
