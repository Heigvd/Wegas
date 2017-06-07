import React from 'react';
import { asyncReactor } from 'async-reactor';
import Form from 'jsoninput';
import { getY } from '../../index';

// Temporary solution until the friendly name is added as a standard widget attribute?
function friendlyName(label: string) {
    switch (label) {
        case 'OpenPageAction': return 'Open page';
        case 'OpenUrlAction': return 'Open URL';
        case 'ExecuteScriptAction': return 'Impact variables';
        case 'OpenPanelPageloader': return 'Open Popup page';
        case 'PlaySoundAction': return 'Play sound';
        case 'PrintActionPlugin': return 'Print Variables';
        case 'Tooltip': return 'Tooltip';
        case 'CSSBackground': return 'Background';
        case 'CSSPosition': return 'Position';
        case 'CSSSize': return 'Size';
        case 'CSSText': return 'Text';
        case 'CSSStyles': return 'Other styles';
        case 'ShowAfter': return 'Show after';
        case 'HideAfter': return 'Hide after';
        case 'ConditionalDisable': return 'Conditional disable';
        case 'UnreadCount': return 'Unread count';
        case 'Lockable': return 'Lock';
        default: return 'internal error'
    };
};

const SCHEMA = {
    type: 'object',
    properties: {
        fn: {
            index: -1,
            type: 'string',
            view: {
                type: 'hidden' // 'uneditable'
            },
        },
        cfg: {},
    },
};
function updateCfg(cfg: typeof SCHEMA) {
    const schema: typeof SCHEMA = JSON.parse(JSON.stringify(SCHEMA));
    schema.properties.cfg = cfg;
    return schema;
}
interface IValue {
    fn: string;
    cfg: { [key: string]: any };
}
const Y = getY();
const AsyncForm = asyncReactor(({ value, onChange }:
    { value: IValue, onChange: (value: IValue) => void }) => {

    return new Promise((resolve) => {
        let schema;
        if (value && value.fn) {
            Y.Wegas.use({ type: value.fn }, () => {
                // load required modules
                const targetPlg = Y.Plugin[value.fn] as Y.Plugin_Base;
                const w: Y.Plugin_Host = new Y.Wegas.Text(); // Use this hack to retrieve a plugin config
                w.plug(targetPlg);
                const cfg = (w as any)[targetPlg.NS].getFormCfg();
                cfg.name = targetPlg.NAME;
                cfg.view = { label: friendlyName(targetPlg.NAME) };
                schema = updateCfg(cfg);
                resolve(<Form schema={schema} value={value} onChange={onChange} />);
            });
        }
    });
}, () => <i>Loading ...</i>);
function PluginElement({ value, onChange, view }:
    { value: { fn: string }, onChange: (value: object) => void, view: { choices: {}[] } }) {
    if (value && value.fn) {
        return <AsyncForm key={value.fn} value={value} onChange={onChange} />;
    }
    return <span>Wrong config</span>;
}
export default PluginElement;
