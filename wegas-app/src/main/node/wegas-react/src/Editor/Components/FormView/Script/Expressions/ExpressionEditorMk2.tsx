import React from "react";
import { wlog } from "../../../../../Helper/wegaslog";
import { MessageString } from "../../../MessageString";
import { SrcEditorLanguages } from "../../../ScriptEditors/editorHelpers";
import { TempScriptEditor } from "../../../ScriptEditors/TempScriptEditor";
import { returnTypes, scriptEditStyle, ScriptView } from "../Script";
import { Attributes, generateSchema, makeItems, parseCode, WysiwygExpressionSchema } from "./expressionEditorHelpers";
import u from 'immer';
import { editor } from "monaco-editor";
import Form from "jsoninput";
import { ValidationError } from 'jsonschema/lib';
import { useStore } from "../../../../../data/Stores/store";
import { genVarItems } from "../../TreeVariableSelect";
import { State } from "../../../../../data/Reducer/reducers";
import { deepDifferent } from "../../../../../Components/Hooks/storeHookFactory";
import { GameModel } from "../../../../../data/selectors";



export interface ExpressionEditorProps extends ScriptView {
  code: string;
  id?: string;
  onChange?: (code: string) => void;
  mode?: ScriptMode;
  setError?: (errors: string[] | undefined) => void;
}


interface ExpressionEditorState {
  attributes?: Attributes;
  schema?: WysiwygExpressionSchema;
  error?: string | false;
  softError?: string[];
}

type FormStateActions =
  | {
      type: 'SET_IF_DEF';
      payload: ExpressionEditorState;
    }
  | {
      type: 'SET_ERROR';
      payload: { error: string };
    }
  | {
      type: 'UNSET_ERROR';
    }
  | {
      type: 'SET_SOFT_ERROR';
      payload: { error: string };
    };

//// Variable selection

function variableIdsSelector(s: State) {
  return Object.keys(s.variableDescriptors)
    .map(Number)
    .filter(k => !isNaN(k))
    .filter(k => GameModel.selectCurrent().itemsIds.includes(k));
}

/**
 * Should be done by looking at json files and prevent selection from variables without methods
 */
function selectableFn(item: IVariableDescriptor, _mode?: ScriptMode) {
  return item['@class'] !== 'ListDescriptor';
}



export function ExpressionEditorMk2({
  
  onChange,
  code,
  mode,
  //key,
  setError,
}: ExpressionEditorProps) {

  wlog(mode);
  wlog(code);
  wlog(onChange);
  wlog(setError);


  const [{ attributes, error, softError, schema }, dispatchFormState] = React.useReducer(setFormState, {});

  const variablesItems = useStore(s => {
    return genVarItems(variableIdsSelector(s), selectableFn, undefined, value =>
      makeItems(value, 'variable'),
    );
  }, deepDifferent);
  
  wlog('var items', variablesItems)
  //parse statement

  function languageFromMode(mode : ScriptMode | undefined): SrcEditorLanguages {
    return (mode === 'SET' || mode === 'GET') ? 'javascript': 'typescript';
  }

  const onScriptEditorChange = React.useCallback(
    (value: string) => {
      wlog('on script editor change', value)
    }, []
  );

  function setFormState(state: ExpressionEditorState, action: FormStateActions) {
    return u(state, (state: ExpressionEditorState) => {
      switch(action.type){
        case 'SET_IF_DEF': {
          const { attributes, error, schema } = action.payload;
          if (attributes != null && deepDifferent(attributes, state.attributes)) {
            state.attributes = attributes;
          }
          if (error != null && deepDifferent(error, state.error)) {
            state.error = error;
          }
          if (schema != null && deepDifferent(schema, state.schema)) {
            state.schema = schema;
          }
          break;
        }
      }
      wlog('set form state', state);
      wlog('set form action', action);
    })
  }

  const editorRef = React.useRef<editor.IStandaloneCodeEditor>();
  type FormOnChange = React.ComponentProps<typeof Form>['onChange'];


  React.useEffect(() => {
    const parsedCode = parseCode(code, mode);
    if(typeof parsedCode !== 'string'){

      generateSchema(parsedCode, variablesItems, mode).then(schema => {
        wlog('schema', schema);
        dispatchFormState({
          type: 'SET_IF_DEF',
          payload: { schema, attributes: parsedCode, error: false },
        });
      });
    }else{
      wlog('parsing error', parsedCode);
    }
  }, [code, mode, variablesItems])

  const onFormChange: FormOnChange = React.useCallback(
    (v: Attributes, e: ValidationError[]) => {
      wlog(v);
      wlog(e);
      
    }, []);

  return  (
    <div>
      <p>{code}</p>
      <p>{mode}</p>
      <div className={scriptEditStyle}>
          <MessageString type="error" value={(softError || []).join('\n')} />
          <p>ScriptEditor</p>
          <TempScriptEditor
            language={languageFromMode(mode)}
            initialValue={code}
            onChange={onScriptEditorChange}
            noGutter
            minimap={false}
            returnType={returnTypes(mode)}
            resizable
            onEditorReady={editor => (editorRef.current = editor)}
          />
          <p>Form</p>
          <Form
            value={attributes}
            schema={schema}
            onChange={onFormChange}
            context={attributes}
          />
      </div>

    </div>
    
  )
}