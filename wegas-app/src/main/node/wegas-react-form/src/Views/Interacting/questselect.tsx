import React from 'react';
import { getY } from '../../index';
import labeled from '../../HOC/labeled';
import commonView from '../../HOC/commonView';
import Creatable from 'react-select/creatable';

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

interface QuestProps {
    id: string;
    value: string;
    onChange: (value: string) => void;
    view: {
        readOnly?: boolean;
    };
}

function QuestSelect(props: QuestProps) {
    const [options, setOptions] = React.useState<Options | null>(null);

    // Hack: load all quests from server
    React.useEffect(() => {
        let alive = true;
        const load = () => {
            const Y = getY() as unknown as {
                Wegas: {
                    Facade: {
                        GameModel: {
                            cache: {
                                get: (key: string) => number;
                                sendRequest: (request: {
                                    request: string;
                                    on: {
                                        success: (e: { response: { entities: string[] } }) => void;
                                    };
                                }) => void;
                            };
                        };
                    };
                };
            };

            const gmId = Y.Wegas.Facade.GameModel.cache.get('currentGameModelId');
            Y.Wegas.Facade.GameModel.cache.sendRequest({
                request: `/${gmId}/FindAllQuests`,
                on: {
                    success: e => {
                        if (alive) {
                            const quests = e.response.entities;
                            setOptions(makeOptions(quests));
                        }
                    },
                },
            });
        };
        load();
        return () => {
            alive = false;
        };
    }, []);

    const onChange = props.onChange;

    const onChangeCb = React.useCallback(
        (option: Option | null) => {
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
        const allOptions = options.find(opt => opt.value === props.value)
            ? options
            : [...options, makeOption(props.value)];
        return (
            <Creatable
                options={allOptions}
                value={makeOption(props.value)}
                onChange={onChangeCb}
                onCreateOption={createOptionCb}
            />
        );
    } else {
        return null;
    }
}

export default commonView(labeled(QuestSelect));
