import { cx } from "@emotion/css";
import Form from "jsoninput";
import React from "react";
import { Button } from "../../Components/Inputs/Buttons/Button";
import { schemaProps } from "../../Components/PageComponents/tools/schemaProps";
import { defaultPadding, expandWidth, flex, flexColumn } from "../../css/classes";
// import { GameModel } from "../../data/selectors";
import { AvailableSchemas } from "./FormView";


// const languages : AvailableSchemas = schemaProps.object({
//     label : 'Languages',
//     properties : CurrentGM.languages.reduce<Record<string, AvailableSchemas>>((o,lang) => {
//         o[lang.code] = schemaProps.boolean({
//             label : lang.lang
//         });
//         return o;
//     }, {} )
    
// });

const findAndReplaceSchema : {description : string, properties : Record<keyof FindAndReplacePayload,AvailableSchemas>} = {
    description : "Find and replace form layout",
    properties :{
        "@class" : schemaProps.hidden({type : "string", value : 'FindAndReplacePayload'}),
        find: schemaProps.string(
        {
            label: 'Find',
            value: '',
            description : 'bla',
            
        }),
        replace : schemaProps.string(
        {
            label: 'Replace',
            value : '',
        }),
        pretend : schemaProps.boolean({
            label : 'Simulate',
            value : true,
            layout : "shortInline"
        }),
        matchCase : schemaProps.boolean({
            label : 'Match case',
            value : true,
            layout : "shortInline"
        }),        
        regex : schemaProps.boolean({
            label : 'Regex',
            value : true,
            layout : "shortInline"
        }),
        //Targets
        processVariables : schemaProps.boolean({
            label : 'Variables',
            value : true,
            layout : "shortInline"
        }),
        processScripts : schemaProps.boolean({
            label : 'Scripts',
            value : false,
            layout : "shortInline"
        }),
        processPages : schemaProps.boolean({
            label : 'Pages',
            value : false,
            layout : "shortInline"
        }),
        processStyles : schemaProps.boolean({
            label : 'Styles',
            value : false,
            layout : "shortInline"
        }),
        languages : schemaProps.object({
            label : 'Languages',
            properties : CurrentGM.languages.reduce<Record<string, AvailableSchemas>>((o,lang) => {
                o[lang.code] = schemaProps.boolean({
                    label : lang.lang,
                    layout : 'shortInline'
                });
                return o;
            }, {} )
        }),
        roots : schemaProps.array({
            label : 'Those Variables Only',
            itemSchema : schemaProps.variable({
                label : 'Talksdaklsjd',
            })
        }),
        /*
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

    '@class': 'FindAndReplacePayload',
    find: string,
    replace : string,

    //roots ?
    matchCase : boolean,
    regex : boolean,
    
    processVariables : boolean,
    processScripts : boolean,
    processPages : boolean,
    processStyles : boolean,

    pretend : boolean,

    languages : Record<string, boolean>,

    roots? : string[]
}

export default function FindAndReplace() {

    const dflt : FindAndReplacePayload = {
        '@class' : "FindAndReplacePayload",
        find: '',
        replace : '',
        matchCase : false,
        regex : true,
        processVariables : true,
        processScripts : false,
        processPages : false,
        processStyles : false,
        pretend : true,
        languages : {},
        roots : undefined
    }

    const [state, setState] = React.useState<FindAndReplacePayload>(dflt);


    return(
        <div className={cx(flex, flexColumn, expandWidth, defaultPadding)}>
            <h3>Find And Replace</h3>
            <Form 
                schema={findAndReplaceSchema}
                onChange={(v) => setState(v)}
                value={state}

            />
            <Button label="Haaa" onClick={() => alert('youhou')}/>
            <p>{JSON.stringify(state)}</p>
            
        </div>
    );
}