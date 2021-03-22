import * as React from 'react';
import { expandBoth, flex, flexColumn } from '../css/classes';
import { cx } from 'emotion';
import Form from 'jsoninput';
import { ValidationError } from 'jsonschema/lib';
import { Value } from '../Components/Outputs/Value';
import { MessageString } from '../Editor/Components/MessageString';
import { schemaProps } from '../Components/PageComponents/tools/schemaProps';
import { createScript } from '../Helper/wegasEntites';

//It's really important to import index.ts in order to have the widjets allready registered before using Form
import '../Editor/Components/FormView';
import { themeVar } from '../Components/Style/ThemeVars';
import { IScript, IAbstractContentDescriptor } from 'wegas-ts-api';

const testSchema = {
  variable: schemaProps.scriptVariable({ label: 'Variable' }),
  translated: schemaProps.scriptString({ label: 'Translated', richText: true }),
  hidden: schemaProps.hidden({}),
  boolean: schemaProps.boolean({ label: 'Boolean' }),
  scriptableBoolean: schemaProps.scriptBoolean({ label: 'Script Boolean' }),
  number: schemaProps.number({ label: 'Number' }),
  string: schemaProps.string({ label: 'String' }),
  script: schemaProps.script({ label: 'Script' }),
  code: schemaProps.code({ label: 'Code' }),
  select: schemaProps.select({
    label: 'Select',
    required: true,
    values: ['Option 1', 'Option 2', 'Option 3'],
  }),
  undefSelect: schemaProps.select({
    label: 'Undefined select',
    values: ['Option 1', 'Option 2', 'Option 3'],
  }),
  simpleHashList: schemaProps.hashlist({
    label: 'Simple hashlist',
    required: true,
  }),
  customizedHashList: schemaProps.hashlist({
    label: 'Customized hashlist',
    required: true,
    choices: [
      {
        label: 'Attribute1',
        value: {
          prop: 'Attribute1',
          schema: schemaProps.select({
            label: 'Attribute1',
            required: true,
            values: ['1', '2', '3'],
          }),
        },
      },
      {
        label: 'Attribute2',
        value: {
          prop: 'Attribute2',
          schema: schemaProps.select({
            label: 'Attribute2',
            required: true,
            values: ['A', 'B', 'C'],
          }),
        },
      },
    ],
  }),
  // customizedMultilevelHashList: wegasComponentExtraSchema('FLEX').options,
  file: schemaProps.file({ label: 'File' }),
  greyFilterfile: schemaProps.file({
    label: 'Filtered audio file',
    pickType: 'FILE',
    filter: {
      filterType: 'grey',
      fileType: 'audio',
    },
  }),
  objectArray: schemaProps.array({
    label: 'Conditionnal classes',
    itemSchema: {
      className: schemaProps.string({ label: 'Class' }),
      condition: schemaProps.script({
        label: 'Condition',
        mode: 'GET',
        language: 'TypeScript',
        value: 'false',
      }),
    },
  }),
};

interface SchemaPropsTesterState {
  variable: IScript;
  translated: IScript;
  hidden: string[];
  boolean: boolean;
  scriptableBoolean: IScript;
  number: number;
  string: string;
  script: IScript;
  code: object;
  select: string;
  undefSelect?: string;
  simpleHashList: {};
  customizedHashList: {};
  customizedMultilevelHashList: {};
  file?: IAbstractContentDescriptor;
  greyFilterfile?: IAbstractContentDescriptor;
  objectArray?: { className?: string; condition?: IScript }[];
}

export default function SchemaPropsTester() {
  const [values, setValues] = React.useState<SchemaPropsTesterState>({
    variable: createScript(),
    translated: createScript(
      "I18n.toString(Variable.find(gameModel,'infoboxPhaseActuelle'))",
    ),
    hidden: ['hidden'],
    boolean: false,
    scriptableBoolean: createScript(
      'Variable.find(gameModel,"infoboxPhaseActuelle")',
    ),
    number: 0,
    string: '',
    script: createScript(),
    code: {},
    select: 'Option 1',
    undefSelect: undefined,
    simpleHashList: {},
    customizedHashList: {},
    // customizedMultilevelHashList: {},
    customizedMultilevelHashList: { layout: { order: 1234567 } },
    // customizedMultilevelHashList: {
    //   nextlevel: { 'Next level attribute 1': '2' },
    // },
    file: undefined,
    greyFilterfile: undefined,
    objectArray: [],
  });
  const [errors, setErrors] = React.useState<ValidationError[]>([]);

  return (
    <div className={cx(flex, expandBoth, flexColumn)}>
      {errors.length > 0 && (
        <MessageString
          value={JSON.stringify(errors)}
          duration={10000}
          onLabelVanish={() => setErrors([])}
          type="error"
        />
      )}
      <Form
        value={values}
        schema={{
          description: 'TestSchema',
          properties: testSchema,
        }}
        onChange={(v, e) => {
          setValues(v);
          setErrors(e);
        }}
      />
      <div
        style={{
          margin: '20px',
          borderStyle: 'solid',
          borderColor: themeVar.Common.colors.PrimaryColor,
        }}
      >
        {Object.entries(values).map(([k, v]) => (
          <Value key={k} label={k} value={v} />
        ))}
      </div>
    </div>
  );
}
