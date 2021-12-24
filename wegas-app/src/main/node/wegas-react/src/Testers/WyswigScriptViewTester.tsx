import { cx } from '@emotion/css';
import Form from 'jsoninput';
import { ValidationError } from 'jsonschema/lib';
import * as React from 'react';
import { IScript } from 'wegas-ts-api';
import { Value } from '../Components/Outputs/Value';
import { schemaProps } from '../Components/PageComponents/tools/schemaProps';
import { themeVar } from '../Components/Theme/ThemeVars';
import { autoScroll, expandBoth, flex, flexColumn } from '../css/classes';
//It's really important to import index.ts in order to have the widjets allready registered before using Form
import '../Editor/Components/FormView';
import { MessageString } from '../Editor/Components/MessageString';
import { createScript } from '../Helper/wegasEntites';

const testSchema = {
  script1: schemaProps.script({ label: 'GET', mode: 'GET' }),
  script2: schemaProps.script({ label: 'SET', mode: 'SET' }),
  script3: schemaProps.script({ label: 'GET_CLIENT', mode: 'GET_CLIENT' }),
  script4: schemaProps.script({ label: 'SET_CLIENT', mode: 'SET_CLIENT' }),
};

interface SchemaPropsTesterState {
  script1: IScript;
  script2: IScript;
  script3: IScript;
  script4: IScript;
}

export default function SchemaPropsTester() {
  const [values, setValues] = React.useState<SchemaPropsTesterState>({
    script1: createScript(),
    script2: createScript(),
    script3: createScript(),
    script4: createScript(),
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
