import React from 'react';
import Form, { Schema } from 'jsoninput';
import { getY } from '../../index';
import load from '../../HOC/loadAsyncComp';

// Temporary solution until the friendly name is added as a standard widget attribute?
function friendlyName(label: string) {
    switch (label) {
        case 'OpenPageAction':
            return 'Open page';
        case 'OpenUrlAction':
            return 'Open URL';
        case 'OpenFileAction':
            return 'Open File';
        case 'ExecuteScriptAction':
            return 'Impact variables';
        case 'ExecuteLocalScriptAction':
            return 'Local scriptEval';
        case 'OpenPanelPageloader':
            return 'Open Popup page';
        case 'PlaySoundAction':
            return 'Play sound';
        case 'PrintActionPlugin':
            return 'Print Variables';
        case 'Tooltip':
            return 'Tooltip';
        case 'CSSBackground':
            return 'Background';
        case 'CSSPosition':
            return 'Position';
        case 'CSSSize':
            return 'Size';
        case 'CSSText':
            return 'Text';
        case 'CSSStyles':
            return 'Other styles';
        case 'ShowAfter':
            return 'Show after';
        case 'HideAfter':
            return 'Hide after';
        case 'wegas-conditionaldisplay':
            return 'Conditional display';
        case 'ConditionalDisable':
        case 'wegas-conditionaldisable':
            return 'Conditional disable';
        case 'wegas-conditionaldisable2':
            return 'Conditional disable #2';
        case 'wegas-conditionaldisable3':
            return 'Conditional disable #3';
        case 'wegas-conditionaldisable4':
            return 'Conditional disable #4';
        case 'wegas-conditionaldisable5':
            return 'Conditional disable #5';
        case 'UnreadCount':
            return 'Unread count';
        case 'Lockable':
        case 'wegas-lockable':
            return 'Lock';
        case 'wegas-showinboxlistonclick':
            return 'Show inbox list on click';
        default:
            return label;
    }
}

const SCHEMA: Schema.Object = {
    type: 'object',
    properties: {
        fn: {
            index: -1,
            type: 'string',
            view: {
                type: 'hidden', // 'uneditable'
            },
        },
        cfg: {},
    },
};
function updateCfg(cfg: Schema): Schema {
    const schema: typeof SCHEMA = JSON.parse(JSON.stringify(SCHEMA));
    schema.properties!.cfg = cfg;
    return schema;
}
interface IValue {
    fn: string;
    cfg: { [key: string]: any };
}
const Y = getY();
const AsyncForm = load<{
    value: IValue;
    onChange: (value: IValue) => void;
}>(
    ({ value, onChange }) => {
        return new Promise((resolve, reject) => {
            let schema: Schema;
            if (value && value.fn) {
                Y.Wegas.use({ type: value.fn }, () => {
                    // load required modules
                    const targetPlg = Y.Plugin[value.fn] as Y.Plugin_Base;
                    const w: Y.Plugin_Host = new Y.Wegas.Text(); // Use this hack to retrieve a plugin config
                    w.plug(targetPlg);
                    const cfg = (w as any)[targetPlg.NS].getFormCfg();
                    cfg.name = targetPlg.NAME;
                    cfg.view = {
                        label:
                            // @ts-ignore
                            targetPlg.EDITORNAME ||
                            friendlyName(targetPlg.NAME),
                    };
                    schema = updateCfg(cfg);
                    resolve(props => <Form schema={schema} {...props} />);
                });
            }
        });
    },
    () => <i>Loading ...</i>
);
function PluginElement({
    value,
    onChange,
    view,
}: {
    value: IValue;
    onChange: (value: object) => void;
    view: { choices: {}[] };
}) {
    if (value && value.fn) {
        return <AsyncForm key={value.fn} value={value} onChange={onChange} />;
    }
    return <span>Wrong config</span>;
}
export default PluginElement;
