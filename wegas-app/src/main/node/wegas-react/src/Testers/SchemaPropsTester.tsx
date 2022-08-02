import { cx } from '@emotion/css';
import Form from 'jsoninput';
import { ValidationError } from 'jsonschema/lib';
import * as React from 'react';
import { IAbstractContentDescriptor, IScript } from 'wegas-ts-api';
//It's really important to import index.ts in order to have the widjets allready registered before using Form
import '../Components/FormView';
import { MessageString } from '../Components/MessageString';
import { Value } from '../Components/Outputs/Value';
import { schemaProps } from '../Components/PageComponents/tools/schemaProps';
import { themeVar } from '../Components/Theme/ThemeVars';
import { autoScroll, expandBoth, flex, flexColumn } from '../css/classes';
import { createScript } from '../Helper/wegasEntites';

const testSchema = {
  variable: schemaProps.scriptVariable({ label: 'Variable' }),
  translated: schemaProps.scriptString({ label: 'Translated', richText: true }),
  hidden: schemaProps.hidden({}),
  boolean: schemaProps.boolean({ label: 'Boolean' }),
  scriptableBoolean: schemaProps.scriptBoolean({ label: 'Script Boolean' }),
  number: schemaProps.number({ label: 'Number' }),
  string: schemaProps.string({ label: 'String' }),
  script: schemaProps.script({ label: 'Script' }),
  code: schemaProps.code({
    label: 'Code',
    scriptProps: { language: 'TypeScript' },
  }),
  select: schemaProps.select({
    label: 'Select',
    required: true,
    values: ['Option 1', 'Option 2', 'Option 3'],
  }),
  undefSelect: schemaProps.select({
    label: 'Undefined select',
    values: ['Option 1', 'Option 2', 'Option 3'],
  }),
  // simpleHashList: schemaProps.hashlist({
  //   label: 'Simple hashlist',
  //   required: true,
  // }),
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
  // multiLevelHashList: schemaProps.hashlist({
  //   label: 'Multilevel hashlist',
  //   required: true,
  //   choices: [
  //     {
  //       label: 'Attribute1',
  //       value: {
  //         prop: 'Attribute1',
  //       },
  //       items: [
  //         {
  //           label: 'Attribute 1.1',
  //           value: {
  //             prop: 'Attribute 1.1',
  //             schema: schemaProps.boolean({ label: 'Attribute 1.1' }),
  //           },
  //         },
  //       ],
  //     },
  //     {
  //       label: 'Attribute2',
  //       value: {
  //         prop: 'Attribute2',
  //         schema: schemaProps.select({
  //           label: 'Attribute2',
  //           required: true,
  //           values: ['A', 'B', 'C'],
  //         }),
  //       },
  //     },
  //   ],
  // }),
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
  // simpleHashList: UknownValuesObject;
  customizedHashList: UknownValuesObject;
  // multiLevelHashList: UknownValuesObject;
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
    // simpleHashList: {},
    customizedHashList: { Attribute1: 1, Attribute2: undefined },
    // customizedMultilevelHashList: {},
    // multiLevelHashList: { layout: { order: 1234567 } },
    // customizedMultilevelHashList: {
    //   nextlevel: { 'Next level attribute 1': '2' },
    // },
    file: undefined,
    greyFilterfile: undefined,
    objectArray: [],
  });
  const [errors, setErrors] = React.useState<ValidationError[]>([]);

  return (
    <div className={cx(flex, expandBoth, flexColumn, autoScroll)}>
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
          borderColor: themeVar.colors.PrimaryColor,
        }}
      >
        {Object.entries(values).map(([k, v]) => (
          <Value key={k} label={k} value={v} />
        ))}
      </div>
    </div>
  );
}
