import React from 'react';
import JoditEditor, { Jodit } from "jodit";
import 'jodit/build/jodit.min.css';
import { wlog } from '../../Helper/wegaslog';
import sanitize from '../../Helper/sanitize';
import { ButtonsGroups } from 'jodit/types/types';
import { css } from '@emotion/css';


export interface JoditEditorProps {

    /**
     * Timeout of Jodit. Defaults to 0
     */
    innerEditorTimeout?: number;
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
    /**
     * Custom toolbar
     * example  : 'bold italic underline | source'
     */
    customToolbar?: string;
}

/**
 * @param value value to clean
 * @returns a sanitized string stripped of \n
 */
function cleanValue(value: string | undefined): string {
    const v = value || '';
    return sanitize(v.replace(/\n/g, ''))
}

const wysiwygStyle = css({backgroundColor: 'white'});

const IMG_PLACEHOLDER = 'IMG_PLACEHOLDER';
const buttonDefaultConfig: ButtonsGroups = [
    'italic', 'bold', 'underline', '|',
     'ul', 'ol', '|',
    'left', 'center', 'right', 'justify', '|',
    'link', IMG_PLACEHOLDER, '|',
    'source','table','|',
    'paragraph', 'fontsize','brush', 
    'classSpan'//'font'
];

export default function JoditReactEditor(props : JoditEditorProps) {

    const containerRef = React.useRef<HTMLTextAreaElement>(null);
    const jodit = React.useRef<JoditEditor.Jodit>();
    const muteChanges = React.useRef<boolean>(false);

    function updateProps(editor :JoditEditor.Jodit, props: JoditEditorProps){
        const local = cleanValue(editor.value);
        const updated = cleanValue(props.value);
        if(local !== updated){
            // wlog('RECEIVED', updated);
            // wlog('CURRENT', local);
            // hack : avoid triggering a change callback when setting the new value
            muteChanges.current = true;
            editor.setEditorValue(updated);
            muteChanges.current = false;
        }
        editor.setReadOnly(props.readonly || false);
        editor.setDisabled(props.disabled || false);

    }

    // Editor setup or update
    React.useEffect(()=> {
        if(jodit.current){
          updateProps(jodit.current, props);  
        }
        else if(containerRef.current){

            let buttonsConfig :ButtonsGroups;
            if(props.customToolbar){
                buttonsConfig = props.customToolbar.trim().split(/\s+/);
            }else{
                buttonsConfig = buttonDefaultConfig;
            }
            // const buttonsConfig = props.customToolbar ? (props.customToolbar : buttonDefaultConfig;
            const idx = buttonsConfig.findIndex((e) => e === IMG_PLACEHOLDER);
            //custom button for WEGAS images
            if(idx > -1){
                buttonsConfig[idx] = {
                    icon: 'image',
                    exec: function (editor: JoditEditor.Jodit) {
                        if(props.showFilePickerFunc){
                            props.showFilePickerFunc((path) => 
                            {
                                editor.selection.insertImage(path);
                            })
                        }
                    }
                }
            }

            const config = Jodit.defaultOptions;
            config.defaultTimeout = props.innerEditorTimeout || 0;

            config.buttons = buttonsConfig;
            config.buttonsMD = buttonsConfig;
            config.buttonsSM = buttonsConfig;
            config.buttonsXS = buttonsConfig;

            wlog(config.controls.classSpan);

            config.controls.classSpan.list = {x : 'xx', y : 'yy'};//['myStyle', 'yourStyle'];

            config.statusbar = false;
            //Missing typings for placeholder...
            (config as any).placeholder = props.placeholder;

            // config.controls.font.list = Jodit.atom({
			// 	'Tahoma,Geneva,sans-serif': 'Tahoma',
			// 	'Roboto Medium,Arial,sans-serif': 'Roboto',
			// });

            const j = Jodit.make(containerRef.current, config);

            j.events.on('change', (value, oldValue) => {
                const prev = cleanValue(oldValue);
                const v = cleanValue(value);
                if(!muteChanges.current && props.onChange && v !== prev){
                    props.onChange(v);
                }
            });

            // j.events.on('input', (value, oldValue) => { }, )
            jodit.current = j;
            updateProps(j, props);
        }
    }, [props]);

    return (
        <div className={wysiwygStyle}>
            <textarea ref={containerRef}></textarea>
        </div>
    );
}