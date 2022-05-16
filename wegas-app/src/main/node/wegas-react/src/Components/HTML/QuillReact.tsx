import React from 'react';
import Quill from 'quill';
import { HTMLEditorPropsMk2 } from './HTMLEditorMk2';
import { wlog } from '../../Helper/wegaslog';
import "quill/dist/quill.snow.css";


interface CustomQuillitemOptions {
    id?: string;
    value?: string;
    icon?: string;
}

class QuillToolbarItem {

    protected options: CustomQuillitemOptions;
    protected qlFormatsEl : any; //TODO
    private toolbarEl : any;

    constructor(options: CustomQuillitemOptions) {
        this.options = options
        this.qlFormatsEl = document.createElement("span")
        this.qlFormatsEl.className = "ql-formats"
    }

    /**
     * Attaches this tool to the given Quill Editor instance.
     * @param {Quill} quill - The Quill Editor instance that this tool should get added to.
     */
    attach(quill: Quill) {
        
        // this.quill = quill
        const toolbar = quill.getModule('toolbar')
        this.toolbarEl = toolbar.container
        this.toolbarEl.appendChild(this.qlFormatsEl)
    }

    /**
     * Detaches this tool from the given Quill Editor instance.
     */
    detach() {
        this.toolbarEl.removeChild(this.qlFormatsEl)
        // this.quill = undefined; //TODO
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
     * @param {object} [options] - The options/settings for this QuillToolbarButton.
     * @param {string} [options.id=`button-${random10digitNumber}`] - The id of the quill tool.
     * @param {string} [options.value] - The default hidden value of the button.
     * @param {string} options.icon - The default icon this button tool will have.
     */
    constructor(options: CustomQuillitemOptions, onClick : (() => void)) {
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


export default function QuillReact(props : HTMLEditorPropsMk2){

    wlog('Rendering QuillReact');

    const containerRef = React.useRef<HTMLDivElement>(null);
    const quill = React.useRef<Quill>();
    const customButton = React.useRef<QuillToolbarButton>();

    function updateProps(editor: Quill, props: HTMLEditorPropsMk2){

        editor.enable(!props.disabled);
        editor.root.dataset.placeholder = props.placeholder;
        if(props.value){
            editor.setText(props.value)
        }
        //TODO value update ?
    }

    React.useEffect(() => {
        if(quill.current){
            wlog('updating quill editor')
            updateProps(quill.current, props);
            //TODO update
        }
        else if(containerRef.current){
            wlog('creating quill editor');

            const q = new Quill(containerRef.current, {
                // modules: {
                //     toolbar: [
                //         [{ header: [1, 2, false] }, {}],
                //         ['bold', 'italic', 'underline'],
                //         ['image', 'code-block'],
                //     ],
        
                // },
                //placeholder: 'Compose an epic...',
                theme: 'snow',  // or 'bubble',
                
            });

            q.setText(props.value || '');
            // editor.off('text-change'); TODO remove previous handler ?
            q.on('text-change', ((delta) => {
                if(props.onChange){
                    wlog('text change : ' + q.getText());
                    //props.onChange(q.getText());
                }
            }));

            wlog('creating custom button')
            // Add a custom Button to the Quill Editor's toolbar:
            customButton.current = new QuillToolbarButton({
                icon: `<svg viewBox="0 0 18 18"> <path class="ql-stroke" d="M5,3V9a4.012,4.012,0,0,0,4,4H9a4.012,4.012,0,0,0,4-4V3"></path></svg>`
            }, 
            () => wlog('Clicked here'))
        
            customButton.current.attach(q)
            quill.current = q;

            updateProps(q, props);
            return (() => q.disable() /* TODO ok ?*/);
        }

    }, [props]) // TODO

    return(
        <div>
            <div ref={containerRef}></div>
        </div>
    )
}