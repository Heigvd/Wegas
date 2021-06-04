import { css } from 'emotion';
import * as React from 'react';
import { globals } from '../../Components/Hooks/useScript';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { HTMLText } from '../../Components/Outputs/HTMLText';
import { themeVar } from '../../Components/Theme/ThemeVars';
import {
  componentOrRawHTML,
  components,
  ReactTransformer,
} from './Components/components';
import {
  ActionItem,
  DataItem,
  DataType,
  isDataItem,
  OverviewClickType,
} from './Overview';
import { OverviewButton } from './OverviewButton';

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
    const { kind, formatter, transformer } = structure;

    const view = formatter ? 'formatter' : transformer ? 'transformer' : kind;
    const value = typeof data === 'object' ? data.body : data;

    switch (view) {
      case 'boolean':
        return (
          <td className={className} style={style} id={id}>
            <div>
              <img
                src={
                  require(value === true
                    ? '../../pictures/icon_ok.svg'
                    : '../../pictures/icon_notok.svg').default
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
              <Button
                tooltip="Read mails"
                src={require('../../pictures/icon_mail.svg').default}
                onClick={() => setShowPopup(o => !o)}
              />
            </div>
            {showPopup && (
              <div
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
        const formattedvalue = globals.Function(
          'data',
          formatterFunction,
        )(data);

        return (
          <td className={className} style={style} id={id}>
            <div>
              <HTMLText text={String(formattedvalue)} />
            </div>
          </td>
        );
      }
      case 'transformer': {
        const transformerFunction = `return (${transformer})(data)`;
        const transformedvalue:
          | string
          | ReactTransformer<keyof typeof components> = globals.Function(
          'data',
          transformerFunction,
        )(data);

        return (
          <td className={className} style={style} id={id}>
            <div>{componentOrRawHTML(transformedvalue)}</div>
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
