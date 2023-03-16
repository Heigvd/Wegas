/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { css, cx } from '@emotion/css';
import { faCheck, faDownload, faSpinner, faUpload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as React from 'react';
import { IGameModelWithId } from 'wegas-ts-api';
import { getRestClient } from '../../API/api';
import { PatchDiff } from '../../API/restClient';
import useTranslations from '../../i18n/I18nContext';
import { useCurrentUser } from '../../selectors/userSelector';
import ActionButton, { loadingIconStyle } from '../common/ActionButton';
import Button from '../common/Button';
import CardContainer from '../common/CardContainer';
import FitSpace from '../common/FitSpace';
import Flex from '../common/Flex';
import IconButton from '../common/IconButton';
import InlineLoading from '../common/InlineLoading';
import { modalSeparatorBorder } from '../common/Modal';
import { linkStyle, secButtonStyle } from '../styling/style';

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
  const title = diff.title ? <span className={diffTitleStyle}>{diff.title}</span> : null;

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

interface FilePickerProps {
  title: string;
  onSelect: (file: File) => Promise<void>;
  className?: string;
  accept?: string;
  display?: 'BUTTON' | 'LINK';
}

const hide = css({ display: 'none' });

function FilePicker({
  title,
  className,
  onSelect,
  accept,
  display = 'BUTTON',
}: FilePickerProps): JSX.Element {
  const [state, setState] = React.useState<'IDLE' | 'LOADING' | 'DONE'>('IDLE');

  const onChangeCb = React.useCallback(
    (v: React.ChangeEvent<HTMLInputElement>) => {
      if (v.target.files != null && v.target.files.length > 0) {
        setState('LOADING');
        const file = v.target.files[0];
        onSelect(file).then(() => setState('DONE'));
      }
    },
    [onSelect],
  );
  const style = display === 'BUTTON' ? secButtonStyle : linkStyle;
  const invisible = cx(
    style,
    css({
      visibility: 'hidden',
    }),
  );

  React.useEffect(() => {
    let tId: number | undefined;
    if (state === 'DONE') {
      //setState('FADING_OUT');
      tId = window.setTimeout(() => {
        setState('IDLE');
      }, 500);
    }
    return () => {
      if (tId != null) {
        window.clearTimeout(tId);
      }
    };
  }, [state]);

  const dTitle = (
    <>
      <FontAwesomeIcon icon={faUpload} /> {title}
    </>
  );

  // TODO: track Window.showOpenFilePicker() support !
  // once support is widely adopted, use an ActionButton instead
  if (state === 'IDLE') {
    return (
      <label>
        <div className={cx(style, className)}>{dTitle}</div>
        <input className={hide} type="file" onChange={onChangeCb} accept={accept} autoComplete='false'/>
      </label>
    );
  } else if (state === 'LOADING') {
    return (
      <label>
        <div className={invisible}>{dTitle}</div>
        <IconButton className={cx(loadingIconStyle)} icon={faSpinner} pulse />
      </label>
    );
  } else {
    return (
      <label>
        <div className={invisible}>{dTitle}</div>
        <IconButton className={cx(loadingIconStyle, className)} icon={faCheck} />
      </label>
    );
  }
}

interface GameModelExportProps {
  gameModel: IGameModelWithId;
  onClose: () => void;
}

export default function GameModelExportPatch({ gameModel }: GameModelExportProps) {
  const i18n = useTranslations();
  const { isAdmin } = useCurrentUser();

  const [file, setFile] = React.useState<File | undefined>();
  const [diff, setDiff] = React.useState<PatchDiff | undefined | null>();

  const reset = React.useCallback(() => {
    setFile(undefined);
    setDiff(undefined);
  }, []);

  const onFileSelect = React.useCallback(
    async (file: File) => {
      setFile(file);
      const restClient = getRestClient();
      const diff = await restClient.GameModelController.diffFromFile(file, gameModel.id);

      setDiff(diff || null);
    },
    [gameModel.id],
  );

  const doPatch = React.useCallback(async () => {
    if (file != null) {
      const restClient = getRestClient();
      await restClient.GameModelController.patchFromFile(file, gameModel.id);
      reset();
    }
  }, [file, gameModel.id, reset]);

  return (
    <FitSpace direction="column" overflow="auto">
      <FitSpace direction="column" overflow="auto">
        <CardContainer>
          {(() => {
            if (file == null) {
              return (
                <>
                  <a
                    className={linkStyle}
                    title={i18n.pdfTooltip(gameModel)}
                    href={`${APP_ENDPOINT}/print.html?gameModelId=${gameModel.id}&outputType=pdf&mode=editor&defaultValues=true`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FontAwesomeIcon icon={faDownload} /> {i18n.pdf}
                  </a>

                  <a
                    className={linkStyle}
                    title={i18n.wgzTooltip(gameModel)}
                    href={`${API_ENDPOINT}/Export/GameModel/${gameModel.id}.wgz`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FontAwesomeIcon icon={faDownload} /> {i18n.exportWgz}
                  </a>

                  <a
                    className={linkStyle}
                    title={i18n.wgzTooltip(gameModel)}
                    href={`${API_ENDPOINT}/Export/GameModel/${gameModel.id}.zip`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FontAwesomeIcon icon={faDownload} /> {i18n.exportZip}
                  </a>

                  {isAdmin ? (
                    <>
                      <a
                        className={linkStyle}
                        title={i18n.jsonTooltip(gameModel)}
                        href={`${API_ENDPOINT}/Export/GameModel/${
                          gameModel.id
                        }/${encodeURIComponent(gameModel.name)}.json`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <FontAwesomeIcon icon={faDownload} /> {i18n.exportJson}
                      </a>

                      <FilePicker
                        display="LINK"
                        title={i18n.diff}
                        onSelect={onFileSelect}
                        accept=".json, .wgz, .zip"
                      />
                    </>
                  ) : null}
                </>
              );
            } else {
              if (diff === null) {
                return <span>"up to date"</span>;
              } else if (diff == undefined) {
                return <InlineLoading />;
              } else {
                return <PrettyPrintDiff diff={diff} />;
              }
            }
          })()}
        </CardContainer>
      </FitSpace>
      <Flex
        className={css({
          borderTop: modalSeparatorBorder,
        })}
        justify="space-between"
        align="center"
      >
        {file != null && diff != null ? (
          <>
            <Button label={i18n.restart} onClick={reset} />
            <ActionButton className={secButtonStyle} label={i18n.patch} onClick={doPatch} />
          </>
        ) : null}
      </Flex>
    </FitSpace>
  );
}
