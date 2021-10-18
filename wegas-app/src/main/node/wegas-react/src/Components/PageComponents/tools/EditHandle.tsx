import { css, cx } from '@emotion/css';
import * as React from 'react';
import { flex, flexColumn, flexRow, textCenter } from '../../../css/classes';
import { MessageString } from '../../../Editor/Components/MessageString';
import { pageCTX } from '../../../Editor/Components/Page/PageEditor';
import {
  PageComponentNode,
  PAGEEDITOR_COMPONENT_TYPE,
} from '../../../Editor/Components/Page/PagesLayout';
import { Button } from '../../Inputs/Buttons/Button';
import { ConfirmButton } from '../../Inputs/Buttons/ConfirmButton';
import { themeVar } from '../../Theme/ThemeVars';
import { WegasComponentProps } from './EditableComponent';

const handleContentStyle = css({
  borderRadius: themeVar.dimensions.BorderRadius,
  borderStyle: 'solid',
  borderColor: themeVar.colors.PrimaryColor,
  backgroundColor: themeVar.colors.BackgroundColor,
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
   * pageId - The id of the page where the component is
   */
  pageId: string;
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
  /**
   * isSelected - the component is selected
   */
  isSelected: boolean;
}

export function EditHandle({
  name,
  componentType,
  pageId,
  path,
  stackedHandles,
  infoMessage,
  isSelected,
}: EditorHandleProps) {
  const handleRef = React.createRef<HTMLDivElement>();
  const { onEdit, onDelete, handles, editMode, showControls } =
    React.useContext(pageCTX);

  const HandleContent = React.forwardRef<HTMLDivElement>((_, ref) => {
    const data: PageComponentNode = { pageId, componentPath: path };

    return (
      <div
        ref={ref}
        className={cx(flex, flexColumn, handleContentStyle, {
          // [desapearingStyle]: isDragging,
        })}
        //Avoiding the container actions to trigger when using handle
        onClick={event => event.stopPropagation()}
        // style={{ visibility: isDragging ? 'collapse' : 'visible' }}
      >
        <div
          style={{
            fontSize: '10px',
          }}
          className={
            cx(flex, flexRow, textCenter) + ' wegas-component-handle-title'
          }
        >
          {(name ? name + ' : ' : '') + componentType}
        </div>
        {infoMessage && <MessageString type="warning" value={infoMessage} />}
        <div className={cx(flex, flexRow) + ' wegas-component-handle-content'}>
          <Button
            icon="edit"
            onClick={() => onEdit(isSelected ? undefined : path)}
          />
          <Button
            icon="arrows-alt"
            draggable
            onDragStart={e => {
              e.stopPropagation();
              e.dataTransfer.setData('data', JSON.stringify(data));
              e.dataTransfer.setData(PAGEEDITOR_COMPONENT_TYPE, '');
            }}
          />
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
        zIndex: 100000,
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
