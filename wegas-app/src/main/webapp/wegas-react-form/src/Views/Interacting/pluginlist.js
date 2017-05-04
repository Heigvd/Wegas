import PropTypes from 'prop-types';
import React from 'react';
import { asyncReactor } from 'async-reactor';
import Form from 'jsoninput';
import Menu from '../../Components/Menu';
import { getY } from '../../index';

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
            cfg: undefined
        }
    }
};
function updateCfg(cfg) {
    const schema = JSON.parse(JSON.stringify(SCHEMA));
    schema.schema.properties.cfg = cfg;
    return schema;
}

const AsyncForm = asyncReactor(({ value, onChange }) => {
    const Y = getY();
    return new Promise(resolve => {
        let schema;
        if (value && value.fn) {
            Y.Wegas.use({ type: value.fn }, () => {
                // load required modules
                const targetPlg = Y.Plugin[value.fn];
                const w = new Y.Wegas.Text(); // Use this hack to retrieve a plugin config
                w.plug(targetPlg);
                const cfg = w[targetPlg.NS].getFormCfg();
                cfg.name = targetPlg.NAME;
                schema = updateCfg(cfg);
            });
        } else {
            schema = updateCfg();
        }
        resolve(<Form schema={schema} value={value} onChange={onChange} />);
    });
});
function PluginElement({ value, onChange, view }) {
    if (value && value.fn) {
        return <AsyncForm value={value} onChange={onChange} />;
    }
    return <Menu menu={view.choices} onChange={o => onChange({ fn: o })} />;
}
PluginElement.propTypes = {
    value: PropTypes.any,
    onChange: PropTypes.func.isRequired,
    view: PropTypes.object
};
export default PluginElement;
