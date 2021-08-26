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
import { themeVar } from '../Components/Theme/ThemeVars';
import { IScript } from 'wegas-ts-api';

const testSchema = {
  script1: schemaProps.script({ label: 'Script', mode: 'GET' }),
  script2: schemaProps.script({ label: 'Script', mode: 'SET' }),
};

interface SchemaPropsTesterState {
  script1: IScript;
  script2: IScript;
}

export default function SchemaPropsTester() {
  const [values, setValues] = React.useState<SchemaPropsTesterState>({
    script1: createScript(),
    script2: createScript(),
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
