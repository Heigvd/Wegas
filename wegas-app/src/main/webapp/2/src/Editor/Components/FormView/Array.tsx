import * as React from 'react';
import { css } from 'emotion';
import { WidgetProps } from 'jsoninput/typings/types';
import { IconButton } from '../../../Components/Inputs/Button/IconButton';
import { Menu } from '../../../Components/Menu';
import { CommonViewContainer, CommonView } from './commonView';
import { Labeled, LabeledView } from './labeled';

const transparentStyle = css({
  opacity: 0,
  transition: 'opacity .5s .1s',
  'div:hover > &': {
    opacity: 1,
  },
});

const listElementContainerStyle = css({
  display: 'flex',
});

const listElementStyle = css({
  flex: 1,
  // Reduce vertical space between array elements:
  '& > div': {
    marginTop: 0,
  },
});

interface IArrayProps
  extends WidgetProps.ArrayProps<
    {
      choices?: { label: React.ReactNode; value: string }[];
      tooltip?: string;
      disabled?: boolean;
    } & CommonView &
      LabeledView
  > {
  value?: {}[];
}

function Adder(props: WidgetProps.ArrayProps & IArrayProps & { id: string }) {
  if (Array.isArray(props.view.choices)) {
    return (
      <Menu
        items={props.view.choices}
        icon="plus-circle"
        onSelect={({ value }) => props.onChildAdd(value)}
      />
    );
  }
  return (
    <IconButton
      id={props.id}
      icon="plus-circle"
      onClick={() => props.onChildAdd()}
      tooltip={props.view.tooltip}
    />
  );
}
function ArrayWidget(props: IArrayProps) {
  const valueLength = Array.isArray(props.value) ? props.value.length : 0;
  const { maxItems = Infinity, minItems = 0 } = props.schema;
  const disabled = props.view.disabled;
  const readOnly = props.view.readOnly;

  function renderChild(child: React.ReactChild, index: number) {
    return (
      <div className={listElementContainerStyle}>
        <div className={listElementStyle}>{child}</div>
        {minItems < valueLength && !disabled && !readOnly ? (
          <IconButton
            className={transparentStyle}
            icon="trash"
            onClick={() => props.onChildRemove(index)}
            tooltip="Delete this group"
          />
        ) : null}
      </div>
    );
  }

  const children = React.Children.map(props.children, renderChild);

  return (
    <CommonViewContainer errorMessage={props.errorMessage} view={props.view}>
      <Labeled label={props.view.label} description={props.view.description}>
        {({ inputId, labelNode }) => {
          return (
            <>
              {labelNode}
              {maxItems > valueLength && !disabled && !readOnly && (
                <Adder id={inputId} {...props} />
              )}
              {children}
            </>
          );
        }}
      </Labeled>
    </CommonViewContainer>
  );
}

export default ArrayWidget;
