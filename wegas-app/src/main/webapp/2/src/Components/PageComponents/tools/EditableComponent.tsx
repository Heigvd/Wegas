import * as React from 'react';
import { css, cx } from 'emotion';
import { dropZoneClass } from '../../Contexts/DefaultDndProvider';
import {
  DnDComponent,
  dndComponnent,
  useComponentDrag,
} from '../../../Editor/Components/Page/ComponentPalette';
import { useDrop, DropTargetMonitor, DragElementWrapper } from 'react-dnd';
import { pageCTX } from '../../../Editor/Components/Page/PageEditor';
import { themeVar } from '../../Theme';
import {
  flex,
  flexRow,
  textCenter,
  flexColumn,
  grow,
} from '../../../css/classes';
import { ConfirmButton } from '../../Inputs/Buttons/ConfirmButton';
import { IconButton } from '../../Inputs/Buttons/IconButton';
import { TogglerProps } from '../../Inputs/Boolean/Toggler';
import {
  FlexItemProps,
  FlexItem,
  FlexItemFlexProps,
  layoutChoices,
} from '../../Layouts/FlexList';
import { ErrorBoundary } from '../../../Editor/Components/ErrorBoundary';
import { useDebounce } from '../../Hooks/useDebounce';
import { CheckBox } from '../../Inputs/Boolean/CheckBox';
import { schemaProps } from './schemaProps';
import { HashListChoices } from '../../../Editor/Components/FormView/HashList';
import { wlog } from '../../../Helper/wegaslog';
import { fileURL, generateAbsolutePath } from '../../../API/files.api';
import { store } from '../../../data/store';
import { runScript } from '../../../data/Reducer/VariableInstanceReducer';
import { Player } from '../../../data/selectors';
import { omit } from 'lodash-es';
import { clientScriptEval } from '../../Hooks/useScript';

export const layoutHighlightStyle = css({
  borderStyle: 'solid',
  borderWidth: '2px',
  borderColor: themeVar.searchColor,
});

export const childHighlightCSS = {
  borderStyle: 'dotted',
  borderWidth: '1px',
  borderColor: themeVar.searchColor,
};

export const childHighlightStyle = css({
  '&>*>*': childHighlightCSS,
});

const handleControlStyle = css({
  textAlign: 'center',
  '&>.wegas-component-handle': {
    visibility: 'hidden',
    opacity: 0.0,
    transition: 'all 0.5s',
  },
  ':hover>.wegas-component-handle': {
    visibility: 'unset',
    opacity: 0.8,
    transition: 'all 0s',
  },
});

const handleContentStyle = css({
  borderRadius: themeVar.borderRadius,
  borderStyle: 'solid',
  borderColor: themeVar.primaryLighterColor,
  backgroundColor: themeVar.primaryHoverColor,
  // borderColor: 'transparent',
  // transition: 'border-color 0.5s',
  // opacity: 0.0,
  // transition: 'opacity 0.5s',
  // ':hover': {
  //   // borderColor: themeVar.primaryLighterColor,
  //   // transition: 'border-color 0s',
  //   opacity: 0.8,
  //   transition: 'opacity 0s',
  // },
  // '&>.wegas-component-handle-title': {
  //   background: themeVar.primaryHoverColor,
  //   borderTopLeftRadius: themeVar.borderRadius,
  //   borderTopRightRadius: themeVar.borderRadius,
  //   opacity: 0.0,
  //   transition: 'visibility 0.5s, opacity 0.5s',
  // },
  // ':hover>.wegas-component-handle-title': {
  //   opacity: 1,
  //   transition: 'opacity 0s',
  // },
  // '&>.wegas-component-handle-content': {
  //   background: themeVar.primaryHoverColor,
  //   borderRadius: themeVar.borderRadius,
  //   borderTopLeftRadius: themeVar.borderRadius,
  //   transition: 'border-top-left-radius 0.5s, border-top-right-radius 0.5s',
  // },
  // ':hover>.wegas-component-handle-content': {
  //   borderTopLeftRadius: 0,
  //   borderTopRightRadius: 0,
  //   transition: 'border-top-left-radius 0s, border-top-right-radius 0s',
  // },
});

export const expandEditStyle = css({
  borderStyle: 'solid',
  borderWidth: '30px',
  borderColor: themeVar.disabledColor,
});

const editItemStyle = css({
  display: 'list-item',
  marginLeft: '10px',
  width: '100px',
  height: '100px',
});

const emptyListStyle = css({
  display: 'list-item',
  textAlign: 'center',
  borderStyle: 'solid',
  borderWidth: '1px',
});

export const opaciSchnaps = css({
  opacity: '0 !important',
});

interface ComponentEditorContainerProps {
  type: string;
  path: number[];
}

export interface EditorHandleProps {
  componentName?: string;
  className?: string;
  togglerProps?: TogglerProps;
}

export interface PageComponentMandatoryProps extends FlexItemProps {
  /**
   * ComponentContainer - the container that must surround any component
   */
  ComponentContainer: React.FunctionComponent<ComponentContainerProps>;
  /**
   * displayBorders - ask the component to highlight its borders
   */
  showBorders?: boolean;
  /**
   * path - the location of the component in the page
   */
  path?: number[];
}

const flattenPath = (path: number[]) => {
  const purePath = [...path];
  let flatPath = '';
  while (purePath.length) {
    flatPath = '/' + purePath.pop() + flatPath;
  }
  return flatPath === '' ? '/' : flatPath;
};

const visitPath = (path: number[], callback: (path: number[]) => void) => {
  const purePath = [...path];
  do {
    callback(purePath);
    purePath.pop();
  } while (purePath.length > 0);
};

const checkIfInsideRectangle = (
  A: { x: number; y: number },
  C: { x: number; y: number },
  Ptest: { x: number; y: number },
) => Ptest.x >= A.x && Ptest.x <= C.x && Ptest.y >= A.y && Ptest.y <= C.y;

function Nothing() {
  return null;
}

const defaultMandatoryProps: PageComponentMandatoryProps = {
  ComponentContainer: Nothing,
  showBorders: undefined,
  path: [],
};

export const defaultMandatoryKeys = Object.keys(defaultMandatoryProps);

export function useDndComponentDrop(
  onDrop?: (dndComponnent: DnDComponent) => void,
): [
  {
    isOverCurrent: boolean;
    canDrop: boolean;
    item: DnDComponent | null;
  },
  DragElementWrapper<any>,
] {
  const [dropZoneProps, dropZone] = useDrop({
    accept: dndComponnent,
    canDrop: () => true,
    drop: onDrop,
    collect: (mon: DropTargetMonitor) => ({
      isOverCurrent: mon.isOver({ shallow: true }),
      canDrop: mon.canDrop(),
      item: mon.getItem() as DnDComponent | null,
    }),
  });
  const delayedCanDrop = useDebounce(dropZoneProps.canDrop, 100);
  return [{ ...dropZoneProps, canDrop: delayedCanDrop }, dropZone];
}

interface WegasComponentOptionsAction {
  priority?: number;
}

interface OpenPageAction {
  pageLoaderName: string;
  pageId: IScript;
}
interface OpenURLAction {
  url: string;
}
interface OpenFileAction {
  fileDescriptor: IFileDescriptor;
}
interface ImpactVariableAction {
  impact: IScript;
}
interface LoaclScriptEvalAction {
  script: IScript;
}
interface OpenPopupPageAction {
  pageId: IScript;
}
interface PlaySoundAction {
  fileDescriptor: IFileDescriptor;
}
interface PrintVariableAction {
  variable: IScript;
}

interface WegasComponentActions {
  openPage: (props: OpenPageAction) => void;
  openUrl: (props: OpenURLAction) => void;
  openFile: (props: OpenFileAction) => void;
  impactVariable: (props: ImpactVariableAction) => void;
  localScriptEval: (props: LoaclScriptEvalAction) => void;
  openPopupPage: (props: OpenPopupPageAction) => void;
  playSound: (props: PlaySoundAction) => void;
  printVariable: (props: PrintVariableAction) => void;
}

const wegasComponentActions: WegasComponentActions = {
  openPage: props => {
    //TODO : Discuss that with Maxence
    wlog(
      'Need to change page state? What to priorize, initial script or click',
    );
    wlog(props);
  },
  openUrl: props => {
    window.open(props.url);
  },
  openFile: props => {
    const win = window.open(
      fileURL(generateAbsolutePath(props.fileDescriptor)),
      '_blank',
    );
    win!.focus();
  },
  impactVariable: props => {
    try {
      store.dispatch(runScript(props.impact, Player.selectCurrent()));
    } catch (error) {
      wlog(error);
    }
  },
  localScriptEval: props => {
    clientScriptEval(props.script.content);
  },
  openPopupPage: props => {
    //TODO : Discuss that with Maxence
    wlog('Need to implement a popup modal. Or is it allready here?');
    wlog(props);
  },
  playSound: props => {
    const audio = new Audio(
      fileURL(generateAbsolutePath(props.fileDescriptor)),
    );
    audio.play();
  },
  printVariable: props => {
    //TODO : Discuss that with Maxence
    wlog('Not implemented yet');
    wlog(props);
  },
};

interface WegasComponentOptionsActions {
  openPage?: OpenPageAction & WegasComponentOptionsAction;
  openUrl?: OpenURLAction & WegasComponentOptionsAction;
  openFile?: OpenFileAction & WegasComponentOptionsAction;
  impactVariable?: ImpactVariableAction & WegasComponentOptionsAction;
  localScriptEval?: LoaclScriptEvalAction & WegasComponentOptionsAction;
  openPopupPage?: OpenPopupPageAction & WegasComponentOptionsAction;
  playSound?: PlaySoundAction & WegasComponentOptionsAction;
  printVariable?: PrintVariableAction & WegasComponentOptionsAction;
}

interface WegasComponentActionsProperties {
  confirmClick?: boolean;
}

const actionsChoices: HashListChoices = [
  {
    label: 'Open Page',
    value: {
      prop: 'openPage',
      schema: schemaProps.object('Open Page', {
        pageLoaderName: schemaProps.pageLoaderSelect('Page loader', true),
        pageId: schemaProps.pageSelect('Page', true),
        priority: schemaProps.number('Priority', false),
      }),
    },
  },
  {
    label: 'Open Url',
    value: {
      prop: 'openUrl',
      schema: schemaProps.object('Open Url', {
        url: schemaProps.string('Url', true),
        priority: schemaProps.number('Priority', false),
      }),
    },
  },
  {
    label: 'Open File',
    value: {
      prop: 'openFile',
      schema: schemaProps.object('Open File', {
        fileDescriptor: schemaProps.file('File', true),
        priority: schemaProps.number('Priority', false),
      }),
    },
  },
  {
    label: 'Impact variable',
    value: {
      prop: 'impactVariable',
      schema: schemaProps.object('Impact variable', {
        impact: schemaProps.script('Impact', true),
        priority: schemaProps.number('Priority', false),
      }),
    },
  },
  {
    label: 'Local script eval',
    value: {
      prop: 'localScriptEval',
      schema: schemaProps.object('Local script eval', {
        script: schemaProps.script('Local script', true, 'SET', 'TypeScript'),
        priority: schemaProps.number('Priority', false),
      }),
    },
  },
  {
    label: 'Open popup page',
    value: {
      prop: 'openPopupPage',
      schema: schemaProps.object('Open popup page', {
        pageId: schemaProps.pageSelect('Page', true),
        priority: schemaProps.number('Priority', false),
      }),
    },
  },
  {
    label: 'Play sound',
    value: {
      prop: 'playSound',
      schema: schemaProps.object('Play sound', {
        fileDescriptor: schemaProps.file('File', true, 'FILE', {
          filterType: 'grey',
          fileType: 'audio',
        }),
        priority: schemaProps.number('Priority', false),
      }),
    },
  },
  {
    label: 'Print variable',
    value: {
      prop: 'printVariable',
      schema: schemaProps.object('Print variable', {
        fileDescriptor: schemaProps.variable('Variable', true),
        priority: schemaProps.number('Priority', false),
      }),
    },
  },
];

export interface ComponentContainerProps
  extends Omit<PageComponentMandatoryProps, 'ComponentContainer'> {
  options?: {
    layout?: FlexItemFlexProps;
    actions?: WegasComponentOptionsActions & WegasComponentActionsProperties;
  };
  handleProps?: EditorHandleProps;
  /**
   * className - the class to apply to the item
   */
  className?: string;
  /**
   * style - the style to apply to the item (always prefer className over style to avoid messing with original behaviour of the item)
   */
  style?: React.CSSProperties;
}

const defaultComponentContainerProps: ComponentContainerProps = {
  options: { layout: {}, actions: {} },
  handleProps: {},
  className: '',
  style: {},
};

export const componentContainerWegasPropsKeys = Object.keys(
  defaultComponentContainerProps,
);

export function ComponentEditorContainer({
  type,
  path,
}: ComponentEditorContainerProps) {
  const {
    editMode,
    showControls,
    handles,
    onEdit,
    onDelete,
  } = React.useContext(pageCTX);
  function EditHandle({
    componentName,
    className,
    togglerProps,
  }: EditorHandleProps) {
    const [stackedHandles, setStackedHandles] = React.useState<JSX.Element[]>();
    const [, drag] = useComponentDrag(type, path);
    const handleRef = React.createRef<HTMLDivElement>();

    const HandleContent = React.forwardRef<HTMLDivElement>((_, ref) => {
      return (
        <div ref={ref} className={cx(flex, flexColumn, handleContentStyle)}>
          <div
            style={{ fontSize: '10px' }}
            className={
              cx(flex, flexRow, textCenter) + ' wegas-component-handle-title'
            }
          >
            {(componentName ? componentName + ' : ' : '') + type}
          </div>
          <div
            className={cx(flex, flexRow) + ' wegas-component-handle-content'}
          >
            <IconButton icon="edit" onClick={() => onEdit(path)} />
            <IconButton icon="arrows-alt" ref={drag} />
            <ConfirmButton
              icon="trash"
              onAction={success => {
                if (success) {
                  onDelete(path);
                }
              }}
            />
            {togglerProps && <CheckBox {...togglerProps} />}
          </div>
        </div>
      );
    });

    handles[flattenPath(path)] = { jsx: <HandleContent />, dom: handleRef };
    return editMode && showControls ? (
      <div
        style={{
          position: 'absolute',
          top: '-30px',
          left: '-30px',
        }}
        className={'wegas-component-handle ' + (className ? className : '')}
        onMouseEnter={() => {
          const computedHandles: JSX.Element[] = [];
          const currentHandle = handles[flattenPath(path)];
          if (currentHandle?.dom.current) {
            const {
              x: cx,
              y: cy,
              width: cw,
              height: ch,
            } = currentHandle.dom.current.getBoundingClientRect();
            const [A1, B1, C1, D1] = [
              { x: cx, y: cy },
              { x: cx, y: cy + ch },
              { x: cx + cw, y: cy + ch },
              { x: cx + cw, y: cy },
            ];
            computedHandles.push(currentHandle.jsx);
            const trimmedPath = path.slice(0, -1);
            visitPath(trimmedPath, visitedPath => {
              const component = handles[flattenPath(visitedPath)];
              if (component?.dom.current) {
                const {
                  x,
                  y,
                  width: w,
                  height: h,
                } = component.dom.current.getBoundingClientRect();
                const [A2, B2, C2, D2] = [
                  { x: x, y: y },
                  { x: x, y: y + h },
                  { x: x + w, y: y + h },
                  { x: x + w, y: y },
                ];
                const [A1in, B1in, C1in, D1in] = [
                  checkIfInsideRectangle(A2, C2, A1),
                  checkIfInsideRectangle(A2, C2, B1),
                  checkIfInsideRectangle(A2, C2, C1),
                  checkIfInsideRectangle(A2, C2, D1),
                ];
                const [A2in, B2in, C2in, D2in] = [
                  checkIfInsideRectangle(A1, C1, A2),
                  checkIfInsideRectangle(A1, C1, B2),
                  checkIfInsideRectangle(A1, C1, C2),
                  checkIfInsideRectangle(A1, C1, D2),
                ];
                if (
                  A1in ||
                  B1in ||
                  C1in ||
                  D1in ||
                  A2in ||
                  B2in ||
                  C2in ||
                  D2in
                ) {
                  component.dom.current.className += ' ' + opaciSchnaps;
                  computedHandles.splice(0, 0, component.jsx);
                } else {
                  component.dom.current.className = component.dom.current.className
                    .replace(new RegExp(opaciSchnaps, 'g'), '')
                    .trim();
                }
              }
            });
          }
          setStackedHandles(computedHandles);
        }}
        onMouseLeave={() => setStackedHandles(undefined)}
      >
        {stackedHandles ? (
          stackedHandles.map((v, i) => (
            <React.Fragment key={i}>{v}</React.Fragment>
          ))
        ) : (
          <HandleContent ref={handleRef} />
        )}
      </div>
    ) : null;
  }
  return function ComponentContainer({
    children,
    options,
    handleProps,
    showBorders,
    className,
    style,
  }: React.PropsWithChildren<ComponentContainerProps>) {
    const [{ canDrop }] = useDndComponentDrop();
    return (
      <FlexItem
        {...options?.layout}
        className={
          cx(handleControlStyle, {
            [childHighlightStyle]: showBorders || canDrop,
          }) + (className ? ' ' + className : '')
        }
        style={style}
        onClick={() => {
          if (options && options.actions) {
            // TODO : Find a better way to do that than a modal!!!
            // eslint-disable-next-line no-alert
            if (!options.actions.confirmClick || confirm('Are you sure?')) {
              Object.entries(
                omit(
                  options.actions,
                  'confirmClick',
                ) as WegasComponentOptionsActions,
              )
                .sort(
                  (
                    [, v1]: [string, WegasComponentOptionsAction],
                    [, v2]: [string, WegasComponentOptionsAction],
                  ) =>
                    (v1.priority ? v1.priority : 0) -
                    (v2.priority ? v2.priority : 0),
                )
                .forEach(([k, v]) =>
                  wegasComponentActions[k as keyof WegasComponentActions](v),
                );
            }
          }
        }}
      >
        {path.length > 0 && <EditHandle {...handleProps} />}
        <ErrorBoundary>{children}</ErrorBoundary>
      </FlexItem>
    );
  };
}

interface ComponentDropZoneProps {
  onDrop?: (dndComponnent: DnDComponent) => void;
  emptyList?: boolean;
}

function ComponentDropZone({ onDrop, emptyList }: ComponentDropZoneProps) {
  const [{ canDrop, isOverCurrent }, dropZone] = useDndComponentDrop(onDrop);
  return canDrop ? (
    <div className={editItemStyle}>
      <div ref={dropZone} className={dropZoneClass(isOverCurrent)}>
        Drop component here
      </div>
    </div>
  ) : emptyList ? (
    <div className={cx(emptyListStyle, grow)}>The list is empty</div>
  ) : null;
}

export interface PageComponentProps {
  children?: JSX.Element[];
  path: number[];
}

interface EditableComponentProps {
  componentName: string;
  children: (
    children: JSX.Element[],
    ComponentContainer: React.FunctionComponent<ComponentContainerProps>,
    showBorders: boolean,
  ) => React.ReactElement | null;
  wegasChildren?: JSX.Element[];
  path: number[];
  uneditable?: boolean;
}

export function EditableComponent({
  componentName,
  children,
  wegasChildren,
  path,
  uneditable,
}: EditableComponentProps) {
  const { editMode: edit, onDrop, showBorders } = React.useContext(pageCTX);
  const editMode = edit && !uneditable;
  let content: JSX.Element[] = [];
  if (wegasChildren !== undefined) {
    content = editMode
      ? wegasChildren.reduce(
          (o, c, i) => [
            ...o,
            c,
            <ComponentDropZone
              key={i + 'AFTER'}
              onDrop={c => onDrop && onDrop(c, path, i + 1)}
            />,
          ],
          [
            <ComponentDropZone
              key={'FIRST'}
              onDrop={c => onDrop && onDrop(c, path, 0)}
              emptyList={wegasChildren.length === 0}
            />,
          ],
        )
      : wegasChildren;
  }

  return children(
    content,
    uneditable
      ? () => null
      : ComponentEditorContainer({ type: componentName, path }),
    showBorders && !uneditable,
  );
}

export const optionsSchema = {
  options: schemaProps.hashlist(
    'Options',
    false,
    [
      {
        label: 'Layout',
        value: { prop: 'layout' },
        items: layoutChoices,
      },
      {
        label: 'Actions',
        value: { prop: 'actions' },
        items: actionsChoices,
      },
    ],
    undefined,
    undefined,
    1001,
  ),
  className: schemaProps.string(
    'Classes',
    false,
    undefined,
    undefined,
    1001,
    undefined,
    true,
  ),
  style: schemaProps.code('Style', false, 'JSON', undefined, 'ADVANCED', 1002),
  children: schemaProps.hidden(false, 'array', 1003),
};
