import React from 'react';
import JoditEditor, { Jodit } from "jodit";
import 'jodit/build/jodit.min.css';
import sanitize, { toFullUrl, toInjectorStyle } from '../../Helper/sanitize';
import { ButtonsGroups } from 'jodit/types/types';
import { css } from '@emotion/css';
import { classesCTX } from '../Contexts/ClassesProvider';


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
     * Notifies the parent component to show the file picker
     * @param callback function to be called with path to media
     */
    showFilePickerFunc?: (callback: (path: string) => void) => void;
    /**
     * full => with link and image insertion and html raw edition
     * player => w/o the above
     */
    toolbarLayout?: "full" | "player";
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
const buttonFullConfig: ButtonsGroups = [
    'italic', 'bold', 'underline', '|',
     'ul', 'ol', '|',
    'left', 'center', 'right', 'justify', '|',
    'link', IMG_PLACEHOLDER, '|',
    'source','table','|',
    'paragraph', 'fontsize','brush', 
    'classSpan'//'font'
];

// without image and link buttons
const buttonPlayerConfig: ButtonsGroups = [
    'italic', 'bold', 'underline', '|',
     'ul', 'ol', '|',
    'left', 'center', 'right', 'justify', '|',
    'table','|',
    'paragraph', 'fontsize','brush', 
];

const disabledPlugins = ['add-new-line', 'drag-and-drop', 'drag-and-drop-element', 'iframe', 'video', 'print', 'media', 'powered-by-jodit'];

export default function JoditReactEditor(props : JoditEditorProps) {

    const containerRef = React.useRef<HTMLTextAreaElement>(null);
    const jodit = React.useRef<JoditEditor.Jodit>();
    const muteChanges = React.useRef<boolean>(false);
    const { classes } = React.useContext(classesCTX);

    function updateProps(editor :JoditEditor.Jodit, props: JoditEditorProps){
        const local = cleanValue(editor.value);
        const updated = cleanValue(toFullUrl(props.value));
        if(local !== updated){
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

            let buttonsConfig: ButtonsGroups;

            switch(props.toolbarLayout){
                case 'full':
                    buttonsConfig = buttonFullConfig;
                    break;
                case 'player':
                    buttonsConfig = buttonPlayerConfig;
                    break;
                default:
                    buttonsConfig = buttonPlayerConfig;

            }
            
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
            //required to avoid triggering change events when the value is updated from outside
            config.defaultTimeout = 0;

            config.buttons = buttonsConfig;
            config.buttonsMD = buttonsConfig;
            config.buttonsSM = buttonsConfig;
            config.buttonsXS = buttonsConfig;

            config.disablePlugins = disabledPlugins;

            if(Object.keys(classes).length){
                config.controls.classSpan.list = classes;
            }else{
                config.removeButtons = ['classSpan'];
            }

            config.statusbar = false;

            //Missing typings for placeholder...
            (config as unknown as {placeholder: string}).placeholder = props.placeholder || '';

            const j = Jodit.make(containerRef.current, config);

            j.events.on('change', (value, oldValue) => {
                const prev = cleanValue(oldValue);
                const v = cleanValue(value);
                if(!muteChanges.current && props.onChange && v !== prev){
                    const injected =toInjectorStyle(v);
                    props.onChange(injected);
                }
            });

            // triggered on keyboard input
            // j.events.on('input', (value, oldValue) => { }, )
            jodit.current = j;
            updateProps(j, props);
        }
    }, [props, classes]);

    return (
        <div className={wysiwygStyle}>
            <textarea ref={containerRef}></textarea>
        </div>
    );
}