import { css, cx } from 'emotion';
import { omit } from 'lodash-es';
import * as React from 'react';
import {
  IEvaluationDescriptor,
  IEvaluationInstance,
  IPeerReviewInstance,
  IReview,
  IScript,
  ScriptableEntity,
  SPeerReviewDescriptor,
  SReview,
} from 'wegas-ts-api';
import {
  autoScroll,
  expandWidth,
  flex,
  flexColumn,
  flexRow,
  grow,
  itemCenter,
  justifyCenter,
} from '../../../css/classes';
import { scriptableEntityIs } from '../../../data/entities';
import { liveEdition } from '../../../data/Reducer/gameModel';
import {
  saveReview,
  submitReview,
} from '../../../data/Reducer/VariableDescriptorReducer';
import { instantiate } from '../../../data/scriptable';
import { Player, Team } from '../../../data/selectors';
import { store, useStore } from '../../../data/Stores/store';
import { Selector } from '../../../Editor/Components/FormView/Select';
import { translate } from '../../../Editor/Components/FormView/translatable';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { internalTranslate } from '../../../i18n/internalTranslator';
import { PeerReviewTranslations } from '../../../i18n/peerReview/definitions';
import { peerReviewTranslations } from '../../../i18n/peerReview/peerReview';
import { languagesCTX } from '../../Contexts/LanguagesProvider';
import { useScript } from '../../Hooks/useScript';
import HTMLEditor from '../../HTMLEditor';
import { Button } from '../../Inputs/Buttons/Button';
import { NumberSlider } from '../../Inputs/Number/NumberSlider';
import { useOkCancelModal } from '../../Modal';
import {
  CustomPhasesProgressBar,
  PhaseComponentProps,
  SimpleInterPhaseComponent,
} from '../../Outputs/PhasesProgressBar';
import { themeVar } from '../../Style/ThemeVars';
import { Toolbar } from '../../Toolbar';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { schemaProps } from '../tools/schemaProps';

const prPhaseComponentStyle = css({
  minWidth: '120px',
  minHeight: '120px',
  borderRadius: '50%',
  borderStyle: 'solid',
  borderWidth: '5px',
  borderColor: themeVar.Common.colors.PrimaryColor,
  backgroundColor: themeVar.Common.colors.BackgroundColor,
  color: themeVar.Common.colors.DarkTextColor,
});

const prFinishedPhaseComponentStyle = css({
  backgroundColor: themeVar.Common.colors.HeaderColor,
});

const prActivePhaseComponentStyle = css({
  backgroundColor: themeVar.Common.colors.ActiveColor,
  color: themeVar.Common.colors.LightTextColor,
});

const phases = ['edition', 'reviewing', 'commenting', 'completed'];

function PRPHaseComponent({ value, phase }: PhaseComponentProps) {
  const { lang } = React.useContext(languagesCTX);
  const i18nValues = internalTranslate(peerReviewTranslations, lang);

  return (
    <div
      className={cx(flex, flexColumn, justifyCenter, prPhaseComponentStyle, {
        [prFinishedPhaseComponentStyle]: value > phase,
        [prActivePhaseComponentStyle]: value === phase,
      })}
    >
      {
        i18nValues.orchestrator.state[
          phases[phase] as keyof PeerReviewTranslations['orchestrator']['state']
        ].title
      }
    </div>
  );
}

const prTreeViewStyle = css({
  borderRight: 'solid 1px',
  paddingRight: '1em',
});

const reviewItemStyle = css({
  marginLeft: '40px',
  cursor: 'pointer',
  ':hover': {
    backgroundColor: themeVar.Common.colors.HoverColor,
  },
});

interface TreeViewReviewItemProps {
  label: string;
  onClick: () => void;
}

function TreeViewReviewItem({ label, onClick }: TreeViewReviewItemProps) {
  return (
    <div
      className={cx(flex, flexRow, itemCenter, reviewItemStyle)}
      onClick={onClick}
    >
      <Button icon="user-circle" />
      {label}
    </div>
  );
}

interface TreeViewReviewSelectorProps {
  label: string;
  itemLabel: string;
  reviews: SReview[];
  open: boolean;
  onCarretClick: () => void;
  onReviewClick: (review: SReview) => void;
}

function TreeViewReviewSelector({
  label,
  itemLabel,
  reviews,
  open,
  onCarretClick,
  onReviewClick,
}: TreeViewReviewSelectorProps) {
  return (
    <div className={cx(flex, flexColumn)}>
      <div className={cx(flex, flexRow)}>
        <Button
          icon={open ? 'caret-down' : 'caret-right'}
          onClick={onCarretClick}
        />
        <h3 className={cx(flex, flexRow)}>
          <Button icon="users" />
          {label}
        </h3>
      </div>

      {open &&
        reviews.map((r, i) => (
          <TreeViewReviewItem
            key={r.getId()}
            label={itemLabel + (i + 1)}
            onClick={() => onReviewClick(r)}
          />
        ))}
    </div>
  );
}

interface EvalutationEditorProps extends DisabledReadonly {
  iEvaluation: ScriptableEntity<IEvaluationInstance>;
  value: string | number | undefined | null;
  onChange: (value: string | number) => void;
}

function EvalutationEditor({
  iEvaluation,
  value,
  onChange,
  disabled,
  readOnly,
}: EvalutationEditorProps) {
  const { lang } = React.useContext(languagesCTX);

  const dEvaluation = instantiate(
    ((iEvaluation.getEntity() as unknown) as {
      descriptor: IEvaluationDescriptor;
    }).descriptor,
  );

  const onChangeNotify = React.useCallback(
    (val: string | number) => {
      store.dispatch(
        liveEdition(`private-Team-${Team.selectCurrent().id!}`, {
          ...iEvaluation.getEntity(),
          value: val,
        }),
      );
      onChange(val);
    },
    [iEvaluation, onChange],
  );

  let min = 1;
  let max = 5;
  if (scriptableEntityIs(dEvaluation, 'GradeDescriptor')) {
    min = dEvaluation.getMinValue() || 1;
    max = dEvaluation.getMaxValue() || 5;
  }
  const numberValue =
    value == null ? min : value < min ? min : value > max ? max : Number(value);

  return (
    <div className={cx(flex, flexColumn)}>
      <h3>{translate(dEvaluation?.getLabel(), lang)}</h3>
      {scriptableEntityIs(iEvaluation, 'TextEvaluationInstance') ? (
        <HTMLEditor
          value={value == null ? undefined : String(value)}
          onChange={onChangeNotify}
          disabled={disabled}
          readOnly={readOnly}
        />
      ) : scriptableEntityIs(iEvaluation, 'GradeInstance') ? (
        <NumberSlider
          value={numberValue}
          onChange={onChangeNotify}
          min={min}
          max={max}
          steps={max - min}
          displayValues="NumberInput"
          disabled={disabled}
          readOnly={readOnly}
        />
      ) : scriptableEntityIs(dEvaluation, 'CategorizedEvaluationDescriptor') ? (
        <Selector
          value={String(value)}
          onChange={e => onChangeNotify(e.target.value)}
          choices={dEvaluation.getCategories().map(c => ({
            value: translate(c.getLabel(), lang),
            label: translate(c.getLabel(), lang),
          }))}
          disabled={disabled}
          readOnly={readOnly}
        />
      ) : null}
    </div>
  );
}

interface EvalutationsEditorProps extends DisabledReadonly {
  review: IReview;
  phase: 'feedback' | 'comments';
  displaySubmit?: boolean;
  onRefresh: () => void;
}

function EvalutationsEditor({
  review,
  phase,
  displaySubmit,
  onRefresh,
  disabled,
  readOnly,
}: EvalutationsEditorProps) {
  const evaluations = review[phase];
  const timer = React.useRef<NodeJS.Timeout | null>();
  const modifiedReview = React.useRef(review);
  const [waitingState, setWaitingState] = React.useState(false);
  const [values, setValues] = React.useState<{
    [id: string]: string | number | undefined | null;
  }>(
    evaluations.reduce(
      (o, e) => ({ ...o, [e.id!]: instantiate(e).getValue() }),
      {},
    ),
  );

  const { lang } = React.useContext(languagesCTX);
  const i18nValues = internalTranslate(peerReviewTranslations, lang);

  const { showModal, OkCancelModal } = useOkCancelModal();

  const sendValue = React.useCallback(
    (id: number, val: string | number | undefined) => {
      if (timer.current != null) {
        clearTimeout(timer.current);
      }

      const newEvalutations = evaluations.map(e =>
        e.id === id ? { ...e, value: val } : e,
      );

      modifiedReview.current = {
        ...(omit(modifiedReview.current, [
          'createdTime',
          'initialReviewState',
        ]) as IReview),
        [phase]: newEvalutations,
      };

      timer.current = setTimeout(() => {
        store.dispatch(saveReview(modifiedReview.current));
        setWaitingState(false);
      }, 500);
    },
    [evaluations, phase],
  );

  const onChange = React.useCallback(
    (id: number, val: string | number | undefined) => {
      setWaitingState(true);
      setValues(o => ({ ...o, [id]: val }));
      sendValue(id, val);
    },
    [sendValue],
  );

  return (
    <div
      className={cx(
        flex,
        flexColumn,
        css({
          border: 'solid',
          margin: '1em',
          padding: '1em',
          overflowX: 'auto',
        }),
      )}
    >
      {evaluations.map(e => (
        <EvalutationEditor
          key={e.id}
          iEvaluation={instantiate(e)}
          value={values[e.id!]}
          onChange={val => onChange(e.id!, val)}
          disabled={disabled}
          readOnly={readOnly}
        />
      ))}
      {displaySubmit && (
        <Button
          label={i18nValues.global.submit}
          disabled={waitingState || disabled}
          onClick={showModal}
        />
      )}
      <OkCancelModal
        onOk={() => {
          store.dispatch(submitReview(modifiedReview.current, onRefresh));

          // PeerReviewDescriptorAPI.submitReviewUnmanaged(GameModel.selectCurrent().id!,Player.selectCurrent().id!,modifiedReview.current).then(e=>{
          //   const newReview =
          // })
        }}
      >
        <p>{i18nValues.global.confirmation.info}</p>
        <p>{i18nValues.global.confirmation.question}</p>
      </OkCancelModal>
    </div>
  );
}

interface EvalutationDisplayProps {
  iEvaluation: ScriptableEntity<IEvaluationInstance>;
  value: string | number | undefined | null;
}

function EvalutationDisplay({ iEvaluation, value }: EvalutationDisplayProps) {
  const { lang } = React.useContext(languagesCTX);

  const dEvaluation = instantiate(
    ((iEvaluation.getEntity() as unknown) as {
      descriptor: IEvaluationDescriptor;
    }).descriptor,
  );

  return (
    <div className={cx(flex, flexColumn)}>
      <h3>{translate(dEvaluation?.getLabel(), lang)}</h3>
      {value}
    </div>
  );
}

interface EvalutationsDisplayProps {
  evaluations: ScriptableEntity<IEvaluationInstance>[];
}

function EvalutationsDisplay({ evaluations }: EvalutationsDisplayProps) {
  const values: {
    [id: string]: string | number | undefined | null;
  } = evaluations.reduce((o, e) => ({ ...o, [e.getId()!]: e.getValue() }), {});

  return (
    <div
      className={cx(
        flex,
        flexColumn,
        css({
          border: 'solid',
          margin: '1em',
          padding: '1em',
          overflowX: 'auto',
        }),
      )}
    >
      {evaluations.map(e => (
        <EvalutationDisplay
          key={e.getId()}
          iEvaluation={e}
          value={values[e.getId()!]}
        />
      ))}
    </div>
  );
}

interface ReviewEditorProps extends DisabledReadonly {
  label: string;
  review: ReviewPhase;
  reviewState: IPeerReviewInstance['reviewState'];
  displaySubmit?: boolean;
  onRefresh: () => void;
}

function ReviewEditor({
  label,
  review,
  reviewState,
  displaySubmit,
  disabled,
  readOnly,
  onRefresh,
}: ReviewEditorProps) {
  const rev = review.review.getEntity();

  return (
    <div className={cx(flex, flexColumn)}>
      <h2>{label}</h2>
      <div>
        {reviewState === 'DISPATCHED' && rev.reviewState === 'DISPATCHED' ? (
          <EvalutationsEditor
            review={rev}
            phase="feedback"
            displaySubmit={displaySubmit}
            onRefresh={onRefresh}
            disabled={disabled}
            readOnly={readOnly}
          />
        ) : (
          <EvalutationsDisplay evaluations={review.review.getFeedback()} />
        )}
      </div>
      {review.phase === 'review' && (
        <div>
          {reviewState === 'NOTIFIED' && rev.reviewState === 'NOTIFIED' ? (
            <EvalutationsEditor
              review={rev}
              phase="comments"
              displaySubmit={displaySubmit}
              onRefresh={onRefresh}
              disabled={disabled}
              readOnly={readOnly}
            />
          ) : (
            <EvalutationsDisplay evaluations={review.review.getComments()} />
          )}
        </div>
      )}
    </div>
  );
}

interface ReviewPhase {
  review: SReview;
  phase: 'submission' | 'review';
}

interface PeerReviewTreeViewDisplayProps extends WegasComponentProps {
  peerReview?: IScript;
  displaySubmit?: boolean;
}

export default function PeerReviewTreeViewDisplay({
  peerReview,
  displaySubmit,
  context,
  className,
  style,
  id,
  options,
}: PeerReviewTreeViewDisplayProps) {
  const { lang } = React.useContext(languagesCTX);
  const i18nValues = internalTranslate(peerReviewTranslations, lang);

  const sPR = useScript<SPeerReviewDescriptor | undefined>(peerReview, context);
  const sPRinstance = useStore(() => sPR?.getInstance(Player.self()));

  const [carretState, setCarretState] = React.useState({
    reviews: false,
    comments: false,
  });
  const [selectedReview, setSelectedReview] = React.useState<
    ReviewPhase | undefined
  >();

  if (sPR == null || sPRinstance == null) {
    return (
      <pre className={className} style={style} id={id}>
        Peer Descriptor not found
      </pre>
    );
  } else {
    let currentPhase = 0;

    switch (sPRinstance.getReviewState()) {
      case 'NOT_STARTED':
        currentPhase = 0;
        break;
      case 'DISPATCHED':
        currentPhase = 1;
        break;
      case 'NOTIFIED':
        currentPhase = 2;
        break;
      case 'COMPLETED':
        currentPhase = 3;
        break;
      default:
        currentPhase = 0;
    }

    const reviewState = sPRinstance.getReviewState();

    return (
      <Toolbar className={grow}>
        <Toolbar.Content className={cx(flex, flexColumn)}>
          <CustomPhasesProgressBar
            value={currentPhase}
            phaseMin={0}
            phaseMax={3}
            PhaseComponent={PRPHaseComponent}
            InterPhaseComponent={SimpleInterPhaseComponent}
          />
        </Toolbar.Content>
        {currentPhase === 0 ? (
          <h2>{i18nValues.tabview.emptyness_message}</h2>
        ) : (
          <Toolbar.Header>
            <div className={cx(flex, flexRow, expandWidth)}>
              <div className={prTreeViewStyle}>
                {(reviewState === 'DISPATCHED' ||
                  reviewState === 'NOTIFIED' ||
                  reviewState === 'COMPLETED') && (
                  <TreeViewReviewSelector
                    label={i18nValues.tabview.toReviewTitle}
                    itemLabel={`${i18nValues.tabview.toReview} ${i18nValues.editor.number}`}
                    reviews={sPRinstance.getToReview()}
                    open={carretState.reviews}
                    onCarretClick={() =>
                      setCarretState(o => ({
                        ...o,
                        reviews: !o.reviews,
                      }))
                    }
                    onReviewClick={r =>
                      setSelectedReview(o =>
                        o?.review.getId() !== r.getId()
                          ? { review: r, phase: 'submission' }
                          : undefined,
                      )
                    }
                  />
                )}
                {(reviewState === 'NOTIFIED' ||
                  reviewState === 'COMPLETED') && (
                  <TreeViewReviewSelector
                    label={i18nValues.tabview.toCommentTitle}
                    itemLabel={`${i18nValues.tabview.toComment} ${i18nValues.editor.number}`}
                    reviews={sPRinstance.getReviewed()}
                    open={carretState.reviews}
                    onCarretClick={() =>
                      setCarretState(o => ({
                        ...o,
                        reviews: !o.reviews,
                      }))
                    }
                    onReviewClick={r =>
                      setSelectedReview(o =>
                        o?.review.getId() !== r.getId()
                          ? { review: r, phase: 'review' }
                          : undefined,
                      )
                    }
                  />
                )}
              </div>
              <div className={cx(/*reviewContainerStyle,*/ autoScroll)}>
                {selectedReview && (
                  <ReviewEditor
                    label={`${i18nValues.tabview.toComment}`}
                    review={selectedReview}
                    reviewState={reviewState}
                    displaySubmit={displaySubmit}
                    onRefresh={() => setSelectedReview(undefined)}
                    disabled={options.disabled || options.locked}
                    readOnly={options.readOnly}
                  />
                )}
              </div>
            </div>
          </Toolbar.Header>
        )}
      </Toolbar>
    );
  }
}

registerComponent(
  pageComponentFactory({
    component: PeerReviewTreeViewDisplay,
    componentType: 'Advanced',
    name: 'Peer Review treeview display',
    icon: 'user-edit',
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
