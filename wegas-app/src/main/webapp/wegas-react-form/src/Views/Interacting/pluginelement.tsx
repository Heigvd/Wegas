import React from 'react';
import { asyncReactor } from 'async-reactor';
import Form from 'jsoninput';
import { getY } from '../../index';

const SCHEMA = {
    type: 'object',
    properties: {
        fn: {
            index: -1,
            type: 'string',
            view: {
                type: 'uneditable',
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
function PluginElement({ value, onChange, view }:
    { value: { fn: string }, onChange: (value: object) => void, view: { choices: {}[] } }) {
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
                    schema = updateCfg(cfg);
                    resolve(<Form schema={schema} value={value} onChange={onChange} />);
                });
            }
        });
    }, () => <i>Loading ...</i>);
    if (value && value.fn) {
        return <AsyncForm value={value} onChange={onChange} />;
    }
    return <span>Wrong config</span>;
}
export default PluginElement;
