import { css, cx } from 'emotion';
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { State } from '../../../data/Reducer/reducers';
import { StateActions } from '../../../data/actions';
import { Actions } from '../../../data/index';
import { Page } from '../../../data/selectors';

const pressed = css({ borderStyle: 'inset', outline: 'none' });
function press(value: boolean) {
  return cx({ [pressed]: value });
}
interface PageEditorHeaderProps {
  edition: boolean;
  src: boolean;
  page: Page | undefined;
  pageId?: string;
  dispatch: Dispatch<StateActions>;
}

function PageEditorHeader(props: PageEditorHeaderProps) {
  const label = props.page !== undefined ? props.page['@name'] : props.pageId;
  return (
    <div>
      <button
        className={press(props.edition)}
        onClick={() =>
          props.dispatch(Actions.EditorActions.pageEditMode(!props.edition))
        }
      >
        Edit
      </button>
      <button
        className={press(props.src)}
        onClick={() =>
          props.dispatch(Actions.EditorActions.pageSrcMode(!props.src))
        }
      >
        Src
      </button>
      <span>{`Loaded: ${label}`}</span>
    </div>
  );
}
export default connect(
  (state: State, props: { pageId?: string }) => ({
    page: Page.select(props.pageId),
    src: state.global.pageSrc,
    edition: state.global.pageEdit,
  }),
  dispatch => ({ dispatch }),
)(PageEditorHeader);
