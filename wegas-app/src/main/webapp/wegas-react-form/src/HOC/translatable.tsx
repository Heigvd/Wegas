import * as React from 'react';
import {LangConsumer} from '../LangContext';
import {Schema} from 'jsoninput';
import {infoStyle} from './commonView';

interface TranslatableProps {
    value: {[code: string]: string};
    onChange: (value: {[code: string]: string}) => void;
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

                    if (props.value.hasOwnProperty(lang.toUpperCase())){
                        translation = props.value[lang.toUpperCase()];
                    }else {
                        translation = props.value[lang.toLowerCase()];
                    }

                    return (
                        <Comp
                            {...props}
                            value={translation}
                            view={view}
                            onChange={value => {
                                const v = {
                                    ...props.value,
                                    [lang]: value,
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
