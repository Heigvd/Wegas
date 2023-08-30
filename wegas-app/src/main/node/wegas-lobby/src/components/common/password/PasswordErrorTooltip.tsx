/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2023 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import * as React from 'react';
import useTranslations from "../../../i18n/I18nContext";
import Tooltip from "../Tooltip";
import { css, cx } from '@emotion/css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulb } from '@fortawesome/free-solid-svg-icons';

const tooltipStyle = cx(
    css({
      background: 'var(--bgColor)',
      zIndex: 6,
      padding: '16px',
      border: '1px solid grey',
    }),
  );

export interface PasswordErrorTooltipProps {
    warning?: string;
    suggestions?: string[];
}

const PasswordErrorTooltip = (props: PasswordErrorTooltipProps) => {
  const i18n = useTranslations();

  if (props.warning || props.suggestions){
    return (<Tooltip
        tooltipClassName={tooltipStyle}
        tooltip={() => 
        <div>
        <ul>
            {props.warning ? <li>{props.warning}</li>:<></>}
            {props?.suggestions?.map((suggestion: any) =>{
            return (<li key={suggestion}>{suggestion}</li>)
            })}
        </ul>
        </div>}
    >
    {i18n.weakPassword}&nbsp;<FontAwesomeIcon icon={faLightbulb} />
    </Tooltip>)
  }
  else return (<div>{i18n.weakPassword}</div>)
}
export default PasswordErrorTooltip;