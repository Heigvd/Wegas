import { cx } from 'emotion';
import * as React from 'react';
import {
  flex,
  flexRow,
  flexColumn,
  justifyCenter,
  itemCenter,
  defaultMarginLeft,
} from '../../../css/classes';
import { MessageString } from '../../../Editor/Components/MessageString';
import { useInternalTranslate } from '../../../i18n/internalTranslator';
import { modalTranslations } from '../../../i18n/modal/peerReview';
import { DropMenu } from '../../DropMenu';
import { Button } from '../../Inputs/Buttons/Button';
import { SimpleInput } from '../../Inputs/SimpleInput';

interface AdderSelectorProps {
  items: { value: string; label: JSX.Element }[];
  selectedItem: string;
  placeholder: string;
  menuLabel: string;
  onSelect: (value: string) => void;
  onAccept: (value: string) => void;
  onError: (value: string | undefined) => string | void;
}

export function AdderSelector({
  items,
  selectedItem,
  placeholder,
  menuLabel,
  onSelect,
  onAccept,
  onError,
}: AdderSelectorProps) {
  const i18nValues = useInternalTranslate(modalTranslations);

  const [value, setValue] = React.useState<string>();
  const [editing, setEditing] = React.useState<boolean>(false);

  const error = React.useMemo(() => {
    return onError(value);
  }, [onError, value]);

  return (
    <div className={cx(flex, flexRow)}>
      {editing ? (
        <div className={cx(flex, flexColumn, justifyCenter, itemCenter)}>
          {error && <MessageString type="warning" value={error} />}
          <SimpleInput
            placeholder={placeholder}
            onChange={v => setValue(String(v))}
          />
          <div className={cx(flex, flexRow)}>
            <Button
              icon="times"
              tooltip={i18nValues.cancel}
              onClick={() => {
                setValue(undefined);
                setEditing(false);
              }}
            />
            <Button
              icon="check"
              tooltip={i18nValues.ok}
              disabled={error != null || value == null}
              onClick={() => {
                if (value != null) {
                  onAccept(value);
                  setValue(undefined);
                  setEditing(false);
                }
              }}
              className={defaultMarginLeft}
            />
          </div>
        </div>
      ) : (
        <>
          <DropMenu
            label={menuLabel}
            selected={selectedItem}
            items={items}
            onSelect={({ value }) => onSelect(value)}
          />
          <Button icon="plus" onClick={() => setEditing(true)} />
        </>
      )}
    </div>
  );
}