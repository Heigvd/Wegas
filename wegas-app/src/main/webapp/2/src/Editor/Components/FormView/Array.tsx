import * as React from 'react';
import { css } from 'emotion';
import { WidgetProps } from 'jsoninput/typings/types';
import { Cover } from '../../../Components/Cover';
import { IconButton } from '../../../Components/Button/IconButton';
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

class Adder extends React.Component<
  WidgetProps.ArrayProps & IArrayProps & { id: string },
  { open: boolean }
> {
  constructor(props: WidgetProps.ArrayProps & IArrayProps & { id: string }) {
    super(props);
    this.state = {
      open: false,
    };
  }
  render() {
    if (Array.isArray(this.props.view.choices)) {
      return this.state.open ? (
        <Cover onClick={() => this.setState({ open: false })} zIndex={100}>
          <Menu
            items={this.props.view.choices}
            onSelect={({ value }) =>
              this.setState({ open: false }, () => this.props.onChildAdd(value))
            }
          />
        </Cover>
      ) : (
        <IconButton
          id={this.props.id}
          icon="plus-circle"
          onClick={() => this.setState({ open: true })}
          tooltip={this.props.view.tooltip}
        />
      );
    }
    return (
      <IconButton
        id={this.props.id}
        icon="plus-circle"
        onClick={() => this.props.onChildAdd()}
        tooltip={this.props.view.tooltip}
      />
    );
  }
}
function ArrayWidget(props: IArrayProps) {
  const valueLength = Array.isArray(props.value) ? props.value.length : 0;
  const { maxItems = Infinity, minItems = 0 } = props.schema;
  const disabled = props.view.disabled;
  function renderChild(child: React.ReactChild, index: number) {
    return (
      <div className={listElementContainerStyle}>
        <div className={listElementStyle}>{child}</div>
        {minItems < valueLength && !disabled ? (
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
              {maxItems > valueLength &&
                !disabled && <Adder id={inputId} {...props} />}
              {children}
            </>
          );
        }}
      </Labeled>
    </CommonViewContainer>
  );
}

export default ArrayWidget;
