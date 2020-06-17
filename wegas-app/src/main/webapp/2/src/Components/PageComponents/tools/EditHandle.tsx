import * as React from 'react';
import { WegasComponentProps } from './EditableComponent';
import { pageCTX } from '../../../Editor/Components/Page/PageEditor';
import { useComponentDrag } from '../../../Editor/Components/Page/ComponentPalette';
import { cx, css } from 'emotion';
import { flex, flexColumn, flexRow, textCenter } from '../../../css/classes';
import { IconButton } from '../../Inputs/Buttons/IconButton';
import { ConfirmButton } from '../../Inputs/Buttons/ConfirmButton';
import { MessageString } from '../../../Editor/Components/MessageString';
import { themeVar } from '../../Style/ThemeVars';

const handleContentStyle = css({
  borderRadius: themeVar.Common.dimensions.BorderRadius,
  borderStyle: 'solid',
  borderColor: themeVar.Common.colors.BorderColor,
  backgroundColor: themeVar.Common.colors.BackgroundColor,
});

interface EditorHandleProps {
  /**
   * name - The name of the component in the page
   */
  name?: WegasComponentProps['name'];
  /**
   * componentType - The type of component
   */
  componentType: WegasComponentProps['componentType'];
  /**
   * path - the path of the current component
   */
  path: WegasComponentProps['path'];
  /**
   * stackedHandles - the handles that overlapses with the current one
   */
  stackedHandles?: JSX.Element[];
  /**
   * infoMessage - a message to shows on the handle
   */
  infoMessage?: string;
}

export function EditHandle({
  name,
  componentType,
  path,
  stackedHandles,
  infoMessage,
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
          {(name ? name + ' : ' : '') + componentType}
        </div>
        {infoMessage && <MessageString type="warning" value={infoMessage} />}
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
  handles[JSON.stringify(path)] = { jsx: <HandleContent />, dom: handleRef };

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
