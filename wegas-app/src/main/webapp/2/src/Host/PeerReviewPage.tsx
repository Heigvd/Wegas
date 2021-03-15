import { css, cx } from 'emotion';
import * as React from 'react';
import { IPeerReviewDescriptor } from 'wegas-ts-api';
import { languagesCTX } from '../Components/Contexts/LanguagesProvider';
import { Button } from '../Components/Inputs/Buttons/Button';
import { themeVar } from '../Components/Style/ThemeVars';
import { Toolbar } from '../Components/Toolbar';
import {
  expandWidth,
  flex,
  flexColumn,
  flexDistribute,
  flexRow,
} from '../css/classes';
import { instantiate } from '../data/scriptable';
import { Player } from '../data/selectors';
import { useStore } from '../data/Stores/store';
import { translate } from '../Editor/Components/FormView/translatable';

const prStateStyle = css({
  borderRadius: '10px',
  backgroundColor: themeVar.Common.colors.HeaderColor,
  boxShadow: '1px 2px 6px rgba(0, 0, 0, 0.1)',
  padding: '10px',
  minWidth: '250px',
  minHeight: '150px',
  textAlign: 'center',
  border: 'solid 0.5px',
});

const prActiveStateStyle = css({
  backgroundColor: themeVar.Common.colors.ActiveColor,
  color: themeVar.Common.colors.LightTextColor,
});

interface PeerReviewPageProps {
  peerReview: IPeerReviewDescriptor;
}

export default function PeerReviewPage({ peerReview }: PeerReviewPageProps) {
  const { lang } = React.useContext(languagesCTX);
  const spr = useStore(() => instantiate(peerReview));
  const self = Player.self();
  const state = spr.getState(self) as
    | 'DISCARDED'
    | 'EVICTED'
    | 'NOT_STARTED'
    | 'SUBMITTED'
    | 'DISPATCHED'
    | 'NOTIFIED'
    | 'COMPLETED';

  return (
    <div className={expandWidth}>
      <Toolbar>
        <Toolbar.Header className={cx(flex, flexColumn)}>
          <h2>Peer Review Process for "{translate(spr.getLabel(), lang)}"</h2>
          <div className={cx(flex, flexRow, flexDistribute, expandWidth)}>
            <div
              className={cx(prStateStyle, {
                [prActiveStateStyle]: state === 'NOT_STARTED',
              })}
            >
              <h3>Edition</h3>
              <p>The authors are editing what will be reviewed</p>
              <p style={{ fontStyle: 'italic' }}>
                The process has not begun yet
              </p>
            </div>
            <Button icon="arrow-right" disabled={state !== 'NOT_STARTED'} />
            <div className={prStateStyle}>
              <h3>Reviewing</h3>
              <p>The authors are reviewing their peers</p>
              <p style={{ fontStyle: 'italic' }}>
                This is the first step of the process
              </p>
            </div>
            <Button icon="arrow-right" />
            <div className={prStateStyle}>
              <h3>Commenting</h3>
              <p>The authors acquaint themselves with peer reviews</p>
              <p style={{ fontStyle: 'italic' }}>
                They comment on those reviews
              </p>
            </div>
            <Button icon="arrow-right" />
            <div className={prStateStyle}>
              <h3>Completed</h3>
              <p>The reviewing process has been completed</p>
              <p style={{ fontStyle: 'italic' }}>
                The authors take acquaintance of comments on reviews they've
                done
              </p>
            </div>
          </div>
        </Toolbar.Header>
        <Toolbar.Content></Toolbar.Content>
      </Toolbar>
      <div>{JSON.stringify(peerReview)}</div>
    </div>
  );
}
