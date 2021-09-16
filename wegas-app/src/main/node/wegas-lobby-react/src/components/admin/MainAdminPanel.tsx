/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import {faCheck, faCubes, faEraser} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import * as React from 'react';
import {getRestClient, uploadJson} from '../../API/api';
import {DeeplUsage} from '../../API/restClient';
import useTranslations from '../../i18n/I18nContext';
import {useAppDispatch} from '../../store/hooks';
import {LoadingStatus} from '../../store/store';
import ActionIconButton from '../common/ActionIconButton';
import FitSpace from '../common/FitSpace';
import Flex from '../common/Flex';
import InlineLoading from '../common/InlineLoading';
import {panelPadding} from '../styling/style';

function GameModelUploader(): JSX.Element {
  const i18n = useTranslations();
  const dispatch = useAppDispatch();

  const [state, setState] = React.useState<'IDLE' | 'LOADING' | 'DONE'>('IDLE');

  const onChangeCb = React.useCallback(
    (v: React.ChangeEvent<HTMLInputElement>) => {
      if (v.target.files != null && v.target.files.length > 0) {
        setState('LOADING');
        const file = v.target.files[0];
        dispatch(uploadJson({file})).then(() => setState('DONE'));
      }
    },
    [dispatch],
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

  return (
    <>
      <h4>{i18n.uploadGameModel}</h4>
      <div>
        {state === 'IDLE' ? (
          <input type="file" onChange={onChangeCb} accept=".json, .wgz" />
        ) : state === 'LOADING' ? (
          <InlineLoading text="loading..." />
        ) : (
          <FontAwesomeIcon icon={faCheck} />
        )}
      </div>
    </>
  );
}

export default function MainAdminPanel(): JSX.Element {
  const i18n = useTranslations();

  const [buildDetails, setBuildDetails] = React.useState<{status: LoadingStatus; data: string}>({
    status: 'NOT_INITIALIZED',
    data: '',
  });

  React.useEffect(() => {
    if (buildDetails.status === 'NOT_INITIALIZED') {
      setBuildDetails({status: 'LOADING', data: ''});
      getRestClient()
        .AdminStuff.getBuildDetails()
        .then(result => {
          setBuildDetails({status: 'READY', data: result});
        });
    }
  }, [buildDetails.status]);

  const [deeplUsage, setDeeplUsage] = React.useState<{status: LoadingStatus; data: DeeplUsage}>({
    status: 'NOT_INITIALIZED',
    data: {
      character_count: 0,
      character_limit: 0,
    },
  });

  React.useEffect(() => {
    if (deeplUsage.status === 'NOT_INITIALIZED') {
      setDeeplUsage(du => ({...du, status: 'LOADING'}));
      getRestClient()
        .AdminStuff.getDeeplUsage()
        .then(result => {
          setDeeplUsage({status: 'READY', data: result});
        });
    }
  }, [deeplUsage.status]);

  const [branch, setBranch] = React.useState<{status: LoadingStatus; data: string}>({
    status: 'NOT_INITIALIZED',
    data: '',
  });

  React.useEffect(() => {
    if (branch.status === 'NOT_INITIALIZED') {
      setBranch({status: 'LOADING', data: ''});
      getRestClient()
        .AdminStuff.getBranch()
        .then(result => {
          setBranch({status: 'READY', data: result});
        });
    }
  }, [branch.status]);

  const [prNumber, setPrNumber] = React.useState<{status: LoadingStatus; data: string}>({
    status: 'NOT_INITIALIZED',
    data: '',
  });

  React.useEffect(() => {
    if (prNumber.status === 'NOT_INITIALIZED') {
      setPrNumber({status: 'LOADING', data: ''});
      getRestClient()
        .AdminStuff.getPullRequestBranch()
        .then(result => {
          setPrNumber({status: 'READY', data: result});
        });
    }
  }, [prNumber.status]);

  const [pr_branch, setPrBranch] = React.useState<{status: LoadingStatus; data: number}>({
    status: 'NOT_INITIALIZED',
    data: -1,
  });

  React.useEffect(() => {
    if (pr_branch.status === 'NOT_INITIALIZED') {
      setPrBranch({status: 'LOADING', data: -1});
      getRestClient()
        .AdminStuff.getPullRequestBranch()
        .then(result => {
          setPrBranch({status: 'READY', data: +result});
        });
    }
  }, [pr_branch.status]);

  const clearCacheCb = React.useCallback(async () => {
    return getRestClient().AdminStuff.clearEmCache();
  }, []);

  const createModelCb = React.useCallback(async () => {
    return getRestClient().AdminStuff.createEmptyModel();
  }, []);

  return (
    <FitSpace direction="column" overflow="auto" align='flex-start' className={panelPadding}>
      <h3>{i18n.adminConsole}</h3>
      <h4>{i18n.version}</h4>
      <Flex justify="space-between">
        <div>{buildDetails.data}</div>
        {pr_branch.status === 'READY' && branch.status == 'READY' ? (
          pr_branch.data > 0 ? (
            <img
              alt="github status"
              src={`https://github.com/Heigvd/Wegas/workflows/CI/badge.svg?event=push&branch=${branch.data}`}
            />
          ) : (
            <img
              src={`https://github.com/Heigvd/Wegas/workflows/CI/badge.svg?event=pull_request&branch=${pr_branch.data}}`}
            />
          )
        ) : (
          <InlineLoading />
        )}
      </Flex>

      <GameModelUploader />

      <h4>{i18n.deeplStatus}</h4>
      {deeplUsage.status === 'READY' ? (
        <div>
          {i18n.deeplUsage} {deeplUsage.data.character_count} / {deeplUsage.data.character_limit}
        </div>
      ) : (
        <InlineLoading />
      )}


      <h4>{i18n.doAction}</h4>
      <ActionIconButton title={i18n.clearCache} icon={faEraser} shouldConfirm={true} onClick={clearCacheCb}>
        {i18n.clearCache}
      </ActionIconButton>
      <ActionIconButton title={i18n.createEmptyModel} icon={faCubes} shouldConfirm={true} onClick={createModelCb}>
        {i18n.createEmptyModel}
      </ActionIconButton>
    </FitSpace>
  );
}
