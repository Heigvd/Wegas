import React from 'react';
import debounced from '../../HOC/callbackDebounce';
import JSEditor from './asyncJSEditor';
import IconButton from '../../Components/IconButton';
import { getY } from '../../index';
import { css } from 'glamor';

interface IViewSrcProps {
    value: string;
    error: string;
    readOnly: boolean;
    onChange: (value: string) => void;
}
const runButton = css({
    transition: 'color 300ms',
});
const red = css({ color: 'red' });
const green = css({ color: 'green' });
const viewSourceTooltip = 'Open source code';
const hideSourceTooltip = 'Hide source code';
/**
 * Toggle view between parsed and code
 */
class ViewSrc extends React.Component<
    IViewSrcProps,
    { src: boolean; error?: string; evaluating: boolean }
> {
    constructor(props: IViewSrcProps) {
        super(props);
        this.state = {
            src: getY().Wegas.Config.ShowImpactAsSource, // shameless hack
            evaluating: false,
        };
        this.toggleState = this.toggleState.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.runCode = this.runCode.bind(this);
    }
    componentWillReceiveProps(nextProps: IViewSrcProps) {
        this.setState({ error: undefined });
    }
    toggleState() {
        this.setState({
            src: !this.state.src,
        });
    }
    runCode() {
        const Y = getY();
        const context = (Y.Plugin.EditEntityAction as any).currentEntity
            ? (Y.Plugin.EditEntityAction as any).currentEntity.get('id')
            : null;
        this.setState({ evaluating: true, error: undefined });
        Y.Wegas.Facade.Variable.script.remoteEval(
            this.props.value,
            {
                on: {
                    success: () => this.setState({ error: '', evaluating: false }),
                    failure: (e: any) =>
                        this.setState({
                            error: e.response.results.events[0]
                                .get('val.exceptions.0')
                                .get('val.localizedMessage'),
                            evaluating: false,
                        }),
                },
            },
            undefined,
            context,
        );
    }
    handleChange(value: string) {
        this.props.onChange(value);
    }
    render() {
        let child;
        const className =
            this.state.error === undefined
                ? ''
                : this.state.error === ''
                ? green.toString()
                : red.toString();
        if (this.state.src || this.props.error) {
            child = [
                <JSEditor
                    key="editor"
                    value={this.props.value}
                    width="100%"
                    height="200px"
                    focus
                    readOnly={this.props.readOnly}
                    onChange={this.handleChange}
                />,
                <div key="error">{this.props.error || <br />}</div>,
            ];
        } else {
            child = this.props.children;
        }
        return (
            <span>
                <IconButton
                    icon="fa fa-code"
                    onClick={this.toggleState}
                    tooltip={this.state.src ? hideSourceTooltip : viewSourceTooltip}
                    active={this.state.src}
                />
                <IconButton
                    icon="fa fa-play"
                    tooltip={this.state.error || 'Run code'}
                    onClick={this.runCode}
                    className={`${runButton.toString()} ${className} run-code`}
                    active={this.state.evaluating}
                />
                {child}
            </span>
        );
    }
}

export default debounced('onChange')(ViewSrc);
