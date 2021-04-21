import { css, cx } from 'emotion';
import * as React from 'react';
import {
  ICategorizedEvaluationDescriptor,
  ICategorizedEvaluationInstance,
  IEvaluationDescriptor,
  IEvaluationInstance,
  IPeerReviewInstance,
  IReview,
  IScript,
  ScriptableEntity,
  SPeerReviewDescriptor,
  SReview,
} from 'wegas-ts-api';
import { PeerReviewDescriptorAPI } from '../../../API/peerReview.api';
import {
  autoScroll,
  defaultMarginBottom,
  defaultMarginLeft,
  defaultMarginTop,
  expandWidth,
  flex,
  flexColumn,
  flexRow,
  grow,
  itemCenter,
  itemStretch,
  justifyCenter,
} from '../../../css/classes';
import { entityIs, scriptableEntityIs } from '../../../data/entities';
import { liveEdition } from '../../../data/Reducer/gameModel';
import {
  saveReview,
  submitReview,
} from '../../../data/Reducer/VariableDescriptorReducer';
import { instantiate } from '../../../data/scriptable';
import { GameModel, Player, Team } from '../../../data/selectors';
import { store, useStore } from '../../../data/Stores/store';
import { Selector } from '../../../Editor/Components/FormView/Select';
import { translate } from '../../../Editor/Components/FormView/translatable';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import {
  internalTranslate,
  useInternalTranslate,
} from '../../../i18n/internalTranslator';
import { PeerReviewTranslations } from '../../../i18n/peerReview/definitions';
import { peerReviewTranslations } from '../../../i18n/peerReview/peerReview';
import { languagesCTX } from '../../Contexts/LanguagesProvider';
import { useScript } from '../../Hooks/useScript';
import HTMLEditor from '../../HTMLEditor';
import { Button } from '../../Inputs/Buttons/Button';
import { NumberSlider } from '../../Inputs/Number/NumberSlider';
import { useOkCancelModal } from '../../Modal';
import { HTMLText } from '../../Outputs/HTMLText';
import {
  CustomPhasesProgressBar,
  PhaseComponentProps,
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
  padding: '10px',
  borderRadius: themeVar.Common.dimensions.BorderRadius,
  borderStyle: 'solid',
  borderWidth: '3px',
  borderColor: themeVar.Common.colors.PrimaryColor,
  backgroundColor: themeVar.Common.colors.BackgroundColor,
  color: themeVar.Common.colors.PrimaryColor,
  fontWeight: 500,
});

const prFinishedPhaseComponentStyle = css({
  borderColor: themeVar.Common.colors.DisabledColor,
  color: themeVar.Common.colors.DisabledColor,
});

const prActivePhaseComponentStyle = css({
  backgroundColor: themeVar.Common.colors.PrimaryColor,
  color: themeVar.Common.colors.LightTextColor,
});
const ToBeReviewedStyle = css({
  borderRadius: themeVar.Common.dimensions.BorderRadius,
  padding: '1em',
  overflow: 'auto',
  backgroundColor: themeVar.Common.colors.BackgroundColor,
  marginTop: '1em',
  color: 'initial',
  //boxShadow: '4px 0px 10px rgba(0, 0, 0, 0.25)',
});

const reviewContainerStyle = css({
  borderRadius: themeVar.Common.dimensions.BorderRadius,
  padding: '1.5em',
  overflowX: 'auto',
  backgroundColor: themeVar.Common.colors.HeaderColor,
  width: '80%',
  alignSelf: 'flex-start',
  marginTop: '1em',
  boxShadow: '4px 0px 10px rgba(0, 0, 0, 0.25)',
});
const reviewContainerUserStyle = css({
  borderRadius: themeVar.Common.dimensions.BorderRadius,
  padding: '1.5em',
  overflowX: 'auto',
  backgroundColor: themeVar.Common.colors.PrimaryColor,
  color: themeVar.Common.colors.LightTextColor,
  width: '80%',
  alignSelf: 'flex-end',
  marginTop: '1em',
  boxShadow: '4px 0px 10px rgba(0, 0, 0, 0.25)',
  'button.wegas-btn': {
    backgroundColor: themeVar.Common.colors.HeaderColor,
    color: themeVar.Common.colors.PrimaryColor,
  },
});

const selectedTreeviewItemStyle = css({
  backgroundColor: themeVar.Common.colors.HeaderColor,
});

const prPhasesJustifyStyle = css({
  div: {
    justifyContent: 'flex-start',
  },
});

const phases = ['edition', 'reviewing', 'commenting', 'completed'];

function PRPHaseComponent({ value, phase }: PhaseComponentProps) {
  const i18nValues = useInternalTranslate(peerReviewTranslations);
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

function PRInterPhasesComponent(_props: PhaseComponentProps) {
  return <Button icon="arrow-right" disabled className={'phasePathStyle '} />;
}

const prTreeViewStyle = css({
  padding: '1.5em',
  boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
  marginTop: '1em',
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
  onReviewClick: (review: SReview, index: number) => void;
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
        <div className={cx(flex, flexRow)}>
          <Button icon="users" className={css({ paddingTop: 0 })} />
          <strong>{label}</strong>
        </div>
      </div>

      {open &&
        reviews.map((r, i) => (
          <TreeViewReviewItem
            key={r.getId()}
            label={itemLabel + (i + 1)}
            onClick={() => onReviewClick(r, i)}
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
      if (iEvaluation.getJSONClassName() === 'TextEvaluationInstance') {
        store.dispatch(
          liveEdition(`private-Team-${Team.selectCurrent().id!}`, {
            ...iEvaluation.getEntity(),
            value: val,
          }),
        );
      }
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
          value={value == null ? undefined : value}
          onChange={e => onChangeNotify(e.target.value)}
          choices={dEvaluation.getCategories().map(c => ({
            value: c.getName(),
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
  const modifiedReview = React.useRef({
    ...review,
    [phase]: review[phase].map(f =>
      f['@class'] === 'GradeInstance' ? { ...f, value: 1 } : f,
    ),
  });
  const [waitingState, setWaitingState] = React.useState(false);
  const [values, setValues] = React.useState<{
    [id: string]: string | number | undefined | null;
  }>(
    evaluations.reduce(
      (o, e) => ({ ...o, [e.id!]: instantiate(e).getValue() }),
      {},
    ),
  );

  const i18nValues = useInternalTranslate(peerReviewTranslations);
  const { showModal, OkCancelModal } = useOkCancelModal();

  const sendValue = React.useCallback(
    (id: number, val: string | number | undefined) => {
      if (timer.current != null) {
        clearTimeout(timer.current);
      }

      const newEvalutations = modifiedReview.current[phase].map(e =>
        e.id === id ? { ...e, value: val } : e,
      );

      modifiedReview.current = {
        ...modifiedReview.current,
        [phase]: newEvalutations,
      };

      timer.current = setTimeout(() => {
        store.dispatch(saveReview(modifiedReview.current));
        setWaitingState(false);
      }, 500);
    },
    [phase],
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
    <div className={cx(flex, flexColumn)}>
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
          className={cx(defaultMarginTop, css({ alignSelf: 'flex-end' }))}
        />
      )}
      <OkCancelModal
        onOk={() => {
          store.dispatch(submitReview(modifiedReview.current, onRefresh));
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
}

function EvalutationDisplay({ iEvaluation }: EvalutationDisplayProps) {
  const { lang } = React.useContext(languagesCTX);

  const dEvaluation = instantiate(
    ((iEvaluation.getEntity() as unknown) as {
      descriptor: IEvaluationDescriptor;
    }).descriptor,
  );
  return (
    <div className={cx(flex, flexColumn)}>
      <h3>{translate(dEvaluation?.getLabel(), lang)}</h3>
      <HTMLText
        text={
          entityIs(iEvaluation, 'CategorizedEvaluationInstance')
            ? translate(
                (iEvaluation.getEntity() as ICategorizedEvaluationInstance & {
                  descriptor: ICategorizedEvaluationDescriptor;
                }).descriptor.categories.find(
                  i => i.name === iEvaluation.getValue(),
                )?.label,
                lang,
              )
            : String(iEvaluation.getEntity()['value'])
        }
      />
    </div>
  );
}

interface EvalutationsDisplayProps {
  evaluations: ScriptableEntity<IEvaluationInstance>[];
}

function EvalutationsDisplay({ evaluations }: EvalutationsDisplayProps) {
  return (
    <div className={cx(flex, flexColumn)}>
      {evaluations.map(e => (
        <EvalutationDisplay key={e.getId()} iEvaluation={e} />
      ))}
    </div>
  );
}

interface ReviewEditorProps extends DisabledReadonly {
  reviewState: ReviewState;
  reviewStatus: IPeerReviewInstance['reviewState'];
  displaySubmit?: boolean;
  onRefresh: () => void;
}

function ReviewEditor({
  reviewState,
  reviewStatus,
  displaySubmit,
  disabled,
  readOnly,
  onRefresh,
}: ReviewEditorProps) {
  const [given, setGiven] = React.useState<string | number>();
  const { lang } = React.useContext(languagesCTX);
  const i18nValues = internalTranslate(peerReviewTranslations, lang);

  const rev = reviewState.review.getEntity();

  React.useEffect(() => {
    let mounted = true;

    PeerReviewDescriptorAPI.getToReviewUnmanaged(
      GameModel.selectCurrent().id!,
      rev.parentId!,
      rev.id!,
      Player.selectCurrent().id!,
    ).then(toReview => {
      if (mounted) {
        setGiven(
          entityIs(toReview, 'NumberInstance')
            ? toReview.value
            : translate(toReview.trValue, lang),
        );
      }
    });

    return () => {
      mounted = false;
    };
  }, [lang, rev.id, rev.parentId]);

  const isReviewDispatched =
    reviewStatus === 'DISPATCHED' && rev.reviewState === 'DISPATCHED';
  const isReviewNotified =
    reviewStatus === 'NOTIFIED' && rev.reviewState === 'NOTIFIED';

  const feedbackLabel =
    reviewState.phase === 'reviews'
      ? isReviewDispatched
        ? i18nValues.editor.ask_your_feedback
        : i18nValues.editor.your_feedback
      : i18nValues.editor.reviewer_feedback;

  const commentLabel =
    reviewState.phase === 'comments'
      ? isReviewNotified
        ? i18nValues.editor.ask_comment
        : i18nValues.editor.comment
      : i18nValues.editor.author_comment;

  return (
    <div className={cx(flex, flexColumn, css({ padding: '1em' }))}>
      <div style={{ margin: '20px', border: 'solid 2px' }}>
        <i>{reviewState.review.getFeedback()[0].getValue()}</i>
      </div>
      <h2
        className={css({
          borderTop: '1px solid ' + themeVar.Common.colors.DisabledColor,
          marginTop: 0,
          paddingTop: '1em',
        })}
      >
        {`${
          reviewState.phase === 'reviews'
            ? i18nValues.tabview.toReview
            : i18nValues.tabview.toComment
        } ${i18nValues.editor.number}${reviewState.index + 1}`}
      </h2>
      <div
        className={cx({
          [reviewContainerStyle]: reviewState.phase === 'reviews',
          [reviewContainerUserStyle]: reviewState.phase === 'comments',
        })}
      >
        <h3>
          {reviewState.phase === 'reviews'
            ? i18nValues.editor.given_author
            : i18nValues.editor.given}
        </h3>
        <div className={ToBeReviewedStyle}>
          <HTMLText text={String(given)} />
        </div>
      </div>
      <div
        className={cx({
          [reviewContainerStyle]: reviewState.phase === 'comments',
          [reviewContainerUserStyle]: reviewState.phase === 'reviews',
        })}
      >
        <h3>{feedbackLabel}</h3>
        {isReviewDispatched ? (
          <EvalutationsEditor
            review={rev}
            phase="feedback"
            displaySubmit={displaySubmit}
            onRefresh={onRefresh}
            disabled={disabled}
            readOnly={readOnly}
          />
        ) : (
          <EvalutationsDisplay evaluations={reviewState.review.getFeedback()} />
        )}
      </div>
      {(reviewStatus === 'COMPLETED' ||
        (reviewState.phase === 'comments' && reviewStatus === 'NOTIFIED')) && (
        <div
          className={cx({
            [reviewContainerStyle]: reviewState.phase === 'reviews',
            [reviewContainerUserStyle]: reviewState.phase === 'comments',
          })}
        >
          <h3>{commentLabel}</h3>

          {reviewState.phase === 'comments' &&
          reviewStatus === 'NOTIFIED' &&
          rev.reviewState === 'NOTIFIED' ? (
            <EvalutationsEditor
              review={rev}
              phase="comments"
              displaySubmit={displaySubmit}
              onRefresh={onRefresh}
              disabled={disabled}
              readOnly={readOnly}
            />
          ) : (
            <EvalutationsDisplay
              evaluations={reviewState.review.getComments()}
            />
          )}
        </div>
      )}
    </div>
  );
}

interface ReviewState {
  review: SReview;
  phase: 'reviews' | 'comments';
  index: number;
}

interface CarretState {
  reviews: boolean;
  comments: boolean;
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
  const i18nValues = useInternalTranslate(peerReviewTranslations);
  const sPR = useScript<SPeerReviewDescriptor | undefined>(peerReview, context);
  const sPRinstance = useStore(() => sPR?.getInstance(Player.self()));

  const [carretState, setCarretState] = React.useState<CarretState>({
    reviews: false,
    comments: false,
  });
  const [selectedReview, setSelectedReview] = React.useState<
    ReviewState | undefined
  >();

  const onCarretClick = React.useCallback(
    (type: keyof CarretState) => () =>
      setCarretState(o => ({
        ...o,
        [type]: !o[type],
      })),
    [],
  );

  const onReviewClick = React.useCallback(
    (phase: ReviewState['phase']) => (review: SReview, index: number) =>
      setSelectedReview(o =>
        o?.review.getId() !== review.getId()
          ? { review, index, phase }
          : undefined,
      ),
    [],
  );

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
      <Toolbar>
        <Toolbar.Header className={cx(flex, flexColumn, defaultMarginLeft)}>
          <h1>{i18nValues.orchestrator.state.reviewing.title}</h1>
          <CustomPhasesProgressBar
            value={currentPhase}
            phaseMin={0}
            phaseMax={3}
            PhaseComponent={PRPHaseComponent}
            InterPhaseComponent={PRInterPhasesComponent}
            className={cx(prPhasesJustifyStyle, defaultMarginBottom)}
          />
        </Toolbar.Header>
        {currentPhase === 0 ? (
          <h2>{i18nValues.tabview.emptyness_message}</h2>
        ) : (
          <Toolbar.Content>
            <div className={cx(flex, flexRow, expandWidth, itemStretch)}>
              <div className={prTreeViewStyle}>
                {(reviewState === 'DISPATCHED' ||
                  reviewState === 'NOTIFIED' ||
                  reviewState === 'COMPLETED') && (
                  <TreeViewReviewSelector
                    label={i18nValues.tabview.toReviewTitle}
                    itemLabel={`${i18nValues.tabview.toReview} ${i18nValues.editor.number}`}
                    reviews={sPRinstance.getToReview()}
                    open={carretState.reviews}
                    onCarretClick={onCarretClick('reviews')}
                    onReviewClick={onReviewClick('reviews')}
                  />
                )}
                {(reviewState === 'NOTIFIED' ||
                  reviewState === 'COMPLETED') && (
                  <TreeViewReviewSelector
                    label={i18nValues.tabview.toCommentTitle}
                    itemLabel={`${i18nValues.tabview.toComment} ${i18nValues.editor.number}`}
                    reviews={sPRinstance.getReviewed()}
                    open={carretState.comments}
                    onCarretClick={onCarretClick('comments')}
                    onReviewClick={onReviewClick('comments')}
                  />
                )}
              </div>
              <div className={cx(grow, autoScroll)}>
                {selectedReview && (
                  <ReviewEditor
                    reviewState={selectedReview}
                    reviewStatus={reviewState}
                    displaySubmit={displaySubmit}
                    onRefresh={() => setSelectedReview(undefined)}
                    disabled={options.disabled || options.locked}
                    readOnly={options.readOnly}
                  />
                )}
              </div>
            </div>
          </Toolbar.Content>
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
