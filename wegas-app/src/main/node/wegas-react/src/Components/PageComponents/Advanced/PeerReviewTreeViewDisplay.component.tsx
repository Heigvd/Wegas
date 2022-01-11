import { css, cx } from '@emotion/css';
import * as React from 'react';
import {
  ICategorizedEvaluationDescriptor,
  ICategorizedEvaluationInstance,
  IEvaluationDescriptor,
  IEvaluationInstance,
  IGradeInstance,
  INumberDescriptor,
  IPeerReviewDescriptor,
  IPeerReviewInstance,
  IReview,
  IScript,
  ITextDescriptor,
  ITextEvaluationInstance,
  ScriptableEntity,
  SPeerReviewDescriptor,
  SPeerReviewInstance,
  SReview,
} from 'wegas-ts-api';
import { useLiveUpdate } from '../../../API/websocket';
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
  asynchSaveReview,
  saveReview,
  submitReview,
} from '../../../data/Reducer/VariableDescriptorReducer';
import { instantiate } from '../../../data/scriptable';
import { Player, Team } from '../../../data/selectors';
import * as VariableDescriptorSelector from '../../../data/selectors/VariableDescriptorSelector';
import { store, useStore } from '../../../data/Stores/store';
import { translate } from '../../../Editor/Components/FormView/translatable';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { PeerReviewTranslations } from '../../../i18n/peerReview/definitions';
import { peerReviewTranslations } from '../../../i18n/peerReview/peerReview';
import { languagesCTX } from '../../Contexts/LanguagesProvider';
import { useScript } from '../../Hooks/useScript';
import HTMLEditor from '../../HTML/HTMLEditor';
import { Button } from '../../Inputs/Buttons/Button';
import { NumberSlider } from '../../Inputs/Number/NumberSlider';
import { useOkCancelModal } from '../../Modal';
import { HTMLText } from '../../Outputs/HTMLText';
import {
  CustomPhasesProgressBar,
  PhaseComponentProps,
} from '../../Outputs/PhasesProgressBar';
import { Selector } from '../../Selector';
import { themeVar } from '../../Theme/ThemeVars';
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
  borderRadius: themeVar.dimensions.BorderRadius,
  borderStyle: 'solid',
  borderWidth: '3px',
  borderColor: themeVar.colors.PrimaryColor,
  backgroundColor: themeVar.colors.BackgroundColor,
  color: themeVar.colors.PrimaryColor,
  fontWeight: 500,
});

const prFinishedPhaseComponentStyle = css({
  borderColor: themeVar.colors.DisabledColor,
  color: themeVar.colors.DisabledColor,
});

const prActivePhaseComponentStyle = css({
  backgroundColor: themeVar.colors.PrimaryColor,
  color: themeVar.colors.LightTextColor,
});
const ToBeReviewedStyle = css({
  borderRadius: themeVar.dimensions.BorderRadius,
  padding: '1em',
  overflow: 'auto',
  backgroundColor: themeVar.colors.BackgroundColor,
  marginTop: '1em',
  color: 'initial',
  //boxShadow: '4px 0px 10px rgba(0, 0, 0, 0.25)',
});

const reviewContainerStyle = css({
  borderRadius: themeVar.dimensions.BorderRadius,
  padding: '1.5em',
  overflowX: 'auto',
  backgroundColor: themeVar.colors.HeaderColor,
  width: '80%',
  alignSelf: 'flex-start',
  marginTop: '1em',
  boxShadow: '4px 0px 10px rgba(0, 0, 0, 0.25)',
});
const reviewContainerUserStyle = css({
  borderRadius: themeVar.dimensions.BorderRadius,
  padding: '1.5em',
  overflowX: 'auto',
  backgroundColor: themeVar.colors.PrimaryColor,
  color: themeVar.colors.LightTextColor,
  width: '80%',
  alignSelf: 'flex-end',
  marginTop: '1em',
  boxShadow: '4px 0px 10px rgba(0, 0, 0, 0.25)',
  'button.wegas-btn': {
    backgroundColor: themeVar.colors.HeaderColor,
    color: themeVar.colors.PrimaryColor,
  },
});

const selectedTreeviewItemStyle = css({
  backgroundColor: themeVar.colors.HeaderColor,
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
    backgroundColor: themeVar.colors.HoverColor,
  },
});

interface TreeViewReviewItemProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

function TreeViewReviewItem({
  label,
  isSelected,
  onClick,
}: TreeViewReviewItemProps) {
  return (
    <div
      className={cx(flex, flexRow, itemCenter, reviewItemStyle, {
        [selectedTreeviewItemStyle]: isSelected,
      })}
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
  isOpen: boolean;
  selectedReviewId: number | undefined;
  onCarretClick: () => void;
  onReviewClick: (review: SReview, index: number) => void;
}

function TreeViewReviewSelector({
  label,
  itemLabel,
  reviews,
  isOpen,
  selectedReviewId,
  onCarretClick,
  onReviewClick,
}: TreeViewReviewSelectorProps) {
  return (
    <div className={cx(flex, flexColumn)}>
      <div className={cx(flex, flexRow, defaultMarginTop)}>
        <Button
          icon={isOpen ? 'caret-down' : 'caret-right'}
          onClick={onCarretClick}
        />
        <div className={cx(flex, flexRow)}>
          <Button icon="users" className={css({ paddingTop: 0 })} />
          <strong>{label}</strong>
        </div>
      </div>

      {isOpen &&
        reviews.map((r, i) => (
          <TreeViewReviewItem
            key={r.getId()}
            label={itemLabel + (i + 1)}
            isSelected={r.getId() === selectedReviewId}
            onClick={() => onReviewClick(r, i)}
          />
        ))}
    </div>
  );
}

interface EvalutationEditorProps extends DisabledReadonly {
  iEvaluation: ScriptableEntity<IEvaluationInstance>;
  onChange: (
    value: string | number,
    type: IEvaluationInstance['@class'],
  ) => void;
  onWaiting: (waitingState: boolean) => void;
}

function EvalutationEditor({
  iEvaluation,
  onChange,
  onWaiting,
  disabled,
  readOnly,
}: EvalutationEditorProps) {
  const { lang } = React.useContext(languagesCTX);

  const value = iEvaluation.getValue();

  const dEvaluation = instantiate(
    (
      iEvaluation.getEntity() as unknown as {
        descriptor: IEvaluationDescriptor;
      }
    ).descriptor,
  );

  const waitingState = useLiveUpdate(iEvaluation.getId());

  React.useEffect(() => {
    onWaiting(waitingState);
  }, [onWaiting, waitingState]);

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
      onChange(val, iEvaluation.getJSONClassName());
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

  let comp: JSX.Element | null = null;

  if (scriptableEntityIs(iEvaluation, 'TextEvaluationInstance')) {
    comp = (
      <HTMLEditor
        value={value == null ? undefined : String(value)}
        onChange={onChangeNotify}
        disabled={disabled || waitingState}
        readOnly={readOnly}
      />
    );
  } else if (scriptableEntityIs(iEvaluation, 'GradeInstance')) {
    comp = (
      <NumberSlider
        value={numberValue}
        onChange={onChangeNotify}
        min={min}
        max={max}
        steps={max - min}
        displayValues="NumberInput"
        disabled={disabled || waitingState}
        readOnly={readOnly}
      />
    );
  } else if (
    scriptableEntityIs(iEvaluation, 'CategorizedEvaluationInstance') &&
    scriptableEntityIs(dEvaluation, 'CategorizedEvaluationDescriptor')
  ) {
    const v = iEvaluation.getValue();
    <Selector
      value={v == null ? undefined : v}
      onChange={value => onChangeNotify(value)}
      choices={dEvaluation.getCategories().map(c => ({
        value: c.getName(),
        label: translate(c.getLabel(), lang),
      }))}
      allowUndefined={false}
      disabled={disabled || waitingState}
      readOnly={readOnly}
    />;
  }

  return (
    <div className={cx(flex, flexColumn)}>
      <h3>{translate(dEvaluation?.getLabel(), lang)}</h3>
      {comp}
    </div>
  );
}

interface EvalutationsEditorProps extends DisabledReadonly {
  review: IReview;
  phase: 'feedback' | 'comments';
  displaySubmit?: boolean;
}

function EvalutationsEditor({
  review,
  phase,
  displaySubmit,
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

  const i18nValues = useInternalTranslate(peerReviewTranslations);
  const { showModal, OkCancelModal } = useOkCancelModal();

  React.useEffect(() => {
    modifiedReview.current = {
      ...review,
      [phase]: review[phase].map(f =>
        f['@class'] === 'GradeInstance' ? { ...f, value: 1 } : f,
      ),
    };
  }, [phase, review]);

  const sendValue = React.useCallback(
    (
      id: number,
      val: string | number | undefined,
      type: IEvaluationInstance['@class'],
    ) => {
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
        if (type === 'TextEvaluationInstance') {
          asynchSaveReview(modifiedReview.current);
        } else {
          store.dispatch(saveReview(modifiedReview.current));
        }
      }, 500);
    },
    [phase],
  );

  return (
    <div className={cx(flex, flexColumn)}>
      {evaluations.map(e => (
        <EvalutationEditor
          key={e.id}
          iEvaluation={instantiate(e)}
          onChange={(val, type) => sendValue(e.id!, val, type)}
          onWaiting={setWaitingState}
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
          store.dispatch(submitReview(modifiedReview.current));
        }}
      >
        <p>{i18nValues.global.confirmation.info}</p>
        <p>{i18nValues.global.confirmation.question}</p>
      </OkCancelModal>
    </div>
  );
}

interface EvalutationDisplayProps {
  iEvaluation: IEvaluationInstance;
}

function EvalutationDisplay({ iEvaluation }: EvalutationDisplayProps) {
  const { lang } = React.useContext(languagesCTX);

  const dEvaluation = instantiate(
    (
      iEvaluation as unknown as {
        descriptor: IEvaluationDescriptor;
      }
    ).descriptor,
  );
  return (
    <div className={cx(flex, flexColumn)}>
      <h3>{translate(dEvaluation?.getLabel(), lang)}</h3>
      <HTMLText
        text={
          entityIs(iEvaluation, 'CategorizedEvaluationInstance')
            ? translate(
                (
                  iEvaluation as ICategorizedEvaluationInstance & {
                    descriptor: ICategorizedEvaluationDescriptor;
                  }
                ).descriptor.categories.find(i => i.name === iEvaluation.value)
                  ?.label,
                lang,
              )
            : String(
                (iEvaluation as ITextEvaluationInstance | IGradeInstance).value,
              )
        }
      />
    </div>
  );
}

interface EvalutationsDisplayProps {
  evaluations: IEvaluationInstance[];
}

function EvalutationsDisplay({ evaluations }: EvalutationsDisplayProps) {
  return (
    <div className={cx(flex, flexColumn)}>
      {evaluations.map(e => (
        <EvalutationDisplay key={e.id} iEvaluation={e} />
      ))}
    </div>
  );
}

interface ReviewEditorProps extends DisabledReadonly {
  peerReview: Readonly<SPeerReviewInstance>;
  reviewState: ReviewState;
  reviewStatus: IPeerReviewInstance['reviewState'];
  displaySubmit?: boolean;
}

function ReviewEditor({
  peerReview,
  reviewState,
  reviewStatus,
  displaySubmit,
  disabled,
  readOnly,
}: ReviewEditorProps) {
  const i18nValues = useInternalTranslate(peerReviewTranslations);

  const rev = useStore(() => {
    const reviewed = peerReview
      .getReviewed()
      .find(r => r.getId() === reviewState.review.getId());
    const toReview = peerReview
      .getToReview()
      .find(r => r.getId() === reviewState.review.getId());
    return (
      reviewed?.getEntity() ||
      toReview?.getEntity() ||
      reviewState.review.getEntity()
    );
  });

  const given = useStore(() =>
    instantiate(
      VariableDescriptorSelector.findByName<
        ITextDescriptor | INumberDescriptor
      >(
        VariableDescriptorSelector.select<IPeerReviewDescriptor>(
          peerReview.getParentId(),
        )?.toReviewName,
      ),
    ),
  )?.getValue(Player.self());

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
      <h3>{rev.id}</h3>
      <h2
        className={css({
          borderTop: '1px solid ' + themeVar.colors.DisabledColor,
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
            disabled={disabled}
            readOnly={readOnly}
          />
        ) : (
          <EvalutationsDisplay evaluations={rev.feedback} />
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
              disabled={disabled}
              readOnly={readOnly}
            />
          ) : (
            <EvalutationsDisplay evaluations={rev.comments} />
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
                    isOpen={carretState.reviews}
                    selectedReviewId={selectedReview?.review.getId()}
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
                    isOpen={carretState.comments}
                    selectedReviewId={selectedReview?.review.getId()}
                    onCarretClick={onCarretClick('comments')}
                    onReviewClick={onReviewClick('comments')}
                  />
                )}
              </div>
              <div className={cx(grow, autoScroll)}>
                {selectedReview && (
                  <ReviewEditor
                    peerReview={sPRinstance}
                    reviewState={selectedReview}
                    reviewStatus={reviewState}
                    displaySubmit={displaySubmit}
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
    illustration: 'PRTreeView',
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
