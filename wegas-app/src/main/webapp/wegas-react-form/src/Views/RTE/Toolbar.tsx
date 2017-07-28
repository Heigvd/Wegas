import * as React from 'react';
import { EditorState } from 'draft-js';
import { css } from 'glamor';
import {
    InlineStyleButton,
    BlockStyleButton,
    StyleButton,
} from './StyleButton';
import { BACKGROUND_COLORS, FOREGROUND_COLORS } from './color';
import { FONT_FAMILY, FONT_SIZE } from './font';
import { UrlButton } from './link';
import Popover from '../../Components/Popover';
import { MediaButton } from './media';

interface ToolbarProps {
    editorState: EditorState;
    onChange: (editorState: EditorState) => void;
}
class Toolbar extends React.Component<
    ToolbarProps,
    {
        fontFGSelect: boolean;
        fontBGSelect: boolean;
        fontFamilySelect: boolean;
        fontSizeSelect: boolean;
    }
> {
    constructor(props: ToolbarProps) {
        super(props);
        this.state = {
            fontFGSelect: false,
            fontBGSelect: false,
            fontFamilySelect: false,
            fontSizeSelect: false,
        };
    }
    render() {
        return (
            <div
                {...css({
                    textAlign: 'left',
                })}
            >
                <InlineStyleButton
                    glyph="bold"
                    onClick={this.props.onChange}
                    editorState={this.props.editorState}
                    type="BOLD"
                />
                <InlineStyleButton
                    glyph="italic"
                    onClick={this.props.onChange}
                    editorState={this.props.editorState}
                    type="ITALIC"
                />
                <BlockStyleButton
                    glyph="list-ul"
                    onClick={this.props.onChange}
                    editorState={this.props.editorState}
                    type="unordered-list-item"
                />
                <BlockStyleButton
                    glyph="list-ol"
                    onClick={this.props.onChange}
                    editorState={this.props.editorState}
                    type="ordered-list-item"
                />
                <UrlButton
                    glyph="link"
                    type="LINK"
                    onClick={this.props.onChange}
                    editorState={this.props.editorState}
                />
                <MediaButton
                    glyph="picture-o"
                    type="IMAGE"
                    onClick={this.props.onChange}
                    editorState={this.props.editorState}
                />
                <StyleButton
                    glyph="font"
                    active={false}
                    glamorStyle={css({
                        borderBottom: '2px solid',
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    })}
                    onClick={() => {
                        this.setState({
                            fontBGSelect: !this.state.fontBGSelect,
                        });
                    }}
                />
                <Popover
                    show={this.state.fontBGSelect}
                    onClickOutside={() =>
                        this.setState({ fontBGSelect: false })}
                >
                    {Object.keys(BACKGROUND_COLORS).map(k =>
                        <InlineStyleButton
                            glamorStyle={css({
                                textShadow: '0 0 2px white',
                            })}
                            key={k}
                            glyph="font"
                            onClick={this.props.onChange}
                            editorState={this.props.editorState}
                            type={k}
                            style={BACKGROUND_COLORS[k]}
                            stripStyle={Object.keys(BACKGROUND_COLORS)}
                        />
                    )}
                </Popover>
                <StyleButton
                    glyph="font"
                    glamorStyle={css({
                        borderBottom: '2px solid',
                    })}
                    active={false}
                    onClick={() => {
                        this.setState({
                            fontFGSelect: !this.state.fontFGSelect,
                        });
                    }}
                />
                <Popover
                    show={this.state.fontFGSelect}
                    onClickOutside={() =>
                        this.setState({ fontFGSelect: false })}
                >
                    {Object.keys(FOREGROUND_COLORS).map(k =>
                        <InlineStyleButton
                            glamorStyle={css({
                                textShadow: '0 0 1px black',
                                transform: 'text-shadow 200ms',
                            })}
                            glamorActiveStyle={css({
                                textShadow: '0 0 2px #1d85f7',
                            })}
                            key={k}
                            glyph="font"
                            onClick={this.props.onChange}
                            editorState={this.props.editorState}
                            type={k}
                            style={FOREGROUND_COLORS[k]}
                            stripStyle={Object.keys(FOREGROUND_COLORS)}
                        />
                    )}
                </Popover>
                <StyleButton
                    glyph=""
                    active={false}
                    onClick={() => {
                        this.setState({
                            fontFamilySelect: !this.state.fontFamilySelect,
                        });
                    }}
                >
                    Font
                </StyleButton>
                <Popover
                    show={this.state.fontFamilySelect}
                    onClickOutside={() =>
                        this.setState({ fontFamilySelect: false })}
                >
                    {Object.keys(FONT_FAMILY).map(k =>
                        <InlineStyleButton
                            key={k}
                            glyph=""
                            onClick={this.props.onChange}
                            editorState={this.props.editorState}
                            type={k}
                            style={FONT_FAMILY[k]}
                            stripStyle={Object.keys(FONT_FAMILY)}
                        >
                            {FONT_FAMILY[k].fontFamily}
                        </InlineStyleButton>
                    )}
                </Popover>
                <StyleButton
                    glyph=""
                    active={false}
                    onClick={() => {
                        this.setState({
                            fontSizeSelect: !this.state.fontSizeSelect,
                        });
                    }}
                >
                    Size
                </StyleButton>
                <Popover
                    show={this.state.fontSizeSelect}
                    onClickOutside={() =>
                        this.setState({ fontSizeSelect: false })}
                >
                    {Object.keys(FONT_SIZE).map(k =>
                        <InlineStyleButton
                            key={k}
                            glyph=""
                            onClick={this.props.onChange}
                            editorState={this.props.editorState}
                            type={k}
                            style={FONT_SIZE[k]}
                            stripStyle={Object.keys(FONT_SIZE)}
                        >
                            {FONT_SIZE[k].fontSize}
                        </InlineStyleButton>
                    )}
                </Popover>
            </div>
        );
    }
}
export default Toolbar;
