import * as React from 'react';
import {LangConsumer} from '../LangContext';
import {Schema} from 'jsoninput';
import {infoStyle} from './commonView';
import IconButton from '../Components/IconButton';


interface Translation {
    translation: string;
    status: string;
}

interface TranslatableProps {
    value: {
        [code: string]: Translation;
    };
    onChange: (value: {[code: string]: Translation}) => void;
    view: Schema['view'] & {
        label?: string;
        readOnly: boolean;
    };
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

        function catchUp(code: string) {
            const value = props.value[code] ? props.value[code].translation : "";
            const newValue = {
                ...props.value,
                [code]: {
                    translation: value,
                    status: ""
                }
            };

            props.onChange(newValue);
        }


        function outdate(code: string) {
            const value = props.value[code] ? props.value[code].translation : "";
            const newValue = {
                ...props.value,
                [code]: {
                    translation: value,
                    status: "outdated:manual"
                }
            };

            props.onChange(newValue);
        }



        function markAsMajor(code: string) {
            let newValue = {};
            for (let lang in props.value) {
                newValue[lang] = {
                    translation: props.value[lang].translation,
                    status: "outdated:" + code
                }
            };
            newValue[code].status = "";

            props.onChange(newValue);
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

                    let translation;
                    let status;

                    if (props.value.hasOwnProperty(lang.toUpperCase())) {
                        translation = props.value[lang.toUpperCase()].translation;
                        status = props.value[lang.toUpperCase()].status;
                    } else if (props.value.hasOwnProperty(lang.toLowerCase())) {
                        translation = props.value[lang.toLowerCase()].translation;
                        status = props.value[lang.toLowerCase()].status;
                    }


                    const view = {
                        ...props.view,
                        label: (
                            <span>
                                {(props.view || {label: ''}).label}{' '}
                                <span className={String(infoStyle)}>
                                    [{curCode.toLowerCase()}] {status ? "(" + status + ")" : ""}
                                </span>
                            </span>
                        ),
                    };
                    const readOnly = view.readOnly;

                    const editor =
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
                    const majorButton = !readOnly ?
                        <IconButton
                            icon="fa fa-gavel"
                            tooltip="Major update"
                            onClick={() => {
                                markAsMajor(curCode);
                            }}
                        /> : "";

                    const outdateButton = !readOnly ?
                        <IconButton
                            icon="fa fa-download"
                            tooltip="Deprecate "
                            onClick={() => {
                                outdate(curCode);
                            }}
                        /> : "";

                    if (!props.value[curCode] || !props.value[curCode].status) {
                        return (
                            <span>
                                {editor}
                                {majorButton}
                                {outdateButton}
                            </span>
                        );
                    } else {
                        return (
                            <span>
                                {editor}
                                {majorButton}
                                {!readOnly ? <IconButton
                                    icon="fa fa-upload"
                                    tooltip="Catch up"
                                    onClick={() => {
                                        catchUp(curCode);
                                    }}
                                /> : ""}
                            </span>
                        );
                    }
                }}
            </LangConsumer>
        );
    }
    return Translated;
}
