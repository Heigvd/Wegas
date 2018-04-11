import * as React from 'react';
import { LangConsumer } from '../LangContext';

interface TranslatableProps {
    value: { [refName: string]: string };
    onChange: (value: { [refName: string]: string }) => void;
}

interface EndProps {
    value?: string | number;
    onChange: (value: string) => void;
}
/**
 * HOC: Transform a hashmap (lang:value) into value based on current language
 * @param Comp
 */
export default function translatable<P extends EndProps>(
    Comp: React.ComponentType<P>
): React.SFC<TranslatableProps & P> {
    function Translated(props: TranslatableProps) {
        return (
            <LangConsumer>
                {({ lang }) => (
                    <Comp
                        {...props}
                        value={props.value[lang]}
                        onChange={value => {
                            const v = {
                                ...props.value,
                                [lang]: value,
                            };
                            props.onChange(v);
                        }}
                    />
                )}
            </LangConsumer>
        );
    }
    return Translated;
}
