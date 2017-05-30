import React from 'react';
import { ChromePicker } from 'react-color';
import { css } from 'glamor';
import labeled from '../HOC/labeled';
import commonView from '../HOC/commonView';

interface IColorProps { value?: string; onChange: (value?: string) => void; }

class ColorPicker extends React.Component<IColorProps, { pick: boolean }> {
    constructor(props: IColorProps) {
        super(props);
        this.state = {
            pick: false,
        };
    }
    render() {
        if (this.state.pick) {
            return (
                <div {...css({ position: 'absolute', zIndex: 1 }) }>
                    <ChromePicker
                        disableAlpha
                        color={this.props.value}
                        onChange={(color) => this.props.onChange(color.hex)}
                        onChangeComplete={() => this.setState({ pick: false })}
                    />
                </div>);
        }
        const style = css({
            display: 'inline-block',
            width: '10px',
            height: '10px',
            backgroundColor: this.props.value,
            border: 'solid 1px black',
        });
        return <div onClick={() => this.setState({ pick: true })} ><span {...style} /> {this.props.value}</div>;
    }
}
export default commonView(labeled(ColorPicker));
