import Form from "jsoninput";
import React from "react";
import { schemaProps } from "../../Components/PageComponents/tools/schemaProps";

const findAndReplaceSchema = {
    description : "Find and replace form layout",
    properties :{
        find: schemaProps.string(
        {
            label: 'Find',
            value: '',
        }),
        replace : schemaProps.string(
        {
            label: 'Replace',
            value : ''
        }),
        pretend : schemaProps.boolean({
            label : 'Simualte',
            value : true,
        }),
        matchCase : schemaProps.boolean({
            label : 'Match case',
            value : true
        }),        
        regex : schemaProps.boolean({
            label : 'Regex',
            value : true
        }),

        /*
        '@class': {
            value: 'FindAndReplacePayload',
            type: "string",
            view: {
                type: "hidden"
            }
        },

        pretend: {
            type: "boolean",
            value: true,
            view: {
                type: "boolean",
                label: "Simulate",
                description: "Only show differences",
                layout: 'shortInline'
            }
        },
        matchCase: {
            type: "boolean",
            value: false,
            view: {
                type: "boolean",
                label: "Match case",
                layout: 'shortInline',
                description: "case insensitive"
            }
        },
        regex: {
            type: "boolean",
            value: false,
            view: {
                className: 'wegas-advanced-feature',
                type: "boolean",
                label: "Regular Expression",
                layout: 'shortInline',
                description: "Use $1, $2, ..., $n"
            }
        },
        processVariables: {
            type: "boolean",
            value: true,
            view: {
                className: 'wegas-advanced-feature',
                type: "boolean",
                label: "Variables",
                description: "Search and replace in variables",
                layout: 'shortInline'
            }
        },
        processPages: {
            type: "boolean",
            value: false,
            view: {
                className: 'wegas-advanced-feature',
                type: "boolean",
                label: "Pages",
                description: "Search and replace in Pages",
                layout: 'shortInline'
            }
        },
        processStyles: {
            type: "boolean",
            value: false,
            view: {
                className: 'wegas-advanced-feature',
                type: "boolean",
                label: "Styles",
                description: "Search and replace in styles",
                layout: 'shortInline'
            }
        },
        processScripts: {
            type: "boolean",
            value: false,
            view: {
                className: 'wegas-advanced-feature',
                type: "boolean",
                label: "Scripts",
                description: "Search and replace in client/server scripts",
                layout: 'shortInline'
            }
        },
        languages: {
            type: "object",
            value: {},
            properties: {},
            visible: function(val, formValue) {
                return formValue.processVariables;
            },
            view: {
                className: "wegas-internal-feature",
                label: "Languages"
            }
        },
        roots: {
            type: "array",
            value: [],
            items: {
                type: "string",
                view: {
                    type: "treevariableselect",
                    layout: "shortInline",
                    label: ''
                }
            },
            visible: function(_val, formValue) {
                return formValue.processVariables;
            },
            view: {
                label: "Those Variables Only"
            }
        }*/
        
    }
}

interface FindAndReplacePayload {
    find: string,
    replace : string,

    //roots ?
    matchCase : boolean,
    regex : boolean,
    
    // processVariables : boolean,
    // processScripts : boolean,
    // processPages : boolean,
    // processSyles : boolean,

    //languages ?

}

export default function FindAndReplace() {

    const dflt : FindAndReplacePayload = {
        find: '',
        replace : '',
        matchCase : false,
        regex : true
    }

    const [state, setState] = React.useState<FindAndReplacePayload>(dflt);

    return(
        <>
            <h3>Find And Replace</h3>
            <p>{JSON.stringify(state)}</p>
            <Form 
                schema={findAndReplaceSchema}
                onChange={(v) => setState(v)}
                value={state}
            />
            
        </>
    );
}