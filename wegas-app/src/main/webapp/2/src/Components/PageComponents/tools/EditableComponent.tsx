import * as React from 'react';
import { css, cx, keyframes } from 'emotion';
import { dropZoneClass } from '../../Contexts/DefaultDndProvider';
import {
  DnDComponent,
  PAGEEDITOR_COMPONENT_TYPE,
  useComponentDrag,
} from '../../../Editor/Components/Page/ComponentPalette';
import { useDrop, DropTargetMonitor, DragElementWrapper } from 'react-dnd';
import { pageCTX, Handles } from '../../../Editor/Components/Page/PageEditor';
import { themeVar } from '../../Theme';
import { flex, flexRow, textCenter, flexColumn } from '../../../css/classes';
import { ConfirmButton } from '../../Inputs/Buttons/ConfirmButton';
import { IconButton } from '../../Inputs/Buttons/IconButton';
import {
  FlexItem,
  flexlayoutChoices,
  FlexListProps,
} from '../../Layouts/FlexList';
import { ErrorBoundary } from '../../../Editor/Components/ErrorBoundary';
import { useDebounce } from '../../Hooks/useDebounce';
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
import { ActionCreator } from '../../../data/actions';
import { classNameOrEmpty } from '../../../Helper/className';
import { Content, Splitter, ContainerProps } from '../../Layouts/FonkyFlex';
import { deepDifferent } from '../../Hooks/storeHookFactory';
import { pagesStateStore, usePagesStateStore } from '../../../data/pageStore';

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

const childHighlightStyle = css({
  '&>*>*': childHighlightCSS,
});

const childDropZoneIntoCSS = {
  '&>*>*>.component-dropzone-into': {
    width: '100%',
    height: '100%',
  },
};

const childDropzoneHorizontalStyle = css({
  ...childDropZoneIntoCSS,
  '&>*>*>.component-dropzone': {
    maxWidth: '30px',
    width: '30%',
    height: '100%',
  },
  '&>*>*>.component-dropzone-after': {
    right: 0,
  },
});

const childDropzoneVerticalStyle = css({
  ...childDropZoneIntoCSS,
  '&>*>*>.component-dropzone': {
    maxHeight: '30px',
    width: '100%',
    height: '30%',
  },
  '&>*>*>.component-dropzone-after': {
    bottom: 0,
  },
});

const handleControlStyle = css({
  textAlign: 'center',
  '&>.wegas-component-handle': {
    visibility: 'hidden',
    opacity: 0.0,
  },
  ':hover>.wegas-component-handle': {
    visibility: 'unset',
    opacity: 0.8,
  },
});

const componentBorderCss = {
  borderStyle: 'solid',
  borderWidth: '1px',
  borderColor: themeVar.primaryHoverColor,
};
const focusedComponentStyle = css(componentBorderCss);
const handleControlHoverStyle = css({
  ':hover': componentBorderCss,
});

const handleContentStyle = css({
  borderRadius: themeVar.borderRadius,
  borderStyle: 'solid',
  borderColor: themeVar.primaryLighterColor,
  backgroundColor: themeVar.primaryHoverColor,
});

// const emptyListStyle = css({
//   textAlign: 'center',
//   borderStyle: 'solid',
//   borderWidth: '1px',
// });

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

function useDndComponentDrop(
  onDrop?: (dndComponnent: DnDComponent, dndMonitor: DropTargetMonitor) => void,
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
    accept: PAGEEDITOR_COMPONENT_TYPE,
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
  pageLoaderName: IScript;
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
  lock?: string;
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
  {
    label: 'Lock',
    value: {
      prop: 'lock',
      schema: schemaProps.string('Lock', true),
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
  openPage: ({ pageLoaderName, pageId }) => {
    store.dispatch(
      ActionCreator.EDITOR_REGISTER_PAGE_LOADER({
        name: clientScriptEval<string>(pageLoaderName.content),
        pageId,
      }),
    );
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

interface InfoBeamUpgrade {
  showScript: IScript;
  blinkScript: IScript;
  messageScript: string;
}

interface WegasComponentUpgrades {
  tooltip: string;
  infoBeam: InfoBeamUpgrade;
}

const upgradeChoices: HashListChoices = [
  {
    label: 'Tooltip',
    value: {
      prop: 'tooltip',
      schema: schemaProps.string('Tooltip'),
    },
  },
  {
    label: 'Info Beam',
    value: {
      prop: 'infoBeam',
      schema: schemaProps.object('Info Beam', {
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

const infoBeamStyle = css({
  position: 'absolute',
  color: themeVar.primaryLighterTextColor,
  backgroundColor: themeVar.warningColor,
  borderRadius: '50%',
  padding: '0px 5px 0px 5px',
});

const blinkAnimation = keyframes(`
50%{opacity: 0.0;}
`);

const blinkStyle = css(`
  animation: ${blinkAnimation} 1.0s linear infinite;
`);

function InfoBeam({ showScript, blinkScript, messageScript }: InfoBeamUpgrade) {
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
          container.style.setProperty('right', `${right}px`);
          container.style.setProperty('top', `${top}px`);
        }
      }}
      className={cx(infoBeamStyle, { [blinkStyle]: blink })}
    >
      {message}
    </div>
  ) : null;
}

function computeHandles(handles: Handles, path: number[]) {
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
        if (A1in || B1in || C1in || D1in || A2in || B2in || C2in || D2in) {
          component.dom.current.style.setProperty('opacity', '0.0');
          computedHandles.splice(0, 0, component.jsx);
        } else {
          component.dom.current.style.setProperty('opacity', null);
        }
      }
    });
  }
  return computedHandles;
}

export interface WegasComponentItemProps extends ClassAndStyle {
  onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  onMouseOver?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  onMouseLeave?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  tooltip?: string;
}

interface AbsoluteItemProps
  extends React.PropsWithChildren<WegasComponentItemProps> {
  layout?: {
    position?: {
      left?: string;
      right?: string;
      top?: string;
      bottom?: string;
    };
    size?: {
      width?: string;
      height?: string;
    };
  };
}

const AbsoluteItem = React.forwardRef<HTMLDivElement, AbsoluteItemProps>(
  (
    {
      layout,
      tooltip,
      style,
      className,
      onClick,
      onMouseOver,
      onMouseLeave,
      children,
    },
    ref,
  ) => {
    const { position = {}, size = {} } = layout || {};
    return (
      <div
        ref={ref}
        style={{ position: 'absolute', ...position, ...size, ...style }}
        title={tooltip}
        onClick={onClick}
        onMouseOver={onMouseOver}
        onMouseLeave={onMouseLeave}
        className={className}
      >
        {children}
      </div>
    );
  },
);

const absolutelayoutChoices: HashListChoices = [
  {
    label: 'Position',
    value: { prop: 'position' },
    items: [
      {
        label: 'Left',
        value: { prop: 'left', schema: schemaProps.number('Left') },
      },
      {
        label: 'Right',
        value: { prop: 'right', schema: schemaProps.number('Right') },
      },
      {
        label: 'Top',
        value: { prop: 'top', schema: schemaProps.number('Top') },
      },
      {
        label: 'Bottom',
        value: { prop: 'bottom', schema: schemaProps.number('Bottom') },
      },
      {
        label: 'Foreground index',
        value: {
          prop: 'zIndex',
          schema: schemaProps.number('Foreground index'),
        },
      },
    ],
  },
  {
    label: 'Size',
    value: { prop: 'size' },
    items: [
      {
        label: 'Width',
        value: { prop: 'width', schema: schemaProps.number('Width') },
      },
      {
        label: 'Height',
        value: { prop: 'height', schema: schemaProps.number('Height') },
      },
    ],
  },
];

export type ContainerTypes = 'FLEX' | 'LINEAR' | 'ABSOLUTE' | undefined;

export interface PageComponentProps {
  /**
   * componentType - The type of component
   */
  componentType: string;
  /**
   * path - the path of the current component
   */
  path: number[];
  /**
   * childrenType - the item type of the component
   */
  childrenType: ContainerTypes;
  /**
   * containerType - the container type of the component
   */
  containerType: ContainerTypes;
  /**
   * last - is this component the last of the list
   */
  last?: boolean;
}

export interface WegasComponentProps
  extends React.PropsWithChildren<ClassAndStyle>,
    PageComponentProps {
  /**
   * name - The name of the component in the page
   */
  name?: string;
  /**
   * options - Various options that can be defined on every component of a page
   */
  options?: {
    actions?: WegasComponentOptionsActions & WegasComponentActionsProperties;
    upgrades?: WegasComponentUpgrades;
    [options: string]: unknown;
  };
}

/**
 * Extracted props from used layouts (needed here to define orientation of the container)
 */
interface ExtractedLayoutProps {
  layout?: FlexListProps['layout'];
  vertical?: ContainerProps['vertical'];
}

type ComponentContainerProps = WegasComponentProps & ExtractedLayoutProps;

const dispatch = pagesStateStore.dispatch;

export function ComponentContainer({
  componentType,
  path,
  childrenType,
  containerType,
  last,
  name,
  options,
  layout,
  vertical,
  className,
  style,
  children,
}: ComponentContainerProps) {
  const container = React.useRef<HTMLDivElement>();
  const [stackedHandles, setStackedHandles] = React.useState<JSX.Element[]>();

  const [{ isOver }, dropZone] = useDndComponentDrop();

  const {
    onDrop,
    editMode,
    handles,
    pageIdPath,
    showBorders,
  } = React.useContext(pageCTX);

  const isFocused = usePagesStateStore(
    ({ focusedComponent }) =>
      (editMode &&
        focusedComponent &&
        focusedComponent.pageId === pageId &&
        JSON.stringify(focusedComponent.componentPath) ===
          JSON.stringify(path)) === true,
    deepDifferent,
  );

  const computedVertical =
    containerType === 'FLEX'
      ? layout?.flexDirection === 'column' ||
        layout?.flexDirection === 'column-reverse'
      : containerType === 'LINEAR'
      ? vertical
      : false;

  const containerPath = [...path];
  const itemPath = containerPath.pop();
  const isNotFirstComponent = path.length > 0;
  const editable = editMode && isNotFirstComponent;

  const Container = React.useMemo(() => {
    switch (childrenType) {
      case 'LINEAR':
        return Content;
      case 'ABSOLUTE':
        return AbsoluteItem;
      case 'FLEX':
      default:
        return FlexItem;
    }
  }, [childrenType]);

  const pageId = pageIdPath.slice(0, 1)[0];

  return (
    <>
      <Container
        ref={ref => {
          dropZone(ref);
          if (ref != null) {
            container.current = ref;
          }
        }}
        {...omit(options, ['actions', 'upgrades'])}
        className={
          cx(handleControlStyle, flex, {
            [layoutHighlightStyle]: showBorders,
            [childHighlightStyle]: showBorders,
            [handleControlHoverStyle]: editMode,
            [focusedComponentStyle]: isFocused,
            [childDropzoneHorizontalStyle]: !computedVertical,
            [childDropzoneVerticalStyle]: computedVertical,
          }) + classNameOrEmpty(className)
        }
        style={{
          cursor: options?.actions ? 'pointer' : 'initial',
          ...style,
        }}
        onClick={() => {
          if (options && options.actions) {
            if (
              !options.actions.confirmClick ||
              // TODO : Find a better way to do that than a modal!!!
              // eslint-disable-next-line no-alert
              confirm(options.actions.confirmClick)
            ) {
              if (options.actions?.lock) {
                // LockAPI.lockPlayer(options.actions?.lock)
                //   .then(res => {
                //     wlog(res);
                //     debugger;
                //   })
                //   .catch(res => {
                //     wlog(res);
                //     debugger;
                //   });
              }
              Object.entries(
                omit(
                  options.actions,
                  'confirmClick',
                  'lock',
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
        onMouseOver={e => {
          if (editable) {
            e.stopPropagation();
            if (!stackedHandles) {
              setStackedHandles(() => computeHandles(handles, path));
            }
            // focusComponent({ pageId: pageId, componentPath: path });
            dispatch({
              type: 'COMPONENT_SET_FOCUSED',
              payload: { pageId: pageId, componentPath: path },
            });
          }
        }}
        onMouseLeave={() => {
          if (editable) {
            setStackedHandles(undefined);
          }
          // focusComponent(undefined);
          dispatch({ type: 'COMPONENT_SET_FOCUSED', payload: undefined });
        }}
        tooltip={options?.upgrades?.tooltip}
      >
        {editable && containerType === 'ABSOLUTE' && (
          <ComponentDropZone
            onDrop={(dndComponent, dndMonitor) => {
              if (container.current) {
                const { x: absX, y: absY } = dndMonitor.getClientOffset() || {
                  x: 0,
                  y: 0,
                };
                const {
                  left: srcX,
                  top: srcY,
                } = container.current.getBoundingClientRect() || {
                  x: 0,
                  y: 0,
                };

                const [relX, relY] = [absX - srcX, absY - srcY];

                onDrop(dndComponent, path, undefined, {
                  options: {
                    layout: { position: { left: relX, top: relY } },
                  },
                });
              }
            }}
            show={isOver}
            dropPosition="INTO"
          />
        )}
        {editable && childrenType !== 'ABSOLUTE' && (
          <ComponentDropZone
            onDrop={dndComponent =>
              onDrop(dndComponent, containerPath, itemPath)
            }
            show={isOver}
            dropPosition="BEFORE"
          />
        )}
        {editable && (
          <EditHandle
            componentName={name}
            stackedHandles={stackedHandles}
            componentType={componentType}
            path={path}
          />
        )}
        <ErrorBoundary>{children}</ErrorBoundary>
        {options?.upgrades?.infoBeam && (
          <InfoBeam {...options.upgrades.infoBeam} />
        )}
        {editable && childrenType !== 'ABSOLUTE' && (
          <ComponentDropZone
            onDrop={dndComponent =>
              onDrop(
                dndComponent,
                containerPath,
                itemPath != null ? itemPath + 1 : itemPath,
              )
            }
            show={isOver}
            dropPosition="AFTER"
          />
        )}
      </Container>
      {childrenType === 'LINEAR' && !last && <Splitter />}
    </>
  );
}

interface EditorHandleProps {
  componentName?: WegasComponentProps['name'];
  componentType: WegasComponentProps['componentType'];
  path: number[];
  stackedHandles?: JSX.Element[];
}

function EditHandle({
  componentName,
  componentType,
  path,
  stackedHandles,
}: EditorHandleProps) {
  const handleRef = React.createRef<HTMLDivElement>();
  const {
    onEdit,
    onDelete,
    handles,
    editMode,
    showControls,
  } = React.useContext(pageCTX);

  const HandleContent = React.forwardRef<HTMLDivElement>((_, ref) => {
    const [, drag] = useComponentDrag(componentType, path);
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
          {(componentName ? componentName + ' : ' : '') + componentType}
        </div>
        <div className={cx(flex, flexRow) + ' wegas-component-handle-content'}>
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
        </div>
      </div>
    );
  });
  handles[flattenPath(path)] = { jsx: <HandleContent />, dom: handleRef };

  return editMode && showControls ? (
    <div
      ref={e => {
        if (e != null) {
          const div = e as HTMLDivElement;
          const parent = div.parentElement as HTMLElement;
          div.style.setProperty('position', 'fixed');
          div.style.setProperty(
            'top',
            String(parent.getBoundingClientRect().top - 30) + 'px',
          );
          div.style.setProperty(
            'left',
            String(parent.getBoundingClientRect().left - 30) + 'px',
          );
        }
      }}
      style={{
        zIndex: 1000,
      }}
      className={'wegas-component-handle'}
    >
      {stackedHandles && stackedHandles.length > 0 ? (
        stackedHandles.map((v, i) => (
          <React.Fragment key={i}>{v}</React.Fragment>
        ))
      ) : (
        <HandleContent ref={handleRef} />
      )}
    </div>
  ) : null;
}

interface ComponentDropZoneProps {
  /**
   * onDrop - the called function when an authorized element is dropped on the zone
   */
  onDrop?: (dndComponnent: DnDComponent, dndMonitor: DropTargetMonitor) => void;
  /**
   * show - show the zone, hidden by default
   */
  show?: boolean;
  /**
   * dropPosition - defines the position of the dropzone in a component
   * left or top for AFTER, right or bottom for BEFORE and over for INTO
   */
  dropPosition: 'BEFORE' | 'AFTER' | 'INTO';
}

function ComponentDropZone({
  onDrop,
  show,
  dropPosition,
}: ComponentDropZoneProps) {
  const [{ isOverCurrent }, dropZone] = useDndComponentDrop(onDrop);
  return (
    <div
      ref={dropZone}
      className={
        dropZoneClass(isOverCurrent) +
        (dropPosition === 'INTO'
          ? ' component-dropzone-into'
          : ' component-dropzone') +
        (dropPosition === 'AFTER' ? ' component-dropzone-after' : '')
      }
      style={{
        visibility: show ? 'visible' : 'collapse',
        position: 'absolute',
      }}
    />
  );
}

const layoutChoices = {
  FLEX: [
    {
      label: 'Layout',
      value: { prop: 'layout' },
      items: flexlayoutChoices,
    },
  ],
  LINEAR: [],
  ABSOLUTE: [
    {
      label: 'Layout',
      value: { prop: 'layout' },
      items: absolutelayoutChoices,
    },
  ],
};

export const wegasComponentCommonSchema = {
  name: schemaProps.string('Name', false, undefined, undefined, -1),
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

export const wegasComponentOptionsSchema = (containerType: ContainerTypes) => ({
  options: schemaProps.hashlist(
    'Options',
    false,
    [
      ...(containerType ? layoutChoices[containerType] : []),
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
    undefined,
    true,
  ),
});
