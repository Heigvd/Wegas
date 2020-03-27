import * as React from 'react';
import { Toolbar } from '../../../Components/Toolbar';
import { Container, Node } from '../Views/TreeView';
import { wlog } from '../../../Helper/wegaslog';
import { PageAPI, isPageItem } from '../../../API/pages.api';
import { flex, flexColumn } from '../../../css/classes';
import { cx, css } from 'emotion';
import { FontAwesome } from '../Views/FontAwesome';
import { nodeContentStyle } from '../Variable/VariableTree';
import { omit } from 'lodash-es';
import { Menu } from '../../../Components/Menu';
import { TextPrompt } from '../TextPrompt';
import { ConfirmButton } from '../../../Components/Inputs/Button/ConfirmButton';

const bulletCSS = {
  width: '1em',
};

const titleLabelStyle = css({
  flex: '0 0 auto',
});

interface WegasComponentNodeProps {
  component: WegasComponent;
  nodeProps: () => {};
  path: number[];
}

const compToKey = (component: WegasComponent) =>
  JSON.stringify({
    type: component.type,
    props: omit(component.props, 'children'),
  });

function WegasComponentNode({
  component,
  nodeProps,
  path,
}: WegasComponentNodeProps) {
  const Title = () => (
    <span className={nodeContentStyle}>
      <FontAwesome icon={'circle'} style={bulletCSS} />
      {component.type}
      {'name' in component.props ? ` : ${component.props.name}` : ''}
    </span>
  );

  return (
    <Node {...nodeProps()} header={<Title />} id={compToKey(component)}>
      {({ nodeProps }) =>
        component.props?.children?.map((childComponent, i) => (
          <WegasComponentNode
            key={compToKey(childComponent)}
            nodeProps={nodeProps}
            component={childComponent}
            path={[...path, i]}
          />
        )) || null
      }
    </Node>
  );
}

interface PagesLayoutNodeProps {
  indexItem: PageIndexItem;
  path: string[];
  indexItemControls: IndexItemControls;
  componentControls: ComponentControls;
  nodeProps: () => {};
}

function PageIndexItemNode({
  indexItem,
  path,
  indexItemControls,
  componentControls,
  nodeProps,
}: PagesLayoutNodeProps): JSX.Element | null {
  const newPath = [
    ...path,
    isPageItem(indexItem) ? indexItem.id! : indexItem.name,
  ];
  const { onDeleteIndexItem } = indexItemControls;
  const [page, setPage] = React.useState<WegasComponent>();
  const [error, setError] = React.useState<string>();

  React.useEffect(() => {
    if (isPageItem(indexItem)) {
      PageAPI.get(indexItem.id!)
        .then(res => setPage(res[indexItem.id!]))
        .catch((res: Response) => setError(res.statusText));
    }
  }, [indexItem]);

  const Title = () => (
    <span className={nodeContentStyle}>
      <FontAwesome
        icon={
          error
            ? 'exclamation-circle'
            : isPageItem(indexItem)
            ? 'file'
            : 'folder'
        }
        style={bulletCSS}
      />
      {error ? (
        <span
          className={titleLabelStyle}
        >{`${indexItem.name} : ${error}`}</span>
      ) : (
        <>
          <span className={titleLabelStyle}>{indexItem.name}</span>
          <ConfirmButton
            icon="trash"
            onAction={success => success && onDeleteIndexItem(newPath)}
          />
        </>
      )}
    </span>
  );

  return isPageItem(indexItem) ? (
    page ? (
      <Node {...nodeProps()} header={<Title />} id={indexItem.name}>
        {({ nodeProps }) => [
          <WegasComponentNode
            key={indexItem.name + 'FIRSTCOMPONENT'}
            nodeProps={nodeProps}
            component={page}
            path={[0]}
          />,
        ]}
      </Node>
    ) : error ? (
      <Node {...nodeProps()} header={<Title />} id={indexItem.name}>
        {() => null}
      </Node>
    ) : (
      <span>Loading ...</span>
    )
  ) : (
    <Node {...nodeProps()} header={<Title />} id={indexItem.name}>
      {({ nodeProps }) =>
        indexItem.items.map(v => (
          <PageIndexItemNode
            nodeProps={nodeProps}
            key={v.name}
            indexItem={v}
            path={newPath}
            indexItemControls={indexItemControls}
            componentControls={componentControls}
          />
        ))
      }
    </Node>
  );
}

interface IndexItemControls {
  onNewPage: (path: string[], pageName: string) => void;
  onNewFolder: (path: string[], folderName: string) => void;
  onMoveIndexItem: (sourcePath: string[], targetPath: string[]) => void;
  onDeleteIndexItem: (path: string[]) => void;
}

interface ComponentControls {
  onNewComponent: (
    pagePath: string,
    componentPath: number[],
    componentType: string,
  ) => void;
  onDeletComponent: (pagePath: string[], compoentPath: string[]) => void;
}

interface PageModalState {
  type: 'newpage' | 'newfolder';
}
interface ErrorModalState {
  type: 'error';
  label: string;
}
// interface SaveModalState {
//   type: 'save';
//   label: OnSaveStatus;
// }
type LayoutModalStates = PageModalState | ErrorModalState /*| SaveModalState*/;

interface PagesLayoutProps {
  indexItemControls: IndexItemControls;
  componentControls: ComponentControls;
}

export function PagesLayout({
  indexItemControls,
  componentControls,
}: PagesLayoutProps) {
  const { onNewPage, onNewFolder } = indexItemControls;

  const [modalState, setModalState] = React.useState<LayoutModalStates>();
  const [index, setIndex] = React.useState<PageIndex>();

  React.useEffect(() => {
    PageAPI.getIndex().then(setIndex);
  }, []);

  return (
    <Toolbar>
      <Toolbar.Header>
        <Menu
          label="Add new folder/page"
          items={[
            {
              label: 'New page',
              id: 'newpage' as LayoutModalStates['type'],
            },
            {
              label: 'New folder',
              id: 'newfolder' as LayoutModalStates['type'],
            },
          ]}
          onSelect={({ id }) => setModalState({ type: id } as PageModalState)}
        />
        {modalState &&
          (modalState.type === 'newpage' ||
            modalState.type === 'newfolder') && (
            <>
              <TextPrompt
                placeholder={
                  modalState.type === 'newpage' ? 'Page name' : 'Folder name'
                }
                defaultFocus
                onAction={(success, value) => {
                  if (value === '') {
                    setModalState({
                      type: 'error',
                      label: 'The page must have a name',
                    });
                  } else {
                    if (success) {
                      if (modalState.type === 'newpage') {
                        onNewPage([], value);
                        setModalState(undefined);
                      } else {
                        onNewFolder([], value);
                        setModalState(undefined);
                      }
                    }
                  }
                }}
                onBlur={() => setModalState(undefined)}
                applyOnEnter
              />
            </>
          )}
      </Toolbar.Header>
      <Toolbar.Content>
        <Container
          onDropResult={({ source, target, id }) => {
            wlog('Dropped');
            wlog({ source, target, id });
          }}
        >
          {({ nodeProps }) => (
            <div className={cx(flex, flexColumn)}>
              {index ? (
                index.root.items.map(v => (
                  <PageIndexItemNode
                    nodeProps={nodeProps}
                    key={v.name}
                    indexItem={v}
                    path={[]}
                    indexItemControls={indexItemControls}
                    componentControls={componentControls}
                  />
                ))
              ) : (
                <span>Loading ...</span>
              )}
            </div>
          )}
        </Container>
      </Toolbar.Content>
    </Toolbar>
  );
}
