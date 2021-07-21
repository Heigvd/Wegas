import { css, cx } from 'emotion';
import * as React from 'react';
import {
  INumberDescriptor,
  INumberInstance,
  IScript,
  ITextDescriptor,
  ITextInstance,
  SPeerReviewDescriptor,
} from 'wegas-ts-api';
import {
  defaultMarginTop,
  flex,
  flexColumn,
  grow,
  itemBottom,
} from '../../../css/classes';
import { entityIs, scriptableEntityIs } from '../../../data/entities';
import { liveEdition } from '../../../data/Reducer/gameModel';
import { submitToReview } from '../../../data/Reducer/VariableDescriptorReducer';
import {
  asyncRunLoadedScript,
  getAll,
} from '../../../data/Reducer/VariableInstanceReducer';
import { instantiate } from '../../../data/scriptable';
import { GameModel, Player, Team } from '../../../data/selectors';
import { findByName } from '../../../data/selectors/VariableDescriptorSelector';
import { store, useStore } from '../../../data/Stores/store';
import {
  createTranslatableContent,
  createTranslation,
} from '../../../Editor/Components/FormView/translatable';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { peerReviewTranslations } from '../../../i18n/peerReview/peerReview';
import { languagesCTX } from '../../Contexts/LanguagesProvider';
import { deepDifferent } from '../../Hooks/storeHookFactory';
import { useScript } from '../../Hooks/useScript';
import HTMLEditor from '../../HTML/HTMLEditor';
import { Button } from '../../Inputs/Buttons/Button';
import { NumberInput } from '../../Inputs/Number/NumberInput';
import { NumberSlider } from '../../Inputs/Number/NumberSlider';
import { useOkCancelModal } from '../../Modal';
import { HTMLText } from '../../Outputs/HTMLText';
import { popupDispatch, addPopup } from '../../PopupManager';
import { themeVar } from '../../Theme/ThemeVars';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { schemaProps } from '../tools/schemaProps';
import u from 'immer';
import { useLiveUpdate } from '../../../API/websocket';

const submissionStyle = css({
  border: '1px solid ' + themeVar.colors.DisabledColor,
  borderRadius: themeVar.dimensions.BorderRadius,
  padding: '1em',
});
interface PeerReviewVariableEditorProps extends WegasComponentProps {
  peerReview?: IScript;
  displaySubmit?: boolean;
}

export default function PeerReviewVariableEditor({
  peerReview,
  displaySubmit,
  context,
  className,
  style,
  id,
  options,
}: PeerReviewVariableEditorProps) {
  const lastVal = React.useRef<string | number | undefined>();
  const timer = React.useRef<NodeJS.Timeout | null>();
  const { lang } = React.useContext(languagesCTX);
  const i18nValues = useInternalTranslate(peerReviewTranslations);
  const sPR = useScript<SPeerReviewDescriptor | undefined>(peerReview, context);
  const reviewState = useStore(() =>
    sPR?.getInstance(Player.self()).getReviewState(),
  );
  const variableToReview = instantiate(
    findByName<ITextDescriptor | INumberDescriptor>(sPR?.getToReviewName()),
  );

  const waitingState = useLiveUpdate(
    variableToReview?.getInstance(Player.self()).getId(),
  );

  const storeValue = useStore(
    () => variableToReview?.getValue(Player.self()),
    deepDifferent,
  );

  const [value, setValue] =
    React.useState<string | number | undefined>(storeValue);

  React.useEffect(() => {
    setValue(storeValue);
  }, [storeValue]);

  const sendValue = React.useCallback(
    (val: string | number | undefined) => {
      lastVal.current = val;
      if (timer.current != null) {
        clearTimeout(timer.current);
      }
      timer.current = setTimeout(() => {
        asyncRunLoadedScript(
          GameModel.selectCurrent().id!,
          `Variable.find(gameModel,"${variableToReview?.getName()}").setValue(self,${
            val == null
              ? ''
              : typeof val === 'string'
              ? JSON.stringify(val)
              : val
          })`,
          Player.selectCurrent(),
          undefined,
        )
          .catch(e => {
            e.json().then((error: WegasErrorMessage) => {
              popupDispatch(
                addPopup(
                  error.message + new Date().getTime(),
                  createTranslatableContent(lang, error.message),
                  5000,
                ),
              );
            });
          })
          .finally(() => {
            timer.current = null;
          });
      }, 500);
    },
    [lang, variableToReview],
  );

  const onChange = React.useCallback(
    (val: string | number | undefined) => {
      setValue(val);
      if (variableToReview != null && val != null) {
        store.dispatch(
          liveEdition(
            `private-Team-${Team.selectCurrent().id!}`,
            u((variable: INumberInstance | ITextInstance) => {
              if (entityIs(variable, 'NumberInstance')) {
                variable.value = Number(val);
              } else if (variable.trValue != null) {
                variable.trValue.translations[lang] = createTranslation(
                  lang,
                  String(val),
                );
              }
              return variable;
            })(variableToReview.getInstance(Player.self()).getEntity()),
          ),
        );
      }

      // setWaitingState(true);
      sendValue(val);
    },
    [lang, sendValue, variableToReview],
  );

  const { showModal, OkCancelModal } = useOkCancelModal();

  if (sPR == null) {
    return (
      <pre className={className} style={style} id={id}>
        Peer Descriptor not found
      </pre>
    );
  } else {
    if (variableToReview == null) {
      return (
        <pre className={className} style={style} id={id}>
          No variable to review found
        </pre>
      );
    } else {
      if (reviewState !== 'NOT_STARTED') {
        return (
          <div className={grow}>
            <h3>Your submission:</h3>
            <HTMLText text={String(value)} className={submissionStyle} />
          </div>
        );
      } else {
        let inputComponent = null;
        if (scriptableEntityIs(variableToReview, 'TextDescriptor')) {
          inputComponent = (
            <HTMLEditor
              id={id}
              value={String(value)}
              onChange={onChange}
              disabled={options.disabled || options.locked || waitingState}
              readOnly={options.readOnly}
              className={className}
              style={style}
            />
          );
        } else {
          const minValue = variableToReview.getMinValue();
          const maxValue = variableToReview.getMaxValue();

          if (minValue != null && maxValue != null) {
            inputComponent = (
              <NumberSlider
                className={className}
                style={style}
                id={id}
                value={Number(value)}
                onChange={(v, i) => {
                  if (i === 'DragEnd') {
                    onChange(v);
                  }
                }}
                min={minValue}
                max={maxValue}
                disabled={options.disabled || options.locked}
                readOnly={options.readOnly}
                displayValues="NumberInput"
              />
            );
          } else {
            inputComponent = (
              <NumberInput
                value={Number(value)}
                onChange={onChange}
                className={className}
                style={style}
                id={id}
                disabled={options.disabled || options.locked}
                readOnly={options.readOnly}
              />
            );
          }
        }

        return (
          <div className={cx(flex, flexColumn, itemBottom)}>
            {inputComponent}
            {displaySubmit && (
              <Button
                className={defaultMarginTop}
                label={i18nValues.global.submit}
                onClick={showModal}
                disabled={waitingState || options.disabled || options.locked}
              />
            )}
            <OkCancelModal
              onOk={() => {
                store.dispatch(submitToReview(sPR.getId()!));
                store.dispatch(getAll());
              }}
            >
              <p>{i18nValues.global.confirmation.info}</p>
              <p>{i18nValues.global.confirmation.question}</p>
            </OkCancelModal>
          </div>
        );
      }
    }
  }
}
registerComponent(
  pageComponentFactory({
    component: PeerReviewVariableEditor,
    componentType: 'Advanced',
    name: 'Peer Review variable editor',
    icon: 'pen-alt',
    schema: {
      peerReview: schemaProps.scriptVariable({
        label: 'Peer review',
        required: true,
        returnType: ['SPeerReviewDescriptor'],
      }),
      displaySubmit: schemaProps.boolean({
        label: 'Display the submit button',
      }),
    },
    allowedVariables: ['PeerReviewDescriptor'],
    getComputedPropsFromVariable: v => ({
      list: v != null ? createFindVariableScript(v) : undefined,
      displaySubmit: true,
    }),
  }),
);
