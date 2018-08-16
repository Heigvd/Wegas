import { css, cx } from 'emotion';
import * as React from 'react';
import { State } from '../../../data/Reducer/reducers';
import { Actions } from '../../../data';
import { Page, GameModel } from '../../../data/selectors';
import { StoreConsumer, StoreDispatch } from '../../../data/store';
import { Menu } from '../../../Components/Menu';
import { PageAPI, PageIndex } from '../../../API/pages.api';
import { IconButton } from '../../../Components/Button/IconButton';

const pressed = css({ borderStyle: 'inset', outline: 'none' });
function press(value: boolean) {
  return cx({ [pressed]: value });
}
interface PageSelectorState {
  index: { label: string | React.ReactElement<any>; id?: string }[];
}
class PageSelector extends React.Component<
  {
    dispatch: StoreDispatch;
    label?: string;
  },
  PageSelectorState
> {
  readonly state: Readonly<PageSelectorState> = {
    index: [],
  };
  mounted: boolean = true;
  onPageChange = (id: string) =>
    this.props.dispatch(Actions.EditorActions.pageLoadId(id));

  onPageCreate = () =>
    this.props
      .dispatch(
        Actions.PageActions.createPage({
          type: 'Layout/List',
          props: {
            children: [],
            style: {
              width: '100%',
              height: '100%',
            },
          },
        }),
      )
      .then(res => {
        Object.keys(res.payload.pages).forEach(k => {
          this.props.dispatch(Actions.EditorActions.pageLoadId(k));
        });
      });
  buildIndex = (index: PageIndex) => {
    if (this.mounted) {
      this.setState({
        index: index
          .map(i => ({
            label: (
              <span>
                {i.name ? `${i.name} (${i.id})` : i.id}
                <IconButton
                  icon="trash"
                  onClick={e => {
                    e.stopPropagation();
                    this.props
                      .dispatch(Actions.PageActions.deletePage(i.id))
                      .then(index => {
                        this.buildIndex(index.payload);
                      });
                  }}
                />
              </span>
            ) as string | React.ReactElement<any>,
            id: i.id as string | undefined,
          }))
          .concat([{ label: <IconButton icon="plus" />, id: undefined }]),
      });
    }
  };
  loadIndex = () => {
    PageAPI.getIndex(GameModel.selectCurrent().id!).then(res =>
      this.buildIndex(res),
    );
  };
  componentWillUnmount() {
    this.mounted = false;
  }
  render() {
    return (
      <Menu
        label={this.props.label}
        onOpen={this.loadIndex}
        items={this.state.index}
        onSelect={i => (i.id ? this.onPageChange(i.id) : this.onPageCreate())}
      />
    );
  }
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
          state.page !== undefined
            ? state.page['@name'] != null
              ? state.page['@name']!
              : `Unnamed ${props.pageId}`
            : props.pageId;
        return (
          <div>
            <button
              className={press(state.src)}
              onClick={() =>
                dispatch(Actions.EditorActions.pageSrcMode(!state.src))
              }
            >
              Src
            </button>
            <PageSelector label={label} dispatch={dispatch} />
          </div>
        );
      }}
    </StoreConsumer>
  );
}
