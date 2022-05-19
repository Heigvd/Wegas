import React, {useState, useRef, useMemo} from 'react';
import JoditEditor, { Jodit } from "jodit";
import 'jodit/build/jodit.min.css';
import { wlog } from '../../Helper/wegaslog';
import { IEventEmitterOnOptions } from 'jodit/types/types/events';


export interface JoditEditorProps {
    /**
     * value - content to inject in the editor
     */
    value?: string;
    /**
     * When no content, this text is displayed in the editor
     */
    placeholder?: string;
    /**
    * the editor is disabled
    */
    disabled?: boolean;
    /**
     * read only mode
     */
    readonly?: boolean;
    /**
     * onChange - function called each time the content of the editor changes
     */
    onChange?: (content: string) => void;
    /**
     * Notifies the component to show the file picker
     * @param callback function to be called with full path to media
     */
    showFilePickerFunc?: (callback: (path: string) => void) => void;
}


export default function JoditReactEditor(props : JoditEditorProps) {

    const containerRef = React.useRef<HTMLTextAreaElement>(null);
    const jodit = React.useRef<JoditEditor.Jodit>();

    function updateProps(editor :JoditEditor.Jodit, props: JoditEditorProps){
        if(editor.value !== props.value){
            editor.value = props.value || '';
        }
    }

    const o :IEventEmitterOnOptions = {};
    
    React.useEffect(()=> {
        if(jodit.current){
          updateProps(jodit.current, props);  
        }
        else if(containerRef.current){
            const config = Jodit.defaultOptions;
            // config.
            const j = Jodit.make(containerRef.current, config);
            j.events.on('change', (value, oldValue) => {
                wlog('youhou ' + value);
                if(props.onChange){
                    props.onChange(value);
                }
            }, )
            jodit.current = j;
            updateProps(j, props);
        }
    }, [props]);

    return (
        <div>
            <textarea ref={containerRef}>
            </textarea>
        </div>
    );
}