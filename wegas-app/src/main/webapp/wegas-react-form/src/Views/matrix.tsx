// Array of Array toggle (matrix)
import * as React from 'react';
import { WidgetProps } from 'jsoninput/typings/types';
import commonView from '../HOC/commonView';
import labeled from '../HOC/labeled';
import { css } from 'glamor';

interface IMatrixView {
    valueToBool: (value: unknown) => boolean;
    boolToValue: (bool: boolean) => unknown;
    trueColor?: string;
    falseColor?: string;
}
interface IMatrixProps extends WidgetProps.ArrayProps<IMatrixView> {
    value: (unknown[])[];
    id: string;
}
function defaultValueToBool(e: unknown) {
    return Boolean(e);
}
function defaultBoolToValue(b: boolean) {
    return b;
}
const rowStyle = css({
    display: 'flex',
    flexDirection: 'row',
});
function size(matrix: (unknown[])[]) {
    const x = matrix[0] ? matrix[0].length : 0;
    return [x, matrix.length];
}
const colStyle = css({
    flex: '0 0 auto',
    height: '1.5em',
    width: '1.5em',
    cursor: 'pointer',
    border: '1px solid white',
});
const sizeStyle = css({
    width: '3em',
});
class Matrix extends React.Component<IMatrixProps> {
    XSize: HTMLInputElement | null = null;
    YSize: HTMLInputElement | null = null;
    toggle(x: number, y: number) {
        const {
            value,
            onChange,
            view: {
                valueToBool = defaultValueToBool,
                boolToValue = defaultBoolToValue,
            },
        } = this.props;
        const newValue = value.map((r, yI) => {
            return y !== yI
                ? r
                : r.map((c, xI) => {
                      return x !== xI ? c : boolToValue(!valueToBool(c));
                  });
        });
        onChange(newValue);
    }
    resize = () => {
        const newY = Number(this.YSize!.value);
        const newX = Number(this.XSize!.value);
        const {
            value,
            onChange,
            view: { boolToValue = defaultBoolToValue },
        } = this.props;
        const tmpValue: (unknown[])[] = [];
        const s = size(value);
        const xL: unknown[] = [];
        xL.length = newX;
        tmpValue.length = newY;
        xL.fill(null);
        tmpValue.fill(xL);
        const newValue = tmpValue.map((ey, yI) => {
            return ey.map((ex, xI) => {
                return yI < s[1] && xI < s[0]
                    ? value[yI][xI]
                    : boolToValue(false);
            });
        });
        onChange(newValue);
    };
    render() {
        const {
            id,
            value,
            view: {
                valueToBool = defaultValueToBool,
                trueColor = 'rgba(167, 206, 246, 1)',
                falseColor = 'rgba(167, 206, 246, 0.3)',
            },
        } = this.props;
        const [x, y] = size(value);
        return (
            <div id={id}>
                <div>
                    <input
                        {...sizeStyle}
                        ref={n => (this.YSize = n)}
                        type="number"
                        value={y}
                        onChange={this.resize}
                    />
                    X
                    <input
                        {...sizeStyle}
                        ref={n => (this.XSize = n)}
                        type="number"
                        value={x}
                        onChange={this.resize}
                    />
                </div>
                {value.map((row, y) => {
                    return (
                        <div key={y} {...rowStyle}>
                            {row.map((col, x) => (
                                <div
                                    {...colStyle}
                                    key={x}
                                    onMouseDown={() => this.toggle(x, y)}
                                    onMouseEnter={e => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (e.buttons === 1) {
                                            this.toggle(x, y);
                                        }
                                    }}
                                    style={{
                                        backgroundColor: valueToBool(col)
                                            ? trueColor
                                            : falseColor,
                                    }}
                                />
                            ))}
                        </div>
                    );
                })}
            </div>
        );
    }
}
export default commonView(labeled(Matrix));
