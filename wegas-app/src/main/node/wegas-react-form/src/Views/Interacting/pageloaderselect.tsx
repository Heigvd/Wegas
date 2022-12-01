import React from 'react';
import {getY} from '../../index';
import labeled from '../../HOC/labeled';
import commonView from '../../HOC/commonView';
import Select from 'react-select';

const PREVIEW_PAGELOADER_ID = 'previewPageLoader';
const Y = getY();

interface Option {
    value: string;
    label: string;
}
interface IPageLoaderSelectProps {
    id: string;
    value?: string;
    onChange: (value?: string) => void;
    view: {
        choices: Option[];
    };
}

function findOption(options: Option[], value?: string): Option | undefined {
    if (value != null){

    }
    return undefined;
}

function PageLoaderSelect({value, onChange, view: {choices}}: IPageLoaderSelectProps) {
    const root: Y.Widget = Y.Wegas.PageLoader.find(PREVIEW_PAGELOADER_ID);
    const list: Y.ArrayList = root.get('contentBox').all('.wegas-pageloader');

    const options: Option[] = choices.concat([]);
    list.each((n: Y.Node) => {
        const w = Y.Widget.getByNode(n);
        if (root.get('widget') === w.get('root')) {
            const name: string = w.get('pageLoaderId');
            options.push({
                label: name,
                value: name,
            });
        }
    });
    const currentOption = findOption(options, value);

    const onChangeCb = React.useCallback((value: Option | null) => {
        if (value!= null){
            onChange(value.value);
        } else {
            onChange(undefined);
        }
    }, [onChange]);

    return (
        <Select
            options={options}
            value={currentOption}
            onChange={onChangeCb}
        />
    );
}
export default commonView(labeled(PageLoaderSelect));
