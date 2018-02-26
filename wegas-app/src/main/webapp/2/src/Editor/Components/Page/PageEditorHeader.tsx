import * as React from 'react';
import { css } from 'glamor';
import { AnyAction } from 'redux';
import { Actions } from '../../../data/index';
import { connect } from 'react-redux';
import { Page } from '../../../data/selectors';
import { State } from '../../../data/Reducer/reducers';
import { Menu } from '../../../Components/Menu';

const pressed = css({ borderStyle: 'inset', outline: 'none' });
function press(value: boolean) {
  return value ? pressed : {};
}
interface PageEditorHeaderProps {
  edition: boolean;
  src: boolean;
  page: Page | undefined;
  pageId?: string;
  dispatch: (action: AnyAction) => void;
}

function PageEditorHeader(props: PageEditorHeaderProps) {
  const label = props.page !== undefined ? props.page['@name'] : props.pageId;
  return (
    <div>
      <button
        {...press(props.edition)}
        onClick={() =>
          props.dispatch(Actions.EditorActions.pageEditMode(!props.edition))
        }
      >
        Edit
      </button>
      <button
        {...press(props.src)}
        onClick={() =>
          props.dispatch(Actions.EditorActions.pageSrcMode(!props.src))
        }
      >
        Src
      </button>
      <Menu
        onSelect={a => console.log(a)}
        items={[
          {
            label: 'hello',
            disabled: true,
            children: [
              {
                label: 'Yoo',
                value: 'really',
              },
              {
                label: 'Yoooo2',
                value: 'really2',
              },
            ],
          },
          { label: 'None here', disabled: true },
          { label: 'world', value: 'world' },
        ]}
        label={`Loaded:${label}`}
      />
    </div>
  );
}
export default connect(
  (state: State, props: { pageId?: string }) => ({
    page: Page.select(props.pageId),
    src: state.global.pageSrc,
    edition: state.global.pageEdit,
  }),
  dispatch => ({ dispatch })
)(PageEditorHeader);
