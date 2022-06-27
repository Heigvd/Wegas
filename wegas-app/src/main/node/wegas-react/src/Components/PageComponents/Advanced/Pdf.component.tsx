import * as React from 'react';
import { IScript } from 'wegas-ts-api';
import { usePagesContextStateStore } from '../../../data/Stores/pageContextStore';
import { createFindVariableScript } from '../../../Helper/wegasEntites';
import {
  safeClientScriptEval
} from '../../Hooks/useScript';
import { Button } from '../../Inputs/Buttons/Button';
import {
  pageComponentFactory,
  registerComponent,
} from '../tools/componentFactory';
import { WegasComponentProps } from '../tools/EditableComponent';
import { schemaProps } from '../tools/schemaProps';

// Convert characters to HTML entities to protect against encoding issues:
function toEntities(text: string) {
  return text.replace(/[\u00A0-\u2666]/g, function (c) {
    return '&#' + c.charCodeAt(0) + ';';
  });
}


function post(postData: Record<string, string>) {
  const form = window.document.createElement("form");
  form.setAttribute("method", "post");
  form.setAttribute("action", "../print.html");
  form.setAttribute("target", "_blank");

  Object.entries(postData).forEach(([key, data]) => {
    const hiddenField = window.document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", key);
    hiddenField.setAttribute("value", data);
    form.appendChild(hiddenField);
  });

  window.document.body.appendChild(form);
  form.submit();
  form.remove();

}

export interface PdfPrinterProps extends WegasComponentProps {
  text?: IScript;
  title: string;
  stylesheet?: IScript;
}

function PdfPrinter({
  title,
  text,
  stylesheet,
  options,
  context
}: PdfPrinterProps) {
  const state = usePagesContextStateStore(s => s);

  const onClickCb = React.useCallback(() => {
    const data = safeClientScriptEval<string>(text, context, undefined, state, undefined);
    const css = stylesheet?.content ? `<style>${ stylesheet.content }</style>` : '';
    post({ title: toEntities(title), body: css + toEntities(data), outputType: 'pdf' });
  }, [text, state, context, title, stylesheet]);

  return <Button
    icon='file-pdf'
    onClick={ onClickCb }
    disabled={ options.disabled || options.locked }
  />
}

registerComponent(
  pageComponentFactory({
    component: PdfPrinter,
    componentType: 'Advanced',
    id: 'PdfPrinter',
    name: 'Pdf',
    icon: 'file-pdf',
    illustration: 'text',
    schema: {
      title: {
        value: '',
        view: {
          type: 'string',
          label: 'title'
        },
      },
      stylesheet: {
        view: {
          label: 'CSS',
          type: 'code',
          scriptProps: {
            language: 'CSS'
          }
        }
      },
      text: schemaProps.scriptString({ label: 'Text', richText: true }),
    },
    allowedVariables: ['TextDescriptor', 'StringDescriptor', 'StaticTextDescriptor', 'ListDescriptor'],
    getComputedPropsFromVariable: v => ({
      variable: createFindVariableScript(v),
    }),
  }),
);
