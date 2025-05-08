import { cx } from '@emotion/css';
import { useMonaco } from '@monaco-editor/react';
import * as React from 'react';
import { transpile } from 'typescript';
import { useTempModel } from '../Components/Contexts/LibrariesContext';
import { insertReturn } from '../Components/Hooks/useScript';
import { expandBoth, flex, flexColumn, grow } from '../css/classes';
import { MessageString } from '../Editor/Components/MessageString';
import SrcEditor from '../Editor/Components/ScriptEditors/SrcEditor';
import {
  defunctionalizeScript,
  functionalizeScript,
  TempScriptEditor,
} from '../Editor/Components/ScriptEditors/TempScriptEditor';

const RETURN_TYPES = ['string'];
const STR_RETURN_TYPES = RETURN_TYPES.join(' | ');

const defaultValue = `import {test} from "./test";
"hello " + test`;

export default function ScriptParserTester() {
  const [workingFunct, setWorkingFunct] = React.useState(true);
  const valueModel = useTempModel(defaultValue, 'typescript');
  const functionalizedModel = useTempModel(defaultValue, 'typescript');
  const defunctionalizedModel = useTempModel(defaultValue, 'typescript');
  const transpiledModel = useTempModel(defaultValue, 'typescript');

  const onChange = React.useCallback(
    (newVal: string) => {
      valueModel?.setValue(newVal);
      const functionalized = functionalizeScript(newVal, STR_RETURN_TYPES);
      const defunctionalized = defunctionalizeScript(functionalized);
      functionalizedModel?.setValue(functionalized);
      defunctionalizedModel?.setValue(defunctionalized);
      transpiledModel?.setValue(insertReturn(transpile(defunctionalized)));
      setWorkingFunct(newVal === defunctionalized);
    },
    [defunctionalizedModel, functionalizedModel, transpiledModel, valueModel],
  );

  const [show, setShow] = React.useState({
    invalue: true,
    value: true,
    functionalized: true,
    defunctionalized: true,
    transpiled: true,
  });

  const reactMonaco = useMonaco();

  reactMonaco?.editor.onDidCreateModel(() => {
    reactMonaco?.editor.getModels().length;
  });
  reactMonaco?.editor.onWillDisposeModel(() => {
    reactMonaco?.editor.getModels().length;
  });

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
            <TempScriptEditor
              initialValue={defaultValue}
              onChange={onChange}
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
            <SrcEditor
              // value={value}
              fileName={valueModel?.uri.toString()}
              noGutter
              minimap={false}
              readOnly
              // language="typescript"
            />
          )}
        </div>
      </div>
      <div className={cx(grow, flex)}>
        <div className={cx(grow, flex, flexColumn)}>
          <h3>Functionalized script</h3>
          <SrcEditor
            fileName={functionalizedModel?.uri.toString()}
            noGutter
            minimap={false}
            readOnly
          />
        </div>
        <div className={cx(grow, flex, flexColumn)}>
          <MessageString
            type={workingFunct ? 'succes' : 'warning'}
            value={
              workingFunct
                ? 'Defunctionalized script equals initial script'
                : 'Defunctionalized script is different from initial script'
            }
          />
          <SrcEditor
            // value={defunctionalized}
            fileName={defunctionalizedModel?.uri.toString()}
            noGutter
            minimap={false}
            readOnly
            // language="typescript"
          />
        </div>
      </div>
      <div className={cx(grow, flex)}>
        <div className={cx(grow, flex, flexColumn)}>
          <h3>Transpiled script</h3>
          <SrcEditor
            fileName={transpiledModel?.uri.toString()}
            noGutter
            minimap={false}
            readOnly
            // language="javascript"
          />
        </div>
      </div>
    </div>
  );
}
