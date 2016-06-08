import React from 'react';
import TinyMCE from 'react-tinymce';
import './../../../wegas-editor/js/plugin/wegas-tinymce-dynamictoolbar.js';
import { getY } from './../index.js';

const Wegas = getY().Wegas;

function onFileBrowserClick(fieldName, url, type, win) {
    const filePanel = new Wegas.FileSelect();

    filePanel.after('*:fileSelected', (e, path) => {
        e.stopImmediatePropagation();
        e.preventDefault();

        const window = filePanel.win;
        const targetInput = window.document.getElementById(filePanel.field_name);
        targetInput.value = Wegas.Facade.File.getPath() + path; // update the input field

        if (typeof (window.ImageDialog) !== 'undefined') { // are we an image browser
            if (window.ImageDialog.getImageData) { // we are, so update image dimensions...
                window.ImageDialog.getImageData();
            }

            if (window.ImageDialog.showPreviewImage) { // ... and preview if necessary
                window.ImageDialog.showPreviewImage(Wegas.Facade.File.getPath() + path);
            }
        }
        if (window.Media) { // If in an editor window
            window.Media.formToData('src'); // update the data
        }
        filePanel.destroy();
    });
    filePanel.win = win;
    filePanel.field_name = fieldName;
    return false;
}

const TINYCONFIG = {
    plugins: [
        'autolink link image lists code media table contextmenu',
        'paste advlist textcolor dynamic_toolbar'
        // textcolor wordcount autosave
        // advlist charmap print preview hr anchor pagebreak spellchecker
        // directionality
    ],
    toolbar1: 'bold italic bullist | link image media code addToolbarButton',
    toolbar2: `forecolor backcolor underline
             alignleft aligncenter alignright alignjustify table`,
    toolbar3: 'fontselect fontsizeselect styleselect',
    // formatselect removeformat underline unlink forecolor backcolor anchor previewfontselect
    // fontsizeselect styleselect spellchecker template
    // contextmenu: 'link image inserttable | cell row
    // column deletetable | formatselect forecolor',
    menubar: false,
    statusbar: false,
    relative_urls: false,
    toolbar_items_size: 'small',
    hidden_tootlbar: [2, 3],
    file_browser_callback: onFileBrowserClick,
    resize: true,
    image_advtab: true,
    autoresize_min_height: 35,
    autoresize_max_height: 500,
    content_css: [
        `${Wegas.app.get('base')}wegas-editor/css/wegas-inputex-rte.css`
    ],
    style_formats: [
        { // Style formats
            title: 'Title 1',
            block: 'h1'
        }, {
            title: 'Title 2',
            block: 'h2'
            // styles : {
            //    color : '#ff0000'
            // }
        }, {
            title: 'Title 3',
            block: 'h3'
        }, {
            title: 'Normal',
            inline: 'span'
        }, {
            title: 'Code',
            // icon: 'code',
            block: 'code'
        }]
};
function HTMLView(props) {
    const { onChange } = props;
    const onValueChange = event => onChange(event.target.getContent());
    return (
        <div>
            <label>
                {props.view.label}
            </label>
            <TinyMCE
                content={props.value}
                config={TINYCONFIG}
                onChange={onValueChange}
            />
        </div>
    );
}


export default HTMLView;
