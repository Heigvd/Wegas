import React from 'react';
import { Combobox } from 'react-widgets';
import { getY } from "../../index";
import labeled from "../../HOC/labeled";
import commonView from "../../HOC/commonView";
import '!style-loader!css-loader!react-widgets/dist/css/react-widgets.css';

const PREVIEW_PAGELOADER_ID = "previewPageLoader";
const Y = getY();
interface IChoice {
    value: string;
    label: string;
}
interface IProps {
    value?: string,
    onChange: (value?: string) => void,
    view: {
        choices: IChoice[]
    }
}
function PageLoaderSelect({ value, onChange, view: { choices } }: IProps) {
    const root: Y.Widget = Y.Wegas.PageLoader.find(PREVIEW_PAGELOADER_ID);
    const list: Y.ArrayList = root.get("contentBox").all(".wegas-pageloader");
    const plId: IChoice[] = choices.concat([]);
    list.each(function mapNode(n: Y.Node) {
        const w = Y.Widget.getByNode(n);
        if (root.get("widget") === w.get("root")) {
            const name: string = w.get("pageLoaderId");
            plId.push({
                label: name,
                value: name
            });
        }
    });
    return (
        <Combobox
            valueField="value"
            textField="label"
            filter="contains"
            suggest
            data={plId}
            value={value}
            onChange={function (value) {
                if (typeof value === 'string') {
                    onChange(value);
                } else {
                    onChange(value.value);
                }
            }}
        />
    )
}
export default commonView(labeled(PageLoaderSelect));
