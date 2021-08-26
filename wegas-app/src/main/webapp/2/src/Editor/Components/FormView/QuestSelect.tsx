import * as React from 'react';
import { WidgetProps } from 'jsoninput/typings/types';
import { Labeled, LabeledView } from './labeled';
import { CommonViewContainer, CommonView } from './commonView';
import { GameModelApi } from '../../../API/gameModel.api';
import { selectCurrent } from '../../../data/selectors/GameModel';
import Creatable from 'react-select/creatable';
import { themeVar } from '../../../Components/Theme/ThemeVars';

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

interface IQuestSelectProps extends WidgetProps.BaseProps {
  view: {} & CommonView & LabeledView;
  value?: string | null;
  onChange: (value: string) => void;
}

function QuestSelect({
  onChange,
  value,
  errorMessage,
  view,
}: IQuestSelectProps) {
  const [options, setOptions] = React.useState<Options | null>(null);

  const gameModel = selectCurrent();

  // Hack: load all quests from server
  React.useEffect(() => {
    let alive = true;
    const load = () => {
      if (gameModel.id != null) {
        GameModelApi.getAllQuests(gameModel.id).then(quests => {
          if (alive) {
            setOptions(makeOptions(quests));
          }
        });
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [gameModel?.id]);

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
                  styles={{
                    control: (provided, state) => {
                      return {
                        ...provided,
                        border: `2px solid ${
                          state.isFocused
                            ? themeVar.colors.ActiveColor
                            : themeVar.colors.PrimaryColor
                        }`,
                        borderRadius: themeVar.dimensions.BorderRadius,
                        backgroundColor: themeVar.colors.BackgroundColor,
                        ':hover': {
                          border: '2px solid ' + themeVar.colors.PrimaryColor,
                        },
                        boxShadow: 'unset',
                      };
                    },
                    option: (provided, state) => {
                      if (state.isFocused) {
                        return {
                          ...provided,
                          backgroundColor: themeVar.colors.HoverColor,
                          color: themeVar.colors.PrimaryColorShade,
                        };
                      } else if (state.isSelected) {
                        return {
                          ...provided,
                          backgroundColor: themeVar.colors.PrimaryColor,
                          color: themeVar.colors.BackgroundColor,
                        };
                      } else {
                        return { ...provided };
                      }
                    },
                  }}
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

export default QuestSelect;
