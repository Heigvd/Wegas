import * as React from 'react';
import {
    ContentState,
    ContentBlock,
    EditorState,
    Modifier,
    RichUtils,
    AtomicBlockUtils,
} from 'draft-js';

import { StyleButtonProps, StyleButton } from './StyleButton';
import Popover from '../../Components/Popover';

function findImageEntities(
    contentBlock: ContentBlock,
    callback: (start: number, end: number) => void,
    contentState: ContentState
) {
    contentBlock.findEntityRanges(character => {
        const entityKey = character.getEntity();
        return (
            entityKey !== null &&
            contentState.getEntity(entityKey).getType() === 'IMAGE'
        );
    }, callback);
}
export function Img({ url }: { url: string }) {
    return <img src={url} />;
}
const ImageEntity = (props: {
    contentState: ContentState;
    children?: React.ReactChildren;
    entityKey: string;
}) => {
    const { url } = props.contentState.getEntity(props.entityKey).getData();

    return Img({ url });
};
export const imageDecorator = {
    strategy: findImageEntities,
    component: ImageEntity,
};
export function MediaBlockRenderer(props: {
    contentState: ContentState;
    block: ContentBlock;
}) {
    const entity = props.contentState.getEntity(props.block.getEntityAt(0));
    const type = entity.getType();
    const data = entity.getData();
    if (type === 'IMAGE') {
        return <Img {...data} />;
    }
    return null;
}
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
                <button onClick={onRemove}>Remove</button>
            </div>
        );
    }
    return link({ url, onValidate, onRemove });
}
export class MediaButton extends React.Component<
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
                        if (linkKey || selection.isCollapsed()) {
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
                            const contentState = this.props.editorState.getCurrentContent();
                            const contentStateWithEntity = contentState.createEntity(
                                this.props.type,
                                'IMMUTABLE',
                                { url: value }
                            );
                            const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
                            const stateWithEntity = EditorState.set(
                                this.props.editorState,
                                {
                                    currentContent: Modifier.applyEntity(
                                        contentStateWithEntity,
                                        selection,
                                        entityKey
                                    ),
                                }
                            );
                            this.props.onClick(
                                AtomicBlockUtils.insertAtomicBlock(
                                    stateWithEntity,
                                    entityKey,
                                    ' '
                                )
                            );
                            this.setState(() => ({
                                selectLink: false,
                            }));
                        }}
                        onRemove={() => {
                            this.props.onClick(
                                RichUtils.toggleLink(
                                    this.props.editorState,
                                    selection,
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
