import * as React from 'react';
import {LangConsumer} from '../LangContext';
import {Schema} from 'jsoninput';
import {infoStyle} from './commonView';


interface Translation {
    translation: string;
    status: string;
}

interface TranslatableProps {
    value: {
        [code: string]: Translation;
    };
    onChange: (value: {[code: string]: Translation}) => void;
    view: Schema['view'] & {label?: string};
}

interface EndProps {
    value?: string | number;
    onChange: (value: string) => void;
    view: {};
}
/**
 * HOC: Transform a hashmap (lang:value) into value based on current language
 * @param Comp
 */
export default function translatable<P extends EndProps>(
    Comp: React.ComponentType<P>
): React.SFC<TranslatableProps & P> {
    function Translated(props: TranslatableProps) {

        if (!props.value) {
            return null;
        }

        return (
            <LangConsumer>
                {({lang, availableLang}) => {
                    // Updade label
                    const curCode = (
                        availableLang.find(l => l.code.toUpperCase() === lang.toUpperCase()) || {
                            code: '',
                        }
                    ).code;
                    const view = {
                        ...props.view,
                        label: (
                            <span>
                                {(props.view || {}).label}{' '}
                                <span className={String(infoStyle)}>
                                    [{curCode.toLowerCase()}]
                                </span>
                            </span>
                        ),
                    };

                    let translation;

                    if (props.value.hasOwnProperty(lang.toUpperCase())) {
                        translation = props.value[lang.toUpperCase()].translation;
                    } else if (props.value.hasOwnProperty(lang.toLowerCase())) {
                        translation = props.value[lang.toLowerCase()].translation;
                    }

                    return (
                        <Comp
                            {...props}
                            value={translation}
                            view={view}
                            onChange={value => {
                                const status = props.value[lang] ? props.value[lang].status : "";
                                const v = {
                                    ...props.value,
                                    [lang]: {
                                        translation: value,
                                        status: status
                                    }
                                };
                                props.onChange(v);
                            }}
                        />
                    );
                }}
            </LangConsumer>
        );
    }
    return Translated;
}
