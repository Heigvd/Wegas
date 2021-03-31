import { cx } from 'emotion';
import * as React from 'react';
import { globals } from '../../Components/Hooks/useScript';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { themeVar } from '../../Components/Style/ThemeVars';
import { flex, flexRow, itemCenter, justifyCenter } from '../../css/classes';
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
        backgroundColor: themeVar.Common.colors.PrimaryColor,
        color: themeVar.Common.colors.SecondaryBackgroundColor,
      };
      break;
    case 'red':
      computedColors = {
        backgroundColor: themeVar.Common.colors.ActiveColor,
        color: themeVar.Common.colors.SecondaryBackgroundColor,
      };
      break;
    case 'orange':
      computedColors = { backgroundColor: themeVar.Common.colors.HeaderColor };
      break;
    case 'grey':
      computedColors = {
        backgroundColor: themeVar.Common.colors.DisabledColor,
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
          buttonData = buttonData.join('\n');
        }
      }
    }
  }

  return (
    <td>
      <div className={cx(flex, flexRow, itemCenter, justifyCenter)}>
        <div dangerouslySetInnerHTML={{ __html: String(formattedValue) }} />
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
  teamName: string | undefined | null;
  value: string;
  onShowOverlay: (
    title: string,
    content: string,
    button: React.RefObject<HTMLButtonElement>,
  ) => void;
}

export function TeamTD({ teamName, value, onShowOverlay }: TeamTDProps) {
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  return (
    <td>
      {teamName}
      <Button
        ref={buttonRef}
        icon="info-circle"
        onClick={() =>
          onShowOverlay(
            `Informations revues par les pairs pour l'équipe "${teamName}"`,
            value,
            buttonRef,
          )
        }
      />
    </td>
  );
}
