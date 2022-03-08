import { cx } from '@emotion/css';
import { useMonaco } from '@monaco-editor/react';
import * as React from 'react';
import { transpile } from 'typescript';
import { expandBoth, flex, flexColumn, grow } from '../css/classes';
import { MessageString } from '../Editor/Components/MessageString';
import {
  defunctionalizeScript,
  functionalizeScript,
  insertReturn,
  WegasScriptEditor,
} from '../Editor/Components/ScriptEditors/WegasScriptEditor';
import { wlog } from '../Helper/wegaslog';

const RETURN_TYPES = ['string'];
const STR_RETURN_TYPES = RETURN_TYPES.join(' | ');

const defaultValue = `import {test} from "./test";
"hello " + test`;

export default function ScriptParserTester() {
  const [value, setValue] = React.useState(defaultValue);
  const functionalized = functionalizeScript(value, STR_RETURN_TYPES);
  const defunctionalized = defunctionalizeScript(functionalized);
  const transpiled = insertReturn(transpile(defunctionalized));

  const [show, setShow] = React.useState({
    invalue: true,
    value: true,
    functionalized: true,
    defunctionalized: true,
    transpiled: true,
  });

  const reactMonaco = useMonaco();
  // wlog(reactMonaco?.editor.getModels().map(model => model.uri.toString()));
  wlog(reactMonaco?.editor.getModels().length);

  return (
    <div className={cx(flex, expandBoth, flexColumn)}>
      <div className={cx(grow, flex)}>
        <div className={cx(grow, flex, flexColumn)}>
          <h3
            onClick={() =>
              setShow(show => ({ ...show, invalue: !show.invalue }))
            }
          >
            In editor script
          </h3>
          {show.invalue && (
            <WegasScriptEditor
              value={value}
              onChange={setValue}
              noGutter
              minimap={false}
              returnType={RETURN_TYPES}
              language="typescript"
            />
          )}
        </div>
        <div className={cx(grow, flex, flexColumn)}>
          <h3
            onClick={() => setShow(show => ({ ...show, value: !show.value }))}
          >
            Raw script
          </h3>
          {show.value && (
            <WegasScriptEditor
              value={value}
              noGutter
              minimap={false}
              readOnly
              language="typescript"
            />
          )}
        </div>
      </div>
      <div className={cx(grow, flex)}>
        <div className={cx(grow, flex, flexColumn)}>
          <h3>Functionalized script</h3>
          <WegasScriptEditor
            value={functionalized}
            noGutter
            minimap={false}
            readOnly
            language="typescript"
          />
        </div>
        <div className={cx(grow, flex, flexColumn)}>
          <MessageString
            type={value === defunctionalized ? 'succes' : 'warning'}
            value={
              value === defunctionalized
                ? 'Defunctionalized script equals initial script'
                : 'Defunctionalized script is different from initial script'
            }
          />
          <WegasScriptEditor
            value={defunctionalized}
            noGutter
            minimap={false}
            readOnly
            language="typescript"
          />
        </div>
      </div>
      <div className={cx(grow, flex)}>
        <div className={cx(grow, flex, flexColumn)}>
          <h3>Transpiled script</h3>
          <WegasScriptEditor
            value={transpiled}
            noGutter
            minimap={false}
            readOnly
            language="javascript"
          />
        </div>
      </div>
    </div>
  );
}
