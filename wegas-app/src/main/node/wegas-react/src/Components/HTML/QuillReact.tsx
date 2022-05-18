import Quill, { EditorChangeHandler } from 'quill';
import React from 'react';
import { HTMLEditorPropsMk2 } from './HTMLEditorMk2';
import { wlog } from '../../Helper/wegaslog';
import "quill/dist/quill.snow.css";
// import { css } from '@emotion/css';
import './QuillStyle.css';
import { css } from '@emotion/css';
// import { themeVar } from '../Theme/ThemeVars';
import sanitize from '../../Helper/sanitize';

const myStyle = css({
    '.ql-container' : {fontFamily: 'Raleway'}, 
    '.ql-toolbar.ql-snow': {fontFamily: 'Raleway'}
});

// import { Modal } from '../Modal';
// import {FileBrowser} from '../../Editor/Components/FileBrowser/FileBrowser';
// import { fileURL, generateAbsolutePath } from '../../API/files.api';

// type CallbackFN = (url: string) => void;

interface CustomQuillItemOptions {
    id?: string;
    value?: string;
    icon?: string;
}

class QuillToolbarItem {

    protected options: CustomQuillItemOptions;
    protected qlFormatsEl : HTMLSpanElement; //TODO
    private toolbarEl : any = undefined;

    constructor(options: CustomQuillItemOptions) {
        this.options = options
        this.qlFormatsEl = document.createElement("span")
        this.qlFormatsEl.className = "ql-formats"
    }

    /**
     * Attaches this tool to the given Quill Editor instance.
     * @param {Quill} quill - The Quill Editor instance that this tool should get added to.
     */
    attach(quill: Quill) {
        
        const toolbar = quill.getModule('toolbar')
        this.toolbarEl = toolbar.container
        this.toolbarEl.appendChild(this.qlFormatsEl)
    }

    /**
     * Detaches this tool from the given Quill Editor instance.
     */
    detach() {
        this.toolbarEl.removeChild(this.qlFormatsEl)
    }

    /**
     * Generate a random ID.
     * @returns {string} random 10 digit ID
     */
    generateId() {
        return Math.random().toString().substr(2, 10)
    }
}

/* @class Class representing a button tool for a Quill Editor toolbar. */
class QuillToolbarButton extends QuillToolbarItem {

    private qlButton: HTMLButtonElement;
    private id: string;
    /**
     * Creates an instance of QuillToolbarButton.
     *
     * @constructor
     * @param {CustomQuillItemOptions} [options] - The options/settings for this QuillToolbarButton.
     * @param {string} [options.id=`button-${random10digitNumber}`] - The id of the quill tool.
     * @param {string} [options.value] - The default hidden value of the button.
     * @param {string} options.icon - The default icon this button tool will have.
     */
    constructor(options: CustomQuillItemOptions, onClick : (() => void)) {
        super(options)

        this.id = this.options.id || `button-${this.generateId()}`

        this.qlButton = document.createElement("button")
        this.qlButton.className = `ql-${this.id}`
        this.setValue(this.options.value || '')
        if(this.options.icon){
            this.setIcon(this.options.icon);
        }
        this.qlButton.onclick = onClick;
        this.qlFormatsEl.appendChild(this.qlButton)
    }
    /**
     * Set the icon for this button tool.
     *
     * @param {string} imageHtml - The <svg> or <img> html tag to use as an icon. (Make sure it's 18x18 in size.)
     */
    setIcon(imageHtml: string): void {
        this.qlButton.innerHTML = imageHtml
    }
    /**
     * Set the hidden value of this button tool.
     *
     * @param {string} newLabel - The <svg> or <img> html tag to use as an icon. (Make sure it's 18x18 in size.)
     */
    setValue(value :string):void {
        this.qlButton.value = value
    }
    /**
     * Set the hidden value of this button tool.
     *
     * @param {string} newLabel - The <svg> or <img> html tag to use as an icon. (Make sure it's 18x18 in size.)
     */
    getValue(): string {
        return this.qlButton.value
    }

}

export interface QuillEditorProps {
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

const toolbarOptions = [
    ['bold', 'italic', 'underline', { 'list': 'ordered' }, { 'list': 'bullet'}],
    [{ 'align': [] }],
    ['link'],
    ['image'],
    ['code-block'],
    [{ 'color': [] }, { 'background': [] }],

    [{ header: [false, 1, 2, 3, 4, 5, 6] }],
    // [{ size: [ 'small', false, 'large', 'huge' ]}],
]

function addToolbarButtonHandler(quill: Quill, target: string, handlerFunc: (quill: Quill) => void): void {
    const module = quill.getModule('toolbar');
    module.addHandler(target, () => handlerFunc(quill));
}

// function insertImage(quill: Quill, )){

// }

// function buildInsertImageFunc(quill: Quill, showFilePicker : ((f : (path: string ) => void) => void ) ,handler: (() => void)){
//     return 
// }

export default function QuillReact(props : QuillEditorProps){

    // wlog('Rendering QuillReact');

    const containerRef = React.useRef<HTMLDivElement>(null);
    const quill = React.useRef<Quill>();

    function updateProps(editor: Quill, props: HTMLEditorPropsMk2){

        editor.enable(!props.disabled);
        editor.root.dataset.placeholder = props.placeholder;
        if(props.value){
            if(editor.root.innerHTML != props.value){
                wlog('content set', props.value);

                const sel = editor.getSelection();
                editor.clipboard.dangerouslyPasteHTML(sanitize(props.value), 'api');
                if(sel){ // best effort to keep current selection
                    editor.setSelection(sel);
                }
            }
        }
    }

    React.useEffect(() => {
        if(quill.current){
            updateProps(quill.current, props);
        }
        else if(containerRef.current){
            wlog('creating quill editor');

            const fontAttributor = Quill.import('formats/font');
            const fonts = ['impact', 'courier', 'comic'];
            // const lHeights = ['1.0','1.1','1.2','1.3','1.4','1.5','1.6'];
            fontAttributor.whitelist = fonts;

            Quill.register(fontAttributor, true);
            const q = new Quill(containerRef.current, {
                modules: {
                    toolbar: toolbarOptions,
                },
                //placeholder: '',
                theme: 'snow',  // or 'bubble',
                debug: 'debug',
                readOnly : props.readonly,
            });

            q.setText(props.value || '', 'silent');

            // Handler to pick a media in WEGAS library
            addToolbarButtonHandler(q, 'image', (quill) => {
                wlog('Hey pick an image !!!!');
                const range = quill.getSelection();
                const cursorPos = range ? range.index : 0;
                // TODO build real WEGAS url
                if(props.showFilePickerFunc){
                    props.showFilePickerFunc((path) => {
                            wlog('got path back', path);
                            quill.insertEmbed(cursorPos, 'image', path, 'user');
                            // quill.insertEmbed(cursorPos, 'image', 'https://img-9gag-fun.9cache.com/photo/a3Q5VW5_700bwp.webp', 'user');
                        });
                }
            });

            //Handler to edit pure html
            addToolbarButtonHandler(q, 'code-block', (quill) => {
                
            });

            q.on('text-change', ((_delta, _old, source) => {
                if(props.onChange && source === 'user'){
                    // only trigger on user changes
                    wlog('text change : ', q.root.innerHTML, source);
                    //TODO transform img links
                    props.onChange(sanitize(q.root.innerHTML));
                }
            }));

            // TODO detect focus ?

            // wlog('creating custom button')
            // // Add a custom Button to the Quill Editor's toolbar:
            // customButton.current = new QuillToolbarButton({
            //     icon: `<svg viewBox="0 0 18 18"> <path class="ql-stroke" d="M5,3V9a4.012,4.012,0,0,0,4,4H9a4.012,4.012,0,0,0,4-4V3"></path></svg>`
            // },
            // () => wlog('Clicked here'))
            // customButton.current.attach(q)

            quill.current = q;

            updateProps(q, props);
            return (() => q.disable() /* TODO ok ?*/);
        }

    }, [props])

    return(
        <div className={myStyle}>
            <div ref={containerRef}></div>
        </div>
    )
}