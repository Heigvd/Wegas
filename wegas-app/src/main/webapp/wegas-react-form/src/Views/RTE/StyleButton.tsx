import * as React from 'react';
import { EditorState, RichUtils, Modifier } from 'draft-js';
import { css, StyleAttribute } from 'glamor';
const buttonStyle = css({
    background: 'none',
    border: 'none',
    transition: 'color 200ms',
});
const activeStyle = css({
    color: '#1d85f7',
});
function updateInline(
    state: EditorState,
    type: string,
    stripStyle: string[] = []
) {
    const selection = state.getSelection();
    const stylesToRemove = stripStyle.concat([type]);
    // remove all associated style
    const nextContentState = stylesToRemove.reduce(
        (prevContentState, style) =>
            Modifier.removeInlineStyle(prevContentState, selection, style),
        state.getCurrentContent()
    );
    let nextEditorState = EditorState.push(
        state,
        nextContentState,
        'change-inline-style'
    );
    const currentStyle = state.getCurrentInlineStyle();
    if (selection.isCollapsed()) {
        nextEditorState = currentStyle.reduce(
            (prevEditorState: EditorState, style: string) =>
                stylesToRemove.includes(style)
                    ? RichUtils.toggleInlineStyle(prevEditorState, style)
                    : prevEditorState,
            nextEditorState
        );
    }
    if (!currentStyle.has(type)) {
        nextEditorState = RichUtils.toggleInlineStyle(nextEditorState, type);
    }
    return nextEditorState;
}
function updateBlock(state: EditorState, type: string) {
    return RichUtils.toggleBlockType(state, type);
}

export interface StyleButtonProps {
    editorState: EditorState;
    onClick: (state: EditorState) => void;
    type: string;
    glyph: string;
    style?: React.CSSProperties;
    glamorStyle?: StyleAttribute;
    glamorActiveStyle?: StyleAttribute;
    stripStyle?: string[];
    children?: React.ReactChild;
}
interface StyleButtonArgs {
    active: boolean;
    onClick: () => void;
    glyph: string;
    style?: React.CSSProperties;
    glamorStyle?: StyleAttribute;
    glamorActiveStyle?: StyleAttribute;
    children?: React.ReactChild;
}
export function StyleButton<P extends StyleButtonArgs>({
    onClick,
    glyph,
    style,
    glamorStyle,
    children,
    active,
    glamorActiveStyle = activeStyle,
}: P) {
    return (
        <button
            {...css(
                buttonStyle,
                glamorStyle,
                active ? glamorActiveStyle : void 0
            )}
            style={style}
            onMouseDown={e => {
                e.preventDefault(); // prevent loosing focus
                onClick();
            }}
        >
            <span className={`fa fa-${glyph}`} />
            {children}
        </button>
    );
}

export function InlineStyleButton(props: StyleButtonProps) {
    const active = props.editorState.getCurrentInlineStyle().has(props.type);
    return StyleButton({
        ...props,
        active,
        onClick: () =>
            props.onClick(
                updateInline(props.editorState, props.type, props.stripStyle)
            ),
    });
}
export function BlockStyleButton(props: StyleButtonProps) {
    const selection = props.editorState.getSelection();
    const blockType = props.editorState
        .getCurrentContent()
        .getBlockForKey(selection.getStartKey())
        .getType();
    const active = blockType === props.type;
    return StyleButton({
        ...props,
        active,
        onClick: () =>
            props.onClick(updateBlock(props.editorState, props.type)),
    });
}
