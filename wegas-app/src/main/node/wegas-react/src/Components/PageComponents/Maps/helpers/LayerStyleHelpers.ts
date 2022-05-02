import { entityIs } from '../../../../data/entities';
import { PagesContextState } from '../../../../data/Stores/pageContextStore';
import { safeClientScriptEval } from '../../../Hooks/useScript';

export function styleObjectToOLStyle(
  style: StyleFunction,
  context: UknownValuesObject | undefined,
  state: PagesContextState | undefined,
) {
  let styleObject: StyleObject | StyleObject[];
  if (entityIs(style, 'Script')) {
    styleObject = safeClientScriptEval<StyleObject | StyleObject[]>(
      style,
      context,
      undefined,
      state,
      undefined,
    );
  } else {
    styleObject = style;
  }

  if (!Array.isArray(styleObject)) {
    styleObject = [styleObject];
  }
}
