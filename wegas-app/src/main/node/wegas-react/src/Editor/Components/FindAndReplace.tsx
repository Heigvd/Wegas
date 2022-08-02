import { css, cx } from '@emotion/css';
import Form from 'jsoninput';
import React from 'react';
import { FindAndReplaceAPI } from '../../API/utils.api';
import { AvailableSchemas } from '../../Components/FormView';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { HTMLText } from '../../Components/Outputs/HTMLText';
import { schemaProps } from '../../Components/PageComponents/tools/schemaProps';
import {
  autoScroll,
  defaultPadding,
  expandWidth,
  flex,
  flexColumn,
} from '../../css/classes';
import { findAndReplaceStyle } from '../../css/findAndReplace';
import { manageResponseHandler } from '../../data/actions';
import { store } from '../../data/Stores/store';

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
      description: 'Dry run, only show',
    }),
    matchCase: schemaProps.boolean({
      label: 'Match case',
      value: true,
      layout: 'shortInline',
      description: 'Case sensitive',
    }),
    regex: schemaProps.boolean({
      label: 'Regex',
      value: true,
      layout: 'shortInline',
      description: 'Use $1, $2, ...',
    }),
    //Targets
    processVariables: schemaProps.boolean({
      label: 'Variables',
      value: true,
      layout: 'shortInline',
      description: 'Search & replace in variables',
    }),
    processScripts: schemaProps.boolean({
      label: 'Scripts',
      value: false,
      layout: 'shortInline',
      description: 'Search & replace in client/server scripts',
    }),
    processPages: schemaProps.boolean({
      label: 'Pages',
      value: false,
      layout: 'shortInline',
      description: 'Search & replace in pages',
    }),
    processStyles: schemaProps.boolean({
      label: 'Styles',
      value: false,
      layout: 'shortInline',
      description: 'Search & replace in styles',
    }),
    // Languages
    languages: schemaProps.object({
      label: 'Languages',
      featureLevel: 'INTERNAL',
      visible: (_, formValue: FindAndReplacePayload) => {
        return formValue.processVariables;
      },

      properties: CurrentGM.languages.reduce<Record<string, AvailableSchemas>>(
        (o, lang) => {
          o[lang.code] = schemaProps.boolean({
            label: lang.lang,
            layout: 'shortInline',
            value: true,
          });
          return o;
        },
        {},
      ),
    }),
    // Selected variables
    roots: {
      type: 'array',
      items: schemaProps.variable({}),
      view: {
        type: 'array',
        label: 'Those Variables Only',
      },
      visible: (_, formValue: FindAndReplacePayload) => {
        return formValue.processVariables;
      },
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
  languages: CurrentGM.languages.reduce<Record<string, boolean>>((prev, v) => {
    prev[v.code] = true;
    return prev;
  }, {}),
  roots: undefined,
};

export default function FindAndReplace() {
  const [state, setState] = React.useState<FindAndReplacePayload>(dflt);
  const [result, setResult] = React.useState('');

  const sendRequest = React.useCallback(() => {
    // We admit that confirm can be used here as the changes are very consistant
    // Its also a very internal feature that shouldn't be used by standard wegas users
    // eslint-disable-next-line no-alert
    if (state.pretend || confirm('This cannot be cancelled, are you sure ?')) {
      setResult(
        '<h4 class="find-result-waiting">Performing find and replace...</h4>',
      );

      FindAndReplaceAPI()
        .findAndReplace(state)
        .then(v => {
          // Pop first updatedEntity as its not WegasEntity but string
          const textAnswer = v.updatedEntities.splice(
            0,
            1,
          )[0] as unknown as string;
          if (textAnswer) {
            setResult(textAnswer);
          } else {
            setResult('<h4 class="find-result-empty">No results</h4>');
          }
          if (!state.pretend) {
            store.dispatch(manageResponseHandler(v));
          }
        });
    }
  }, [state]);

  const dryrunDisplay = 'Find & Replace' + (state.pretend ? ' (dry run)' : '');

  return (
    <div
      className={cx(flex, flexColumn, expandWidth, defaultPadding, autoScroll)}
    >
      <h3>Find &amp; Replace</h3>
      <Form
        schema={findAndReplaceSchema}
        onChange={v => setState(v)}
        value={state}
      />
      <Button
        label={dryrunDisplay}
        className={css({ width: 'fit-content' })}
        onClick={sendRequest}
      />
      <HTMLText className={findAndReplaceStyle} text={result} />
    </div>
  );
}
