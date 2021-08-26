import React from 'react';
import ChromePicker from 'react-color/lib/components/chrome/Chrome';
import { css } from 'glamor';
import labeled from '../HOC/labeled';
import commonView from '../HOC/commonView';
import { Cover } from '../Components/Cover';

interface IColorProps {
    id: string;
    value?: string| null;
    onChange: (value?: string) => void;
}

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
                <Cover
                    zIndex={100}
                    onClick={() => this.setState({ pick: false })}
                >
                    <ChromePicker
                        disableAlpha
                        color={this.props.value || undefined}
                        onChange={color => this.props.onChange(color.hex)}
                    />
                </Cover>
            );
        }
        const style = css({
            display: 'inline-block',
            width: '12px',
            height: '12px',
            backgroundColor: this.props.value,
            border: 'solid 1px black',
        });
        return (
            <div
                id={this.props.id}
                onClick={() => this.setState({ pick: true })}
            >
                <span {...style} /> {this.props.value}
            </div>
        );
    }
}
export default commonView(labeled(ColorPicker));
