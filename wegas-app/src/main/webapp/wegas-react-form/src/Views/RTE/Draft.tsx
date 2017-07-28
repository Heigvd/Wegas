import * as React from 'react';
import { Editor, EditorState, RichUtils } from 'draft-js';
import { css } from 'glamor';
import '!!style-loader!css-loader!draft-js/dist/Draft.css';

import Toolbar from './Toolbar';
import { HTMLToState, StateToHTML, inlineStyles, decorators } from './styles';
import { MediaBlockRenderer } from './media';
interface DraftProps {
    value?: string;
    onChange: (value: string) => void;
}
function HTMLToEditorState(value: string | null | undefined) {
    if (value != null) {
        const state = HTMLToState(value);
        return EditorState.createWithContent(state, decorators);
    }
    return EditorState.createEmpty(decorators);
}

class Draft extends React.Component<DraftProps, { editorState: EditorState }> {
    html: string;
    constructor(props: DraftProps) {
        super(props);
        this.state = { editorState: HTMLToEditorState(props.value) };
        this.onChangeHandler = this.onChangeHandler.bind(this);
        this.handleKeyCommandHandler = this.handleKeyCommandHandler.bind(this);
    }
    componentWillReceiveProps(nextProps: DraftProps) {
        if (this.html !== nextProps.value) {
            this.setState({ editorState: HTMLToEditorState(nextProps.value) });
        }
    }
    onChangeHandler(editorState: EditorState) {
        this.html = StateToHTML(editorState.getCurrentContent());
        this.setState({ editorState }, () => this.props.onChange(this.html));
        console.log(this.html);
    }
    handleKeyCommandHandler(command: string) {
        const { editorState } = this.state;
        const newState = RichUtils.handleKeyCommand(editorState, command);
        if (newState) {
            this.onChangeHandler(newState);
            return 'handled';
        }
        return 'not-handled';
    }
    render() {
        return (
            <div>
                <Toolbar
                    editorState={this.state.editorState}
                    onChange={this.onChangeHandler}
                />
                <div
                    {...css({
                        width: '100%',
                        boxShadow: '0 0 1px inset',
                        padding: '1px',
                    })}
                >
                    <Editor
                        blockRendererFn={contentBlock => {
                            const type = contentBlock.getType();
                            if (type === 'atomic') {
                                return {
                                    component: MediaBlockRenderer,
                                    editable: false,
                                    props: contentBlock.getData(),
                                };
                            }
                        }}
                        editorState={this.state.editorState}
                        onChange={this.onChangeHandler}
                        handleKeyCommand={this.handleKeyCommandHandler}
                        customStyleMap={inlineStyles}
                    />
                </div>
            </div>
        );
    }
}

export default Draft;
