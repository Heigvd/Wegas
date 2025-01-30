import { css } from '@emotion/css';
import * as React from 'react';
import { globals } from '../../Components/Hooks/sandbox';
import { HTMLText } from '../../Components/Outputs/HTMLText';
import { themeVar } from '../../Components/Theme/ThemeVars';
import { IconComp } from '../../Editor/Components/Views/FontAwesome';
import {
  componentOrRawHTML,
  components,
  ReactFormatter,
} from './Components/components';
import {
  ActionItem,
  DataItem,
  DataType,
  isDataItem,
  OverviewClickType,
} from './Overview';
import { OverviewButton } from './OverviewButton';
import MailIcon from '../../pictures/icon_mail.svg';

export const fixedCellStyle = css({
  position: 'absolute',
  left: 0,
  width: '180px',
  zIndex: 100,
  '&> div': {
    paddingLeft: '0 !important',
  },
});

export const firstScrollCellStyle = css({
  borderLeft: '180px solid transparent',
});
interface OverviewCellProps extends ClassStyleId {
  structure: DataItem | ActionItem;
  data: DataType;
  onClick: (type: OverviewClickType, item?: ActionItem) => void;
}

export function OverviewCell({
  structure,
  data,
  onClick,
  className,
  style,
  id,
}: OverviewCellProps) {
  const [showPopup, setShowPopup] = React.useState(false);

  if (isDataItem(structure)) {
    const { kind, formatter } = structure;

    const view = formatter ? 'formatter' : kind;
    const value = typeof data === 'object' ? data.body : data;
    switch (view) {
      case 'boolean':
        return (
          <td className={className} style={style} id={id}>
            <div>
              <IconComp
                icon={value === true ? 'check' : 'times'}
                className={
                  value === true
                    ? css({ color: themeVar.colors.SuccessColor })
                    : css({ color: themeVar.colors.DisabledColor })
                }
              />
            </div>
          </td>
        );
      case 'number':
      case 'string':
        return (
          <td className={className} style={style} id={id}>
            <div>{String(value)}</div>
          </td>
        );
      case 'inbox':
        return (
          <td className={className} style={style} id={id}>
            <div>
              <div title="Read mails" onClick={() => setShowPopup(o => !o)}>
                <MailIcon />
              </div>
            </div>
            {showPopup && (
              <div
                className='wegas-dashboard-inbox-popup'
                style={{
                  position: 'fixed',
                  backgroundColor: themeVar.colors.BackgroundColor,
                  boxShadow: '2px 2px 2px rgba(0, 0, 0, 0.3)',
                  padding: '10px',
                }}
                onClick={() => setShowPopup(false)}
              >
                <HTMLText text={String(value)} />
              </div>
            )}
          </td>
        );
      case 'text':
        return (
          <td className={className} style={style} id={id}>
            <HTMLText text={String(value)} />
          </td>
        );
      case 'object':
        return (
          <td className={className} style={style} id={id}>
            <div>{JSON.stringify(String(value))}</div>
          </td>
        );
      case 'formatter': {
        const formatterFunction = `return (${formatter})(data)`;
        const formattedvalue: string | ReactFormatter<keyof typeof components> =
          globals.Function('data', formatterFunction)(data);

        return (
          <td className={className} style={style} id={id}>
            <div>{componentOrRawHTML(formattedvalue)}</div>
          </td>
        );
      }

      default:
        throw Error('Unknown kind of value to display');
    }
  } else {
    return (
      <td className={className} style={style} id={id}>
        <div>
          <OverviewButton item={structure} onClick={onClick} />
        </div>
      </td>
    );
  }
}
