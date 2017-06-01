import React from 'react';
import { css } from 'glamor';
import labeled from '../HOC/labeled';
import commonView from '../HOC/commonView';
import IconButton from '../Components/IconButton';
import Menu from '../Components/Menu';
import { WidgetProps } from "jsoninput/typings/types";
import { Cover } from "../Components/Cover";

const arrayContainerStyle = css({
    '& label': {
        display: 'inline-block',
    }
});

const arrayStyle = css({
    display: 'inline'
});

const hiddenStyle = css({
    opacity: 0,
    fontSize: '18px',
});

const listElementContainerStyle = css({
    clear: 'both',
    ':hover *': {
        opacity: 1,
        transition: 'opacity 2s'
    }
});

const listElementStyle = css({
    // Reduce vertical space between array elements:
    '& div': {
        marginTop: 0
    }
});

const inlinePlusStyle = css({
    fontSize: '18px',
    verticalAlign: '-1px'
});

interface IArrayProps {
    view: {
        choices?: {}[],
        tooltip?: string,
    }
}
class Adder extends React.Component<WidgetProps.ArrayProps & IArrayProps, { open: boolean }> {
    constructor(props: WidgetProps.ArrayProps & IArrayProps) {
        super(props);
        this.state = {
            open: false
        }
    }
    render() {
        const tooltip = this.props.view.tooltip ? this.props.view.tooltip : "Add element";
        if (Array.isArray(this.props.view.choices)) {
            return (this.state.open ?
                <Cover onClick={() => this.setState({ open: false })} zIndex={100}>
                    <Menu
                        menu={this.props.view.choices}
                        onChange={(value: {}) => this.setState({ open: false }, () => this.props.onChildAdd(value))} />
                </Cover>
                : <IconButton
                    className={`${inlinePlusStyle}`}
                    icon="fa fa-plus-circle"
                    onClick={() => this.setState({ open: true })}
                    tooltip={tooltip}
                />);
        }
        return <IconButton
            className={`${inlinePlusStyle}`}
            icon="fa fa-plus-circle"
            onClick={() => this.props.onChildAdd()}
            tooltip={tooltip}
        />;
    }
}
function ArrayWidget(props: WidgetProps.ArrayProps & IArrayProps) {
    const valueLength = Array.isArray(props.value) ? props.value.length : 0;
    const { maxItems = Infinity, minItems = 0 } = props.schema;
    function renderChild(child: React.ReactChild, index: number) {
        return (
            <div className={listElementContainerStyle.toString()}>
                <span className={listElementStyle.toString()}>
                    {child}
                </span>
                <span className={hiddenStyle.toString()}>
                    {minItems < valueLength
                        ? <IconButton
                            icon="fa fa-trash"
                            tooltip="Remove"
                            onClick={() => props.onChildRemove(index)}
                            grey
                        />
                        : null}
                </span>
            </div>
        );
    }

    const children = React.Children.map(props.children, renderChild);

    return (
        <div className={arrayStyle.toString()}>
            {maxItems > valueLength
                ? <Adder {...props} />
                : null}
            {children}
        </div>
    );
}

export default commonView(labeled(ArrayWidget, `${arrayContainerStyle}`));
