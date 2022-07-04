import { css, cx } from '@emotion/css';
import * as React from 'react';
import { ITeam } from 'wegas-ts-api';
import { globals } from '../../Components/Hooks/sandbox';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { HTMLText } from '../../Components/Outputs/HTMLText';
import { themeVar } from '../../Components/Theme/ThemeVars';
import { flex, flexRow, itemCenter, justifyCenter } from '../../css/classes';
import { useInternalTranslate } from '../../i18n/internalTranslator';
import { peerReviewTranslations } from '../../i18n/peerReview/peerReview';
import {
  DataReviewItem,
  OverviewColor,
  ReviewsItemValue,
} from './PeerReviewPage';

interface OverviewTDProps {
  value: string | undefined;
  color: OverviewColor;
}

export function OverviewTD({ value, color }: OverviewTDProps) {
  let computedColors: React.CSSProperties = {
    backgroundColor: undefined,
    color: undefined,
  };

  switch (color) {
    case 'green':
      computedColors = {
        backgroundColor: themeVar.colors.PrimaryColor,
        color: themeVar.colors.SecondaryBackgroundColor,
      };
      break;
    case 'red':
      computedColors = {
        backgroundColor: themeVar.colors.ActiveColor,
        color: themeVar.colors.SecondaryBackgroundColor,
      };
      break;
    case 'orange':
      computedColors = { backgroundColor: themeVar.colors.HeaderColor };
      break;
    case 'grey':
      computedColors = {
        backgroundColor: themeVar.colors.DisabledColor,
      };
      break;
  }

  return <td style={computedColors}>{value}</td>;
}

function normalizeFormatterFunction(
  stringFn: string,
): { found: true; fn: string } | { found: false; fn: string | null } {
  const regex = new RegExp(/(function )([a-zA-Z0-9_]*)( *)(\([a-zA-Z0-9_]*\))/);
  const found = regex.exec(stringFn);
  if (found != null) {
    return { found: true, fn: stringFn + 'return ' + found[2] + found[4] };
  } else {
    if (stringFn === 'null') {
      return { found: false, fn: null };
    } else {
      return { found: false, fn: stringFn };
    }
  }
}

interface ReviewTDProps {
  value: ReviewsItemValue;
  title: string;
  data: DataReviewItem;
  formatter: string | undefined;
  onShowOverlay: (
    title: string,
    content: string,
    button: React.RefObject<HTMLButtonElement>,
  ) => void;
}

export function ReviewTD({
  value,
  title,
  data,
  formatter,
  onShowOverlay,
}: ReviewTDProps) {
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  let buttonData: ReviewsItemValue | undefined = undefined;
  let formattedValue = value;
  if (formatter != null) {
    const normalizedFormatter = normalizeFormatterFunction(formatter);
    if (normalizedFormatter.found) {
      formattedValue = globals.Function(
        'o',
        normalizedFormatter.fn,
      )({ value, data });
    } else if (normalizedFormatter.fn != null) {
      formattedValue = normalizedFormatter.fn.replace('{value}', String(value));

      // Parsing pattern like
      // <span class="gradeeval-data">{value} <i data-ref="19666598-data" class="fa fa-info-circle"></i></span>
      const regex = new RegExp(/(data-ref=")(\d*)(-)([a-zA-Z]*)(")/);
      const found = regex.exec(formattedValue);
      if (found != null) {
        buttonData = data[found[2] + found[3] + found[4]];
        if (Array.isArray(buttonData)) {
          buttonData = buttonData.join('<br>');
        }
      }
    }
  }

  return (
    <td>
      <div className={cx(flex, flexRow, itemCenter, justifyCenter)}>
        <HTMLText text={String(formattedValue)} />
        {buttonData && (
          <Button
            ref={buttonRef}
            icon="info-circle"
            onClick={() => onShowOverlay(title, String(buttonData), buttonRef)}
          />
        )}
      </div>
    </td>
  );
}

interface TeamTDProps {
  team: ITeam | undefined | null;
  value: string;
  onShowOverlay: (
    title: string,
    content: string,
    button: React.RefObject<HTMLButtonElement>,
  ) => void;
}

export function TeamTD({ team, value, onShowOverlay }: TeamTDProps) {
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const i18nValues = useInternalTranslate(peerReviewTranslations);
  const playerTeam = team?.players.length === 1;
  const name =
    (team?.players.length === 1 ? team.players[0].name : team?.name) || '';

  return (
    <td>
      <div
        className={css({
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        })}
      >
        {name}
        <Button
          ref={buttonRef}
          icon="info-circle"
          onClick={() =>
            onShowOverlay(
              playerTeam
                ? i18nValues.orchestrator.playerData(name)
                : i18nValues.orchestrator.teamData(name),
              value,
              buttonRef,
            )
          }
        />
      </div>
    </td>
  );
}
