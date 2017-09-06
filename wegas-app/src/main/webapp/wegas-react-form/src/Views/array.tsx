import React from 'react';
import { css } from 'glamor';
import FormStyles from './form-styles';
import commonView from '../HOC/commonView';
import IconButton from '../Components/IconButton';
import { AddOptionButton } from '../Script/Views/Button';
import Menu from '../Components/Menu';
import { WidgetProps } from "jsoninput/typings/types";
import { Cover } from "../Components/Cover";

const arrayStyle = css({
    display: 'inline'
});

const hiddenStyle = css({
    opacity: 0,
    fontSize: '18px',
});

const listElementContainerStyle = css({
    clear: 'both',
    ':first-of-type' : {
        marginTop: '10px'
    },
    ':hover span': {
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

const optionLabelStyle = css(
    FormStyles.labelStyle,
    {
        fontSize: FormStyles.labelBigFontSize,
        paddingRight: '5px',
        verticalAlign: '1px'
    }
);

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
        if (Array.isArray(this.props.view.choices)) {
            return (this.state.open ?
                <Cover onClick={() => this.setState({ open: false })} zIndex={100}>
                    <Menu
                        menu={this.props.view.choices}
                        onChange={(value: {}) => this.setState({ open: false }, () => this.props.onChildAdd(value))} />
                </Cover>
                :
                <AddOptionButton
                    className={`${inlinePlusStyle}`}
                    icon="fa fa-plus-circle"
                    onClick={() => this.setState({ open: true })}
                    tooltip={this.props.view.tooltip}
                    label={this.props.view.label}
                    labelClassName={`${optionLabelStyle}`}
                />
            );
        }
        return <AddOptionButton
            className={`${inlinePlusStyle}`}
            icon="fa fa-plus-circle"
            onClick={() => this.props.onChildAdd()}
            tooltip={this.props.view.tooltip}
            label={this.props.view.label}
            labelClassName={`${optionLabelStyle}`}
        />;
    }
}
function ArrayWidget(props: WidgetProps.ArrayProps & IArrayProps) {
    const valueLength = Array.isArray(props.value) ? props.value.length : 0;
    const { maxItems = Infinity, minItems = 0 } = props.schema;
    const disabled = props.view.disabled;
    function renderChild(child: React.ReactChild, index: number) {
        return (
            <div className={listElementContainerStyle.toString()}>
                <span className={listElementStyle.toString()}>
                    {child}
                </span>
                <span className={hiddenStyle.toString()}>
                    {minItems < valueLength && !disabled
                        ? <IconButton
                            icon="fa fa-trash"
                            onClick={() => props.onChildRemove(index)}
                            tooltip="Delete this group"
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
            {maxItems > valueLength && !disabled
                ? <Adder {...props} />
                : <label
                    className={FormStyles.biggerLabelStyle.toString()}
                  >
                    {props.view.label}
                </label>
            }
            {children}
        </div>
    );
}

export default commonView(ArrayWidget);
