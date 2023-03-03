import React from 'react';
import Form, { Schema } from 'jsoninput';
import { getY } from '../../index';
import { useAsync } from '../../Hooks/async';
import { SimpleLoader } from '../../Components/Loader';

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
        case 'ResizeListener':
            return 'Resize Observer';
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
function PluginElement({
    value,
    onChange,
    view,
}: {
    value: IValue;
    onChange: (value: object) => void;
    view: { choices: {}[] };
}) {
    const schema = useAsync(
        new Promise<Schema>((resolve, reject) => {
            if (value && value.fn) {
                Y.Wegas.use({ type: value.fn }, () => {
                    // load required modules
                    const targetPlg = Y.Plugin[value.fn] as Y.Plugin_Base;

                    if (!(Y.Plugin[value.fn] as any)._ATTR_CFG_HASH) {
                        // This plugin has never been used yet
                        // need to plug it once to initilize static fields (sic)
                        try {
                            const w: Y.Plugin_Host = new Y.Wegas.Text();
                            w.plug(targetPlg);
                            (w as any)[targetPlg.NS].getFormCfg();
                        } catch (e) {
                            console.log(`Error: ${  Y.Plugin[value.fn]}`);
                        }
                    }

                    const cfg = Y.Wegas.Editable.staticGetFormCfg(Y.Plugin[value.fn]);
                    cfg.name = targetPlg.NAME;
                    cfg.view = {
                        label:
                            // @ts-ignore
                            targetPlg.EDITORNAME || friendlyName(targetPlg.NAME),
                    };

                    resolve(updateCfg(cfg));
                });
            } else {
                reject(Error('Wrong config'));
            }
        }),
        [value.fn],
    );
    if (schema.status === 'pending') {
        return <SimpleLoader />;
    }
    if (schema.status === 'rejected') {
        return <span>{schema.error.message}</span>;
    }
    return <Form value={value} schema={schema.data} onChange={onChange} />;
}
export default PluginElement;
