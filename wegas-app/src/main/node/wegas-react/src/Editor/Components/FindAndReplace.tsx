import { cx } from '@emotion/css';
import Form from 'jsoninput';
import React from 'react';
import { FindAndReplaceAPI } from '../../API/utils.api';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { HTMLText } from '../../Components/Outputs/HTMLText';
import { schemaProps } from '../../Components/PageComponents/tools/schemaProps';
import {
  defaultPadding,
  expandWidth,
  flex,
  flexColumn,
} from '../../css/classes';
import { findAndReplaceStyle } from '../../css/findAndReplace';
import { wlog } from '../../Helper/wegaslog';
import { AvailableSchemas } from './FormView';

const findAndReplaceSchema: {
  description: string;
  properties: Record<keyof FindAndReplacePayload, AvailableSchemas>;
} = {
  description: 'Find and replace form descriptor',
  properties: {
    '@class': schemaProps.hidden({
      type: 'string',
      value: 'FindAndReplacePayload',
    }),
    find: schemaProps.string({
      label: 'Find',
      value: '',
    }),
    replace: schemaProps.string({
      label: 'Replace',
      value: '',
    }),
    pretend: schemaProps.boolean({
      label: 'Simulate',
      value: true,
      layout: 'shortInline',
    }),
    matchCase: schemaProps.boolean({
      label: 'Match case',
      value: true,
      layout: 'shortInline',
    }),
    regex: schemaProps.boolean({
      label: 'Regex',
      value: true,
      layout: 'shortInline',
    }),
    //Targets
    processVariables: schemaProps.boolean({
      label: 'Variables',
      value: true,
      layout: 'shortInline',
    }),
    processScripts: schemaProps.boolean({
      label: 'Scripts',
      value: false,
      layout: 'shortInline',
    }),
    processPages: schemaProps.boolean({
      label: 'Pages',
      value: false,
      layout: 'shortInline',
    }),
    processStyles: schemaProps.boolean({
      label: 'Styles',
      value: false,
      layout: 'shortInline',
    }),
    languages: schemaProps.object({
      label: 'Languages',
      properties: CurrentGM.languages.reduce<Record<string, AvailableSchemas>>(
        (o, lang) => {
          o[lang.code] = schemaProps.boolean({
            label: lang.lang,
            layout: 'shortInline',
            value: true
          });
          return o;
        },
        {},
      ),
      
    }),
    roots: {
      type: 'array',
      items: schemaProps.variable({}),
      view: {
        type: 'array',
        label: 'Those Variables Only',
      },
      visible: () => {return true}
    },
  },
};

export interface FindAndReplacePayload {
  '@class': 'FindAndReplacePayload';
  find: string;
  replace: string;

  matchCase: boolean;
  regex: boolean;

  processVariables: boolean;
  processScripts: boolean;
  processPages: boolean;
  processStyles: boolean;

  pretend: boolean;

  languages: Record<string, boolean>;

  roots?: string[];
}

export default function FindAndReplace() {
  
    const dflt: FindAndReplacePayload = {
        '@class': 'FindAndReplacePayload',
        find: '',
        replace: '',
        matchCase: false,
        regex: true,
        processVariables: true,
        processScripts: false,
        processPages: false,
        processStyles: false,
        pretend: true,
        languages: {},
        roots: undefined,
    };

    const [state, setState] = React.useState<FindAndReplacePayload>(dflt);
    const [result, setResult] = React.useState('');
    
    const sendRequest = React.useCallback(() => {
        FindAndReplaceAPI().findAndReplace(state).then( (v) => {
          wlog(v);
          setResult(v);
        });
    }, [state])

    return (
        <div className={cx(flex, flexColumn, expandWidth, defaultPadding)}>
            <h3>Find &amp; Replace</h3>
            <Form
                schema={findAndReplaceSchema}
                onChange={v => setState(v)}
                value={state}
            />
            <Button label="Find &amp; Replace" onClick={sendRequest}/>
            <p>{JSON.stringify(state)}</p>
            <HTMLText className={findAndReplaceStyle} text={result}/>
        </div>
    );
}
