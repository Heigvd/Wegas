import * as React from 'react';
import { css, cx, keyframes } from 'emotion';
import { dropZoneClass } from '../../Contexts/DefaultDndProvider';
import {
  DnDComponent,
  dndComponnent,
  useComponentDrag,
} from '../../../Editor/Components/Page/ComponentPalette';
import {
  useDrop,
  DropTargetMonitor,
  DragElementWrapper,
  DragPreviewImage,
} from 'react-dnd';
import {
  pageCTX,
  PageContext,
} from '../../../Editor/Components/Page/PageEditor';
import { themeVar } from '../../Theme';
import {
  flex,
  flexRow,
  textCenter,
  flexColumn,
  grow,
  flexDistribute,
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
import { clientScriptEval, useScript } from '../../Hooks/useScript';
import { findByName } from '../../../data/selectors/VariableDescriptorSelector';

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
});

export const expandEditStyle = css({
  borderStyle: 'solid',
  borderWidth: '30px',
  borderColor: themeVar.disabledColor,
});

const editItemStyle = css({
  // display: 'list-item',
  //marginLeft: '10px',
  width: '50px',
  height: '50px',
});

const emptyListStyle = css({
  // display: 'list-item',
  textAlign: 'center',
  borderStyle: 'solid',
  borderWidth: '1px',
});

export const opaciSchnaps = css({
  opacity: '0 !important',
});

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
    isOver: boolean;
    isOverCurrent: boolean;
    canDrop: boolean;
    item: DnDComponent | null;
  },
  DragElementWrapper<{}>,
] {
  const [dropZoneProps, dropZone] = useDrop({
    accept: dndComponnent,
    canDrop: () => true,
    drop: onDrop,
    collect: (mon: DropTargetMonitor) => ({
      isOver: mon.isOver({ shallow: false }),
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
  script: string;
}
interface OpenPopupPageAction {
  pageId: IScript;
}
interface PlaySoundAction {
  fileDescriptor: IFileDescriptor;
}
interface PrintVariableAction {
  variableName: string;
}

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
  confirmClick?: string;
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
        script: schemaProps.code('Local script', true, 'TypeScript'),
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
        variableName: schemaProps.variable('Variable', true),
        priority: schemaProps.number('Priority', false),
      }),
    },
  },
  {
    label: 'Confirm click',
    value: {
      prop: 'confirmClick',
      schema: schemaProps.string('Confirmation message', true, 'Are you sure?'),
    },
  },
];

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
    clientScriptEval(props.script);
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
    // We may register the sound component here and add another action for sound control (play, pause, volume, etc...)
    audio.play();
  },
  printVariable: props => {
    //TODO : Discuss that with Maxence
    wlog('Not implemented yet');
    wlog(findByName(props.variableName));
  },
};

interface NotificationUpgrade {
  showScript: IScript;
  blinkScript: IScript;
  messageScript: string;
}

interface WegasComponentUpgrades {
  notification: NotificationUpgrade;
}

const upgradeChoices: HashListChoices = [
  {
    label: 'Notification',
    value: {
      prop: 'notification',
      schema: schemaProps.object('Notification', {
        showScript: schemaProps.script(
          'Show',
          false,
          'GET',
          'TypeScript',
          'true',
        ),
        blinkScript: schemaProps.script(
          'Blink',
          false,
          'GET',
          'TypeScript',
          'false',
        ),
        messageScript: schemaProps.code('Message', false, 'TypeScript'),
      }),
    },
  },
];

const notificationStyle = css({
  position: 'absolute',
  color: themeVar.primaryLighterTextColor,
  backgroundColor: themeVar.warningColor,
  borderRadius: '50%',
  padding: '0px 5px 0px 5px',
});

const blinkAnimation = keyframes(`
50%{color: ${themeVar.warningColor};}
`);

const blinkStyle = css(`
  animation: ${blinkAnimation} 0.7s step-end infinite;
`);

function NotificationComponent({
  showScript,
  blinkScript,
  messageScript,
}: NotificationUpgrade) {
  // const container = React.useRef<HTMLDivElement>(null);
  const show = useScript<boolean>(showScript.content);
  const blink = useScript<boolean>(blinkScript.content);
  const message = useScript<string>(messageScript);

  return show ? (
    <div
      ref={container => {
        if (container) {
          const { width, height } = container.getBoundingClientRect();
          const top = -(width / 4) - 1;
          const right = -(height / 4) - 1;
          container.className += ' ' + css({ top, right });
        }
      }}
      className={cx(notificationStyle, { [blinkStyle]: blink })}
    >
      {message}
    </div>
  ) : null;
}

export interface ComponentContainerProps
  extends Omit<PageComponentMandatoryProps, 'ComponentContainer'> {
  options?: {
    layout?: FlexItemFlexProps;
    actions?: WegasComponentOptionsActions & WegasComponentActionsProperties;
    upgrades?: WegasComponentUpgrades;
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
  options: {},
  handleProps: {},
  className: '',
  style: {},
};

export const componentContainerWegasPropsKeys = Object.keys(
  defaultComponentContainerProps,
);

export function useComponentEditorContainer(
  type: string,
  path: number[],
  pageContext: PageContext,
  containerRef?: DragElementWrapper<{}>,
) {
  const {
    editMode,
    showControls,
    // setIsDragging,
    handles,
    onEdit,
    onDelete,
  } = pageContext;
  const [, /*{ isDragging }*/ drag, preview] = useComponentDrag(type, path);
  // useDeepChanges(dragMonitor, setIsDragging);
  // useIsDragging(dragMonitor);
  // wlog(dragMonitor);
  // setIsDragging(isDragging);

  function EditHandle({
    componentName,
    className,
    togglerProps,
  }: EditorHandleProps) {
    const [stackedHandles, setStackedHandles] = React.useState<JSX.Element[]>();
    const handleRef = React.createRef<HTMLDivElement>();

    const HandleContent = React.forwardRef<HTMLDivElement>((_, ref) => {
      return (
        <div
          ref={ref}
          className={cx(flex, flexColumn, handleContentStyle)}
          //Avoiding the container actions to trigger when using handle
          onClick={event => event.stopPropagation()}
        >
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
    // const { editMode } = React.useContext(pageCTX);
    // const [{ canDrop }] = useDndComponentDrop();
    // const displayBorders = showBorders || (editMode && canDrop);

    return (
      <>
        <DragPreviewImage
          connect={preview}
          src={require('../../../pictures/react.png').default}
        />
        <FlexItem
          ref={containerRef}
          {...options?.layout}
          className={
            cx(handleControlStyle, {
              [layoutHighlightStyle]: showBorders,
              [childHighlightStyle]: showBorders,
            }) + (className ? ' ' + className : '')
          }
          style={style}
          onClick={() => {
            if (options && options.actions) {
              if (
                !options.actions.confirmClick ||
                // TODO : Find a better way to do that than a modal!!!
                // eslint-disable-next-line no-alert
                confirm(options.actions.confirmClick)
              ) {
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
          {options?.upgrades?.notification && (
            <NotificationComponent {...options.upgrades.notification} />
          )}
        </FlexItem>
      </>
    );
  };
}

interface ComponentDropZoneProps {
  onDrop?: (dndComponnent: DnDComponent) => void;
}

function ComponentDropZone({ onDrop }: ComponentDropZoneProps) {
  const [{ isOverCurrent }, dropZone] = useDndComponentDrop(onDrop);
  return (
    <div
      ref={dropZone}
      className={cx(
        dropZoneClass(isOverCurrent),
        editItemStyle,
        flex,
        flexColumn,
        flexDistribute,
      )}
    >
      <div>Drop component here</div>
    </div>
  );
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
  const pageContext = React.useContext(pageCTX);

  const ComponentContainer = useComponentEditorContainer(
    componentName,
    path,
    pageContext,
    // dropZone,
  );

  const { editMode: edit, onDrop, showBorders, isDragging } = pageContext;
  const editMode = edit && !uneditable;
  let content: JSX.Element[] = [];
  if (wegasChildren !== undefined) {
    if (editMode && isDragging) {
      content = wegasChildren.reduce(
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
            key="FIRST"
            onDrop={c => onDrop && onDrop(c, path, 0)}
          />,
        ],
      );
    } else if (editMode && wegasChildren.length === 0) {
      content = [
        <div key="NO-CHILD" className={cx(emptyListStyle, grow)}>
          The layout is empty
        </div>,
      ];
    } else {
      content = wegasChildren;
    }
  }

  wlog({ isDragging, size: content.length });

  return children(
    content,
    uneditable ? () => null : ComponentContainer,
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
      {
        label: 'Upgrades',
        value: { prop: 'upgrades' },
        items: upgradeChoices,
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
