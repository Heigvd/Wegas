import * as React from 'react';
import {
    ContentBlock,
    ContentState,
    EditorState,
    Modifier,
    RichUtils,
    SelectionState,
} from 'draft-js';
import { StyleButtonProps, StyleButton } from './StyleButton';
import Popover from '../../Components/Popover';

const maybeSelectConsecutiveEntity = (
    editorState: EditorState
): SelectionState => {
    const selection = editorState.getSelection();

    if (!selection.isCollapsed()) {
        return selection;
    }

    const startKey = selection.getStartKey();
    const startOffset = selection.getStartOffset();
    const prevOffset = startOffset - 1;
    const block = editorState.getCurrentContent().getBlockForKey(startKey);
    const characterList = block.getCharacterList();
    const prevChar = characterList.get(prevOffset);
    const nextChar = characterList.get(startOffset);

    if (!prevChar || !nextChar) {
        return selection;
    }

    const prevEntity = prevChar.getEntity();
    const nextEntity = nextChar.getEntity();
    const entity = prevEntity === nextEntity && prevEntity;

    if (!entity) {
        return selection;
    }

    let finalPrevOffset = prevOffset;
    let finalNextOffset = startOffset;

    while (finalPrevOffset > 0) {
        finalPrevOffset--;
        const char = characterList.get(finalPrevOffset);
        if (char && char.getEntity() !== entity) {
            finalPrevOffset++;
            break;
        }
    }

    const blockLength = block.getLength();
    while (finalNextOffset < blockLength) {
        finalNextOffset++;
        const char = characterList.get(finalNextOffset);
        if (char && char.getEntity() !== entity) {
            break;
        }
    }

    return selection.merge({
        anchorOffset: finalPrevOffset,
        focusOffset: finalNextOffset,
    }) as SelectionState;
};
function findLinkEntities(
    contentBlock: ContentBlock,
    callback: (start: number, end: number) => void,
    contentState: ContentState
) {
    contentBlock.findEntityRanges(character => {
        const entityKey = character.getEntity();
        return (
            entityKey !== null &&
            contentState.getEntity(entityKey).getType() === 'LINK'
        );
    }, callback);
}

export function Link({
    url,
    children,
}: {
    [key: string]: {} | undefined;
    url: string;
    children?: React.ReactChildren;
}) {
    return (
        <a href={url}>
            {children}
        </a>
    );
}
const LinkEntity = (props: {
    contentState: ContentState;
    children?: React.ReactChildren;
    entityKey: string;
}) => {
    const { url } = props.contentState.getEntity(props.entityKey).getData();
    return Link({ ...props, url });
};
export const linkDecorator = {
    strategy: findLinkEntities,
    component: LinkEntity,
};
interface LinkInputProps {
    url?: string;
    onValidate?: (url: string) => void;
    onRemove?: () => void;
}
function LinkInput({ url, onValidate, onRemove }: LinkInputProps) {
    let input: HTMLInputElement | null;
    function link({
        url = '',
        onValidate = (url: string) => {},
        onRemove,
    }: LinkInputProps) {
        return (
            <div>
                Url:<input ref={n => (input = n)} defaultValue={url} />
                <button
                    onClick={() => {
                        if (input != null) {
                            onValidate(input.value);
                        }
                    }}
                >
                    Ok
                </button>
                {onRemove != undefined
                    ? <button onClick={onRemove}>Remove</button>
                    : null}
            </div>
        );
    }
    return link({ url, onValidate, onRemove });
}
export class UrlButton extends React.Component<
    StyleButtonProps,
    { selectLink: boolean }
> {
    constructor(props: StyleButtonProps) {
        super(props);
        this.state = {
            selectLink: false,
        };
    }
    render() {
        const selection = this.props.editorState.getSelection();

        const contentState = this.props.editorState.getCurrentContent();
        const startKey = selection.getStartKey();
        const startOffset = selection.getStartOffset();
        const block = contentState.getBlockForKey(startKey);
        const linkKey = block.getEntityAt(startOffset);
        let url = '';
        if (linkKey) {
            const linkInstance = contentState.getEntity(linkKey);
            url = linkInstance.getData().url;
        }
        //  AtomicBlockUtils.insertAtomicBlock(
        //                             stateWithEntity,
        //                             entityKey,
        //                             ' '
        //                         )
        return (
            <span>
                <StyleButton
                    {...this.props}
                    active={
                        linkKey != null &&
                        contentState.getEntity(linkKey).getType() ===
                            this.props.type
                    }
                    onClick={() => {
                        if (linkKey || !selection.isCollapsed()) {
                            this.setState(() => ({
                                selectLink: !this.state.selectLink,
                            }));
                        }
                    }}
                />
                <Popover
                    show={this.state.selectLink}
                    onClickOutside={() => this.setState({ selectLink: false })}
                >
                    <LinkInput
                        url={url}
                        onValidate={value => {
                            let s = selection;
                            if (selection.isCollapsed()) {
                                s = maybeSelectConsecutiveEntity(
                                    this.props.editorState
                                );
                            }
                            const contentState = this.props.editorState.getCurrentContent();
                            const contentStateWithEntity = contentState.createEntity(
                                this.props.type,
                                'MUTABLE',
                                { url: value }
                            );
                            const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
                            const stateWithEntity = EditorState.set(
                                this.props.editorState,
                                {
                                    currentContent: Modifier.applyEntity(
                                        contentStateWithEntity,
                                        s,
                                        entityKey
                                    ),
                                }
                            );
                            this.props.onClick(
                                RichUtils.toggleLink(
                                    stateWithEntity,
                                    s,
                                    entityKey
                                )
                            );
                            this.setState(() => ({
                                selectLink: false,
                            }));
                        }}
                        onRemove={() => {
                            let s = selection;
                            if (selection.isCollapsed()) {
                                s = maybeSelectConsecutiveEntity(
                                    this.props.editorState
                                );
                            }
                            this.props.onClick(
                                RichUtils.toggleLink(
                                    this.props.editorState,
                                    s,
                                    null
                                )
                            );
                            this.setState(() => ({
                                selectLink: false,
                            }));
                        }}
                    />
                </Popover>
            </span>
        );
    }
}
