/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2023 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import React, { Fragment } from 'react';
import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core';
import { css, cx } from '@emotion/css';
import zxcvbnCommonPackage from '@zxcvbn-ts/language-common';
import zxcvbnENPackage from '@zxcvbn-ts/language-en';
import zxcvbnFRPackage from '@zxcvbn-ts/language-fr';
import { TranslationKeys } from '@zxcvbn-ts/core/dist/types';
import Item from './Item';

export interface PasswordFeedback {
  warning?: string;
  suggestions?: string[]
}

export interface PasswordStrengthBarProps {
  className?: string;
  style?: string;
  scoreWordClassName?: string;
  scoreWordStyle?: string;
  password: string;
  userInputs?: string[];
  barColors: string[];
  scoreWords?: string[];
  minLength?: number;
  shortScoreWord?: string;
  onChangeScore?: (score: number, feedback: PasswordFeedback) => void;
  uiLanguage: string;
}
  
const rootStyle = css({
  position: 'relative',
});

const wrapStyle = css({
  display: 'flex',
  alignItems: 'center',
  margin: '5px 0 0',
});

const spaceStyle = css({
  width: 4,
});

const descStyle = css({
  margin: '5px 0 0',
  color: '#898792',
  fontSize: 14,
  textAlign: 'right',
});

const availableTranslations = new Map<string, TranslationKeys>([['EN', zxcvbnENPackage.translations], ['FR', zxcvbnFRPackage.translations]]);

const setZxcvbnOptions = (uiLanguage: string) => {
  const options = {
    translations: availableTranslations.get(uiLanguage),
      dictionary: {
        ...zxcvbnCommonPackage.dictionary,
        ...zxcvbnENPackage.dictionary,
        ...zxcvbnFRPackage.dictionary,
        },
      graphs: zxcvbnCommonPackage.adjacencyGraphs,
  }
  zxcvbnOptions.setOptions(options);
}

const PasswordStrengthBar = (props: PasswordStrengthBarProps) =>  {
  const {
    className=undefined,
    style=undefined,
    scoreWordClassName=undefined,
    scoreWordStyle=undefined,
    password='', 
    userInputs=[], 
    barColors=['#ddd', '#ef4836', '#f6b44d', '#2b90ef', '#25c281'],
    scoreWords=['weak', 'weak', 'okay', 'good', 'strong'],
    minLength=4,
    shortScoreWord='too short',
    onChangeScore=undefined,
    uiLanguage='EN'} = props;

  const [state, setState] = React.useState({score: 0, feedback: {}});

  React.useEffect(() => {
    setZxcvbnOptions(uiLanguage);
    setScore();
  },[uiLanguage, password]);

  React.useEffect(() => {
    if (onChangeScore)
      onChangeScore(state.score, state.feedback);
  },[state]);

  const setScore = (): void => {
    let result = null;
    let score = 0;
    let feedback: PasswordFeedback = {};

    if (password.length >= minLength) {
      result = zxcvbn(password, userInputs);
      ({ score, feedback } = result);
    }
    setState({score,feedback});
  };

  let newShortScoreWord = shortScoreWord;
  if (password.length >= minLength) {
    newShortScoreWord = scoreWords[state.score];
  }   

  return (
    <div className={cx(className,rootStyle,style)}>
      <div className={wrapStyle}>
        {[1, 2, 3, 4].map((el: number) => {
          return (
            <Fragment key={`password-strength-bar-item-${el}`}>
              {el > 1 && <div className={spaceStyle} />}
              <Item score={state.score} itemNum={el} barColors={barColors} />
            </Fragment>
          );
        })}
      </div>
      <p className={cx(scoreWordClassName, descStyle, scoreWordStyle)}>
        {newShortScoreWord}
      </p>
    </div>
  );
}
export default PasswordStrengthBar;
