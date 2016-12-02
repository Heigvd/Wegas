import { handleMethodArgs } from './args';

const IMPACT = {
    getter: {
        'RequestManager.sendCustomEvent': {
            label: 'Send popup',
            arguments: [{
                type: 'string',
                value: 'popupEvent',
                view: {
                    type: 'hidden'
                }
            }, {
                type: 'string',
                view: {
                    type: 'html'
                }
            }]
        },
        'Event.fire': {
            label: 'Fire event',
            arguments: [{
                type: 'string',
                required: true,
                view: { label: 'Event name' }
            }]
        },
        'DelayedEvent.delayedFire': {
            label: 'Fire delayed event',
            arguments: [
                {
                    type: 'number',
                    required: true,
                    view: { label: 'Minutes' }
                }, {
                    type: 'number',
                    scriptType: 'string',
                    required: true,
                    view: { label: 'Seconds' }
                }, {
                    type: 'string',
                    required: true,
                    view: { label: 'Event name' }
                }]
        }
    },
    condition: {
        'Event.fired': {
            returns: 'boolean',
            label: 'Event has been fired',
            arguments: [{
                type: 'string',
                view: { label: 'Event name' }
            }]
        }
    }
};
export function genChoices(type = 'getter') {
    const impacts = IMPACT[type];
    return Object.keys(impacts).map(k => ({
        label: impacts[k].label,
        value: k,
        className: impacts[k].className
    }));
}

export function handleArgs(method, args, onChange) {
    const methodDescr = IMPACT.getter[method] || IMPACT.condition[method];
    return handleMethodArgs(methodDescr, args, onChange);
}

export function methodDescriptor(member, method) {
    return IMPACT.condition[`${member}.${method}`] || IMPACT.getter[`${member}.${method}`];
}
export function labelForMethod(name) {
    const impact = IMPACT.condition[name] || IMPACT.getter[name];
    if (impact) {
        return impact.label;
    }
    return undefined;
}
