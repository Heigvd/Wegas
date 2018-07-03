import { css, cx } from 'emotion';
import * as React from 'react';
import { State } from '../../../data/Reducer/reducers';
import { Actions } from '../../../data';
import { Page } from '../../../data/selectors';
import { StoreConsumer } from '../../../data/store';

const pressed = css({ borderStyle: 'inset', outline: 'none' });
function press(value: boolean) {
  return cx({ [pressed]: value });
}
interface PageEditorHeaderProps {
  pageId?: string;
}

export default function PageEditorHeader(props: PageEditorHeaderProps) {
  return (
    <StoreConsumer
      selector={(s: State) => ({
        page: Page.select(props.pageId),
        src: s.global.pageSrc,
        edition: s.global.pageEdit,
      })}
    >
      {({ state, dispatch }) => {
        const label =
          state.page !== undefined ? state.page['@name'] : props.pageId;
        return (
          <div>
            <button
              className={press(state.edition)}
              onClick={() =>
                dispatch(Actions.EditorActions.pageEditMode(!state.edition))
              }
            >
              Edit
            </button>
            <button
              className={press(state.src)}
              onClick={() =>
                dispatch(Actions.EditorActions.pageSrcMode(!state.src))
              }
            >
              Src
            </button>
            <span>{`Loaded: ${label}`}</span>
          </div>
        );
      }}
    </StoreConsumer>
  );
}
