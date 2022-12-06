import { WidgetProps } from 'jsoninput/typings/types';
import * as React from 'react';
import Creatable from 'react-select/creatable';
import { GameModelApi } from '../../../API/gameModel.api';
import { selectStyles } from '../../../Components/Selector';
import { selectCurrent } from '../../../data/selectors/GameModel';
import { CommonView, CommonViewContainer } from './commonView';
import { Labeled, LabeledView } from './labeled';

interface Option {
  value: string;
  label: string;
}

type Options = Option[];

function makeOption(value: string): Option {
  return { value: value, label: value };
}

function makeOptions(values: string[]): Options {
  return values.map(makeOption);
}

interface IEventSelectProps extends WidgetProps.BaseProps {
  view: CommonView & LabeledView;
  value?: string | null;
  onChange: (value: string) => void;
}

function EventSelect({
  onChange,
  value,
  errorMessage,
  view,
}: IEventSelectProps) {
  const [options, setOptions] = React.useState<Options | null>(null);

  const gameModel = selectCurrent();

  React.useEffect(() => {
    let alive = true;

    if (gameModel.id != null) {
      GameModelApi.getAllFiredEvents(gameModel.id).then(events => {
        if (alive) {
          setOptions(makeOptions(events));
        }
      });
    }
    return () => {
      alive = false;
    };
  }, [gameModel.id]);

  const onChangeCb = React.useCallback(
    (option: { value: string } | null) => {
      onChange(option?.value || '');
    },
    [onChange],
  );

  const createOptionCb = React.useCallback(
    (value: string) => {
      setOptions(options => [...(options || []), makeOption(value)]);
      onChange(value);
    },
    [onChange],
  );

  if (options != null) {
    // make sure currentValue is an option
    const allOptions = options.find(opt => opt.value === value)
      ? options
      : [...options, makeOption(value || '')];
    return (
      <CommonViewContainer errorMessage={errorMessage} view={view}>
        <Labeled {...view}>
          {({ inputId, labelNode }) => {
            return (
              <>
                {labelNode}
                <Creatable
                  id={inputId}
                  options={allOptions}
                  value={makeOption(value || '')}
                  onChange={onChangeCb}
                  onCreateOption={createOptionCb}
                  styles={selectStyles}
                />
              </>
            );
          }}
        </Labeled>
      </CommonViewContainer>
    );
  } else {
    return null;
  }
}

export default EventSelect;
