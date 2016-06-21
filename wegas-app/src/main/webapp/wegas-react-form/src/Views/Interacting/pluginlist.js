import React from 'react';
import async from '../../HOC/async';
import Menu from '../../Components/Menu';
import Form from 'jsoninput';
import { getY } from '../../index';

const asyncForm = async(Form);

const SCHEMA = {
    schema: {
        type: 'object',
        properties: {
            fn: {
                index: -1,
                type: 'string',
                view: {
                    type: 'uneditable'
                }
            },
            cfg: undefined,
        }
    }
};
function updateCfg(cfg) {
    const schema = JSON.parse(JSON.stringify(SCHEMA));
    schema.schema.properties.cfg = cfg;
    return schema;
}
const AsyncForm = asyncForm(({ value }) => {
    const Y = getY();
    return new Promise(resolve => {
        if (value && value.fn) {
            Y.Wegas.use({ type: value.fn }, () => { // load required modules
                const targetPlg = Y.Plugin[value.fn];
                const w = new Y.Wegas.Text(); // Use this hack to retrieve a plugin config
                w.plug(targetPlg);
                const cfg = w[targetPlg.NS].getFormCfg();
                cfg.name = targetPlg.NAME;
                console.log(cfg);
                resolve(updateCfg(cfg));
            });
        } else {
            resolve(updateCfg());
        }
    });
});
function PluginElement({ value, onChange, view }) {
    if (value && value.fn) {
        return (
            <AsyncForm value={value} onChange={onChange} />
        );
    }
    return <Menu menu={view.choices} onChange={o => onChange({ fn: o }) } />;
}

export default PluginElement;
