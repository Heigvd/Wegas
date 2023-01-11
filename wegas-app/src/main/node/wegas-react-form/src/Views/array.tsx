import * as React from 'react';
import { css } from '@emotion/css';
import FormStyles from './form-styles';
import commonView from '../HOC/commonView';
import IconButton from '../Components/IconButton';
import { AddOptionButton } from '../Script/Views/Button';
import Menu from '../Components/Menu';
import { WidgetProps } from 'jsoninput/typings/types';
import { Cover } from '../Components/Cover';
import { SortableContainer, SortableElement, SortableHandle, arrayMove } from 'react-sortable-hoc';
const arrayStyle = css({
    display: 'inline',
});

const listElementContainerStyle = css({
    padding: '3px',
    display: 'flex',
    flexDirection: 'row',
    marginTop: '5px',
});
const highlight = css({
    backgroundColor: 'rgba(106, 172, 241, 0.2)',
    marginRight: '2px',
});

const listElementStyle = css({
    flex: '1 1 auto',
    // Reduce vertical space between array elements:
    '& > div': {
        marginTop: 0,
    },
});

const inlinePlusStyle = css({
    fontSize: '18px',
    verticalAlign: '-1px',
    textAlign: 'left',
});
const horizontal = css({
    '& > div': {
        display: 'flex',
        flexWrap: 'wrap',
    },
});
const optionLabelStyle = css(FormStyles.labelStyle, {
    fontSize: FormStyles.labelBigFontSize,
    paddingRight: '5px',
    verticalAlign: '1px',
});
interface Item {
    label: string;
    value?: {};
    children?: Item[];
}
interface IArrayView {
    choices?: Item[];
    tooltip?: string;
    label?: string | boolean;
    disabled?: boolean;
    readOnly?: boolean;
    /**
     * Enable array sorting (DnD)
     */
    sortable?: boolean;
    /**
     * Composit bg color
     */
    highlight?: boolean;
    horizontal?: boolean;
}
const dragHandleStyle = css({
    alignSelf: 'center',
    opacity: 0.7,
    cursor: 'move',
    marginRight: '15px',
    ':hover': {
        opacity: 1,
    },
});
type IArrayProps = WidgetProps.ArrayProps<IArrayView>

class Adder extends React.Component<IArrayProps, { open: boolean }> {
    constructor(props: IArrayProps) {
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
                        menu={this.props.view.choices}
                        onChange={value => {
                            if (value.value !== undefined) {
                                this.setState({ open: false }, () =>
                                    this.props.onChildAdd(value.value),
                                );
                            }
                        }}
                    />
                </Cover>
            ) : (
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
        const label = this.props.view.label === true ? this.props.editKey : this.props.view.label;

        return (
            <AddOptionButton
                className={`${inlinePlusStyle}`}
                icon="fa fa-plus-circle"
                onClick={() => this.props.onChildAdd()}
                tooltip={this.props.view.tooltip}
                label={label}
                labelClassName={`${optionLabelStyle}`}
            />
        );
    }
}

type SortableItemProps = IArrayProps & { child: React.ReactNode; updateIndex: number };
const DragHandle = SortableHandle(() => <span className={`fa fa-bars ${dragHandleStyle}`} />);
const ChildItem = SortableElement<SortableItemProps>(
    (props: SortableItemProps ) => {
        const valueLength = Array.isArray(props.value) ? props.value.length : 0;
        const { minItems = 0 } = props.schema;
        const disabled = props.view.disabled || props.view.readOnly;
        return (
            <div
                className={`${props.view.highlight ? highlight : ''} ${listElementContainerStyle}`}
            >
                {!disabled && props.view.sortable && <DragHandle />}
                <span className={listElementStyle.toString()}>{props.child}</span>
                <span>
                    {minItems < valueLength && !disabled ? (
                        <IconButton
                            icon="fa fa-trash"
                            onClick={() => props.onChildRemove(props.updateIndex)}
                            tooltip="Delete this group"
                            grey
                        />
                    ) : null}
                </span>
            </div>
        );
    },
);

type SortContainerProps = { children: React.ReactNode };
const SortContainer = SortableContainer<SortContainerProps>(({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
));

function ArrayWidget(props: IArrayProps) {
    const valueLength = Array.isArray(props.value) ? props.value.length : 0;
    const { maxItems = Infinity } = props.schema;
    const disabled = props.view.disabled || props.view.readOnly;
    function renderChild(child: React.ReactChild, index: number) {
        return (
            <ChildItem
                {...props}
                disabled={disabled && !props.view.sortable}
                index={index}
                updateIndex={index}
                child={child}
            />
        );
    }

    const children = React.Children.map(props.children, renderChild);
    const label = props.view.label === true ? props.editKey : props.view.label;
    return (
        <div className={`${arrayStyle} ${props.view.horizontal ? horizontal : ''}`}>
            {maxItems > valueLength && !disabled ? (
                <Adder {...props} />
            ) : (
                <label className={FormStyles.biggerLabelStyle.toString()}>{label}</label>
            )}
            <SortContainer
                useDragHandle
                axis={props.view.horizontal ? 'xy' : 'y'}
                lockAxis={props.view.horizontal ? 'xy' : 'y'}
                onSortEnd={o => props.onChange(arrayMove(props.value!, o.oldIndex, o.newIndex))}
            >
                {children}
            </SortContainer>
        </div>
    );
}

export default commonView(ArrayWidget);
