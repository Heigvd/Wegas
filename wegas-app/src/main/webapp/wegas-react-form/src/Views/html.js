import { Editor } from '@tinymce/tinymce-react/lib/es2015';
import { css } from 'glamor';
import { debounce } from 'lodash-es';
import PropTypes from 'prop-types';
import React from 'react';
import commonView from '../HOC/commonView';
import labeled from '../HOC/labeled';
import './../../../wegas-editor/js/plugin/wegas-tinymce-dynamictoolbar';
import { getY } from './../index';

const { Wegas } = getY();
const tinymceStyle = css({
    '& .mce-tinymce': {
        boxShadow: 'none',
        boxSizing: 'border-box',
    },
    // Fix horizontal resize...
    '& .mce-container > iframe': { width: '100% !important' },
});
function onFileBrowserClick(fieldName, url, type, win) {
    const filePanel = new Wegas.FileSelect();

    filePanel.after('*:fileSelected', (e, path) => {
        e.stopImmediatePropagation();
        e.preventDefault();

        const window = filePanel.win;
        const targetInput = window.document.getElementById(
            filePanel.field_name
        );
        targetInput.value = Wegas.Facade.File.getPath() + path; // update the input field

        if (typeof window.ImageDialog !== 'undefined') {
            // are we an image browser
            if (window.ImageDialog.getImageData) {
                // we are, so update image dimensions...
                window.ImageDialog.getImageData();
            }

            if (window.ImageDialog.showPreviewImage) {
                // ... and preview if necessary
                window.ImageDialog.showPreviewImage(
                    Wegas.Facade.File.getPath() + path
                );
            }
        }
        if (window.Media) {
            // If in an editor window
            window.Media.formToData('src'); // update the data
        }
        filePanel.destroy();
    });
    filePanel.win = win;
    filePanel.field_name = fieldName;
    return false;
}

const TINY_CONFIG = {
    inline: false,
    browser_spellcheck: true,
    plugins: [
        'autolink link image lists code media table',
        'paste advlist textcolor dynamic_toolbar',
        // textcolor wordcount autosave contextmenu
        // advlist charmap print preview hr anchor pagebreak spellchecker
        // directionality
    ],
    toolbar1: 'bold italic bullist | link image media code addToolbarButton',
    toolbar2: `forecolor backcolor underline
             alignleft aligncenter alignright alignjustify table`,
    toolbar3: 'fontsizeselect styleselect',
    // formatselect removeformat underline unlink forecolor backcolor anchor previewfontselect
    // fontsizeselect styleselect spellchecker template
    // contextmenu: 'link image inserttable | cell row
    // column deletetable | formatselect forecolor',
    menubar: false,
    resize: 'both',
    max_height: 500,
    statusbar: true,
    branding: false,
    relative_urls: false,
    toolbar_items_size: 'small',
    hidden_tootlbar: [2, 3],
    file_browser_callback: onFileBrowserClick,
    image_advtab: true,
    content_css: [
        '//maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css',
        `${Wegas.app.get('base')}wegas-editor/css/wegas-tinymce-editor.css`,
    ],
    style_formats: [
        {
            // Style formats
            title: 'Title 1',
            block: 'h1',
        },
        {
            title: 'Title 2',
            block: 'h2',
            // styles : {
            //    color : '#ff0000'
            // }
        },
        {
            title: 'Title 3',
            block: 'h3',
        },
        {
            title: 'Normal',
            inline: 'span',
        },
        {
            title: 'Code',
            // icon: 'code',
            block: 'code',
        },
    ],
    // setup: function setup(editor) {
    //     let tbs;
    //     editor.on('init', () => {
    //         tbs = editor.contentAreaContainer.parentElement
    //             .querySelectorAll('div.mce-toolbar-grp');
    //         tbs.forEach(e => { e.style.maxHeight = 0; e.style.overflow = 'hidden'; });
    //     });
    //     editor.on('focus', () => tbs.forEach(e => { e.style.maxHeight = '90px'; }));
    //     editor.on('blur', () => tbs.forEach(e => { e.style.maxHeight = 0; }));
    // }
};
/**
 * Replace data-file attribute with complete href and src
 * @param {string} content
 */
function toTinyMCE(content) {
    let updated = content;
    if (updated === null || typeof content !== 'string') {
        updated = undefined;
    }
    if (updated && Wegas.Facade.File) {
        updated = updated.replace(
            new RegExp('data-file="([^"]*)"', 'gi'),
            `src="${Wegas.Facade.File.getPath()}$1"
             href="${Wegas.Facade.File.getPath()}$1"`
        ); // @hack Place both href and src so it
        // will work for both <a> and <img>
        // elements
    }
    return updated;
}
/**
 * Replace href/src with injector style data-file attribute
 * @param {string} content
 */
function toInjectorStyle(content) {
    // remove yui ids
    const root = document.createElement('div');
    root.innerHTML = content;
    const yuiId = root.querySelectorAll('[id^="yui_"]');
    for (let n = 0; n < yuiId.length; n += 1) {
        yuiId[n].removeAttribute('id');
    }

    return root.innerHTML
        .replace(
            new RegExp(
                '((src|href)="[^"]*/rest/File/GameModelId/[^"]*/read([^"]*)")',
                'gi'
            ),
            'data-file="$3"'
        ) // Replace absolute path with injector style path (old version)
        .replace(
            new RegExp(
                '((src|href)="[^"]*/rest/GameModel/[^"]*/File/read([^"]*)")',
                'gi'
            ),
            'data-file="$3"'
        ); // Replace absolute path with injector style path
}
class HTMLView extends React.Component {
    static getDerivedStateFromProps(nextProps, state) {
        if (state.oldProps === nextProps) {
            return null;
        }
        if (nextProps.value !== state.sent) {
            return {
                sent: nextProps.value,
                content: toTinyMCE(nextProps.value) || '',
            };
        }
        return null;
    }
    constructor(props) {
        super(props);
        this.state = {
            // eslint-disable-next-line
            oldProps: props,
            sent: props.value,
            content: props.value,
        };
        this.onChangeHandler = debounce(this.onChangeHandler.bind(this), 200);
    }
    componentWillUnmount() {
        this.onChangeHandler.flush();
    }
    onChangeHandler(content) {
        const oldContent = this.state.sent;
        const newContent = toInjectorStyle(content);
        if (oldContent !== newContent) {
            this.setState({ content, sent: newContent }, () => {
                this.props.onChange(newContent);
            });
        }
    }

    render() {
        return (
            <div {...tinymceStyle}>
                <Editor
                    value={this.state.content}
                    init={TINY_CONFIG}
                    onEditorChange={this.onChangeHandler}
                />
            </div>
        );
    }
}
HTMLView.propTypes = {
    onChange: PropTypes.func.isRequired,
    value: PropTypes.string,
};

export default commonView(labeled(HTMLView));
