import * as React from 'react';
import { expandBoth, flex, flexColumn } from '../css/classes';
import { cx } from 'emotion';
import { ValidationError } from 'jsonschema/lib';
import { MessageString } from '../Editor/Components/MessageString';

//It's really important to import index.ts in order to have the widjets allready registered before using Form
import '../Editor/Components/FormView';
import { themeVar } from '../Components/Theme/ThemeVars';
import { ExpressionEditor } from '../Editor/Components/FormView/Script/Expressions/ExpressionEditor';

export default function SchemaPropsTester() {
  const [statement, setStatement] = React.useState<string>(
    'Variable.find(gameModel,"test").getValue(self) === "abc"',
  );

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
      <ExpressionEditor
        code={statement}
        onChange={v => {
          setStatement(v);
        }}
        mode="GET"
      />
      <div
        style={{
          margin: '20px',
          borderStyle: 'solid',
          borderColor: themeVar.colors.PrimaryColor,
        }}
      >
        {statement}
      </div>
    </div>
  );
}
