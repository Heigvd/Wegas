import { IGameModel } from 'wegas-ts-api';
import React from 'react';
import { css, cx } from '@emotion/css';
import { GameModelApi, PatchDiff } from '../../../API/gameModel.api';
import { useModal } from '../../../Components/Modal';
import { Button } from '../../../Components/Inputs/Buttons/Button';
import {
  componentMarginRight,
  defaultMarginLeft,
  defaultPadding,
} from '../../../css/classes';
import { FlexList } from '../../../Components/Layouts/FlexList';
import { GameModel } from '../../../data/selectors';
import { themeVar } from '../../../Components/Theme/ThemeVars';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { commonTranslations } from '../../../i18n/common/common';
import { modelerTranslations } from '../../../i18n/modeler/modeler';

const preStyle = css({
  display: 'inline-block',
  margin: 0,
});

const diffStyle = css({
  paddingLeft: '1em',
  borderLeft: '1px dashed lightgrey',
});

const diffTitleStyle = css({});
const side2sideChange = css({});

const oldStyle = cx(preStyle, css({}));

const newStyle = cx(preStyle, css({}));

const changeStyle = css({
  lineHeight: '18px',
});

const lineNumberStyle = css({
  display: 'inline-block',
  width: '25px',
  height: '100%',
  paddingRight: '5px',
  color: 'grey',
  userSelect: 'none',
  textAlign: 'right',
  background: '#eeeaea',
  verticalAlign: 'top',
});

const lineChangeStyle = (_tag: string) => {
  return cx(
    preStyle,
    css({
      width: 'calc(100 % - 35px)',
      overflowWrap: 'anywhere',
      overflowX: 'auto',
      whiteSpace: 'pre-wrap',
      '& .editOldInline': {
        backgroundColor: '#fdb8c0',
        textDecoration: 'line-through',
      },
      '& .editNewInline': {
        backgroundColor: '#acf2bd',
      },
    }),
  );
};

function PrettyPrintDiff({ diff }: { diff: PatchDiff }): JSX.Element {
  const title = diff.title ? (
    <span className={diffTitleStyle}>{diff.title}</span>
  ) : null;

  if ('diffs' in diff) {
    return (
      <div className={diffStyle}>
        {title}
        {diff.diffs.map((d, i) => (
          <PrettyPrintDiff key={i} diff={d} />
        ))}
      </div>
    );
  } else if ('changes' in diff && diff.changes.length) {
    const changes = diff.changes.map((change, i) => {
      if ('oldValue' in change) {
        return (
          <div key={i} className={side2sideChange}>
            <pre className={oldStyle}>{change.oldValue}</pre>
            <pre className={newStyle}>{change.newValue}</pre>
          </div>
        );
      } else {
        return (
          <div key={i} className={changeStyle}>
            {diff.changes.length > 1 ? (
              <span className={lineNumberStyle}>{change.lineNumber}</span>
            ) : null}
            <pre
              className={lineChangeStyle(change.tag)}
              dangerouslySetInnerHTML={{ __html: change.content }}
            ></pre>
          </div>
        );
      }
    });

    return (
      <div className={diffStyle}>
        {title}
        {changes}
      </div>
    );
  } else {
    return <></>;
  }
}

const modalStyle = css({
  width: '800px',
  height: '500px',
  padding: '0px',
});

const diffContainerStyle = cx(
  defaultPadding,
  css({
    flexGrow: 1,
    overflow: 'auto',
    paddingLeft: '15px',
    borderTop: '1px solid rgb(215, 215, 215)',
  }),
);
const modalFooterStyle = css({
  height: '65px',
  borderTop: '1px solid rgb(215, 215, 215)',
  padding: '15px',
});

interface ModelPropagatorProps {
  gameModel: Readonly<IGameModel>;
}

export default function ModelPropagator({ gameModel }: ModelPropagatorProps) {
  const i18nValues = useInternalTranslate(commonTranslations);
  const i18nValuesModeler = useInternalTranslate(modelerTranslations);

  const { showModal, closeModal, show, Modal } = useModal();
  const [diff, setDiff] = React.useState<PatchDiff | undefined | null>();
  const [loading, setLoading] = React.useState<boolean>(false);

  const gameModelId =
    gameModel.id === undefined ? GameModel.selectCurrent().id! : gameModel.id;

  const onOpen = React.useCallback(() => {
    showModal();
    GameModelApi.getModelDiff(gameModelId).then(diff => {
      setDiff(diff || null);
    });
  }, []);

  const onSubmit = React.useCallback(() => {
    setLoading(true);
    GameModelApi.propagateModel(gameModelId).then(() => {
      setDiff(null);
      setLoading(false);
      closeModal();
    });
  }, []);

  return (
    <>
      <Button
        label={i18nValuesModeler.propagate}
        icon={'rocket'}
        onClick={onOpen}
        className={componentMarginRight}
      />
      {show && (
        <Modal innerClassName={modalStyle}>
          <FlexList
            className={css({ height: '100%' })}
            layout={{
              flexDirection: 'column',
            }}
          >
            <h2 className={defaultMarginLeft}>
              {i18nValuesModeler.reviewDiff}
            </h2>
            <div className={diffContainerStyle}>
              {loading ? (
                i18nValuesModeler.propagating
              ) : diff === null ? (
                <span>{i18nValuesModeler.upToDate}</span>
              ) : diff === undefined ? (
                <span>{i18nValues.loading}</span>
              ) : (
                <PrettyPrintDiff diff={diff} />
              )}
            </div>
            <FlexList
              layout={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignContent: 'center',
              }}
              className={modalFooterStyle}
              style={{ flexGrow: 0 }}
            >
              <Button
                label={i18nValues.cancel}
                onClick={closeModal}
                noBackground
                disabled={loading}
                className={css({
                  border: '1px solid ' + themeVar.colors.PrimaryColor,
                })}
              />
              <Button
                label={i18nValuesModeler.propagate}
                tooltip={i18nValuesModeler.propagateToModel}
                icon={'rocket'}
                onClick={onSubmit}
                loading={loading}
              />
            </FlexList>
          </FlexList>
        </Modal>
      )}
    </>
  );
}
