import React from 'react';
import Quill from 'quill';
import { HTMLEditorPropsMk2 } from './HTMLEditorMk2';
import { wlog } from '../../Helper/wegaslog';
// import "quill/dist/quill.core.css";
// import "quill/dist/quill.bubble.css";
import "quill/dist/quill.snow.css";


export default function QuillReact(props : HTMLEditorPropsMk2){

    wlog(props.value);

    const containerRef = React.useRef<HTMLDivElement>(null);
    const quill = React.useRef<Quill>();

    function updateProps(editor: Quill, props: HTMLEditorPropsMk2){

        editor.setText(props.value || '');
        // editor.off('text-change'); TODO remove previous handler ?
        editor.on('text-change', ((delta) => {
            if(props.onChange){
                wlog('text change : ' + editor.getText());
                props.onChange(editor.getText());
            }
        }));
        editor.enable(!props.disabled);
        editor.root.dataset.placeholder = props.placeholder;

    }
            // Add a custom Button to the Quill Editor's toolbar:
    // const myButton = new QuillToolbarButton({
    //     icon: `<svg viewBox="0 0 18 18"> <path class="ql-stroke" d="M5,3V9a4.012,4.012,0,0,0,4,4H9a4.012,4.012,0,0,0,4-4V3"></path></svg>`
    //     })
       
    //     myButton.onClick = function(quill) {
    //         const { index, length } = quill.selection.savedRange
    //         const selectedText = quill.getText(index, length)
    //         const newText = selectedText.toUpperCase()
    //         quill.deleteText(index, length)
    //         quill.insertText(index, newText)
    //         quill.setSelection(index, newText.length)
    //     }
    //     myButton.attach(quill)

    // }

    React.useEffect(() => {
        wlog('creating quill editor');
        if(quill.current){
            updateProps(quill.current, props);
            //TODO update
        }
        else if(containerRef.current){
            const q = new Quill(containerRef.current, {
                modules: {
                    toolbar: [
                        [{ header: [1, 2, false] }, {}],
                        ['bold', 'italic', 'underline'],
                        ['image', 'code-block'],
                    ],
        
                },
                placeholder: 'Compose an epic...',
                theme: 'snow',  // or 'bubble',
                
            });
            updateProps(q, props);
            quill.current = q;
            return (() => q.disable() /* TODO ok ?*/);
        }

    }, [props]) // TODO

    return(
        <div>
            <div ref={containerRef}></div>
        </div>
    )
}