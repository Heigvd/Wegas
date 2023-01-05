import { Editor } from '@tinymce/tinymce-react';
import { css } from '@emotion/css';
// import { debounce } from 'lodash-es';
import PropTypes from 'prop-types';
import React from 'react';
import commonView from '../HOC/commonView';
import labeled from '../HOC/labeled';
import { getY } from '../index';
import FormStyles from './form-styles';

const { Wegas } = getY();

const tinymceStyle = css({
    '& .mce-tinymce': {
        // boxShadow: 'none',
        boxSizing: 'border-box',
    },
    '& .mce-content-body': {
        border: '1px solid #BFBFBF',
        padding: '4px',
    },
    '& .mce-content-body.mce-edit-focus': {
        outline: 'medium auto #6AACF1',
    },
    // Fix horizontal resize...
    // '& .mce-container > iframe': {width: '100% !important'}
    // '& > .tinymce-toolbar > div': {display: 'block !important'}
});

tinymce.PluginManager.add('dynamic_toolbar', function (editor) {
    let first = true;
    function showHideToolbar() {
        const toolbar = editor.theme.panel.find('toolbar');
        let resizeY = 0;
        let fullHeight = 26;
        if (first) {
            this.active(false);
            first = false;
        } else {
            this.active(!this.active());
        }
        const state = this.active();
        let i;
        let barToHide = editor.settings.hidden_tootlbar;

        if (!barToHide) {
            barToHide = [2];
        }
        if (state) {
            for (i = 0; i < barToHide.length; i += 1) {
                toolbar[barToHide[i] - 1].show();
                resizeY += 26;
                fullHeight += 26;
            }
        } else {
            for (i = 0; i < barToHide.length; i += 1) {
                toolbar[barToHide[i] - 1].hide();
                resizeY -= 26;
            }
        }
        if (editor.settings.inline) {
            if (editor.theme.panel.resizeBy) {
                editor.theme.panel.resizeBy(0, resizeY);
                editor.theme.panel.moveBy(0, -resizeY);
            } else {
                editor.theme.panel.getEl().style.height = `${fullHeight  }px`;
                editor.theme.panel.getEl().firstChild.style.height = `${fullHeight  }px`;
            }
        }
    }

    editor.addButton('addToolbarButton', {
        icon: ' fa fa-angle-double-down',
        title: 'More options',
        onclick: showHideToolbar,
        onPostRender: showHideToolbar,
    });
});

function onFileBrowserClick(fieldName, url, type, win) {
    const filePanel = new Wegas.FileSelect();

    filePanel.after('*:fileSelected', (e, path) => {
        e.stopImmediatePropagation();
        e.preventDefault();

        const window = filePanel.win;
        const targetInput = window.document.getElementById(filePanel.field_name);
        targetInput.value = Wegas.Facade.File.getPath() + path; // update the input field

        if (typeof window.ImageDialog !== 'undefined') {
            // are we an image browser
            if (window.ImageDialog.getImageData) {
                // we are, so update image dimensions...
                window.ImageDialog.getImageData();
            }

            if (window.ImageDialog.showPreviewImage) {
                // ... and preview if necessary
                window.ImageDialog.showPreviewImage(Wegas.Facade.File.getPath() + path);
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
function getTinyConfig(fixedToolbar) {
    const config = {
        inline: true,
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
        fixed_toolbar_container: fixedToolbar,
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
        formats: {},
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
        //entity_encoding: 'raw'
    };

    const extraButtons = Wegas.Config.TinyExtraButtons;

    if (extraButtons) {
        /* config example :
         Y.namespace("Wegas.Config").TinyExtraButtons = {
         
         className : "off-game",
         cssIcon: "fa fa-asterisk",
         tooltip : "off-game information style"
         },
         danger: {
         block: "div",
         className : "danger-message",
         cssIcon: "fa fa-warning",
         tooltip : "danger message style"
         }
         };
         */
        const toolbar = config.toolbar1.split(' ');
        toolbar.pop(); // remove addToolbarButton
        toolbar.push('|');

        const initFunctions = [];
        Object.keys(extraButtons).forEach(name => {
            const btnCfg = extraButtons[name];
            config.formats[name] = {
                attributes: {
                    class: btnCfg.className,
                },
            };

            if (btnCfg.block) {
                config.formats[name].block = btnCfg.block;
            } else if (btnCfg.inline) {
                config.formats[name].inline = btnCfg.inline;
            } else {
                config.formats[name].inline = 'span';
            }

            toolbar.push(name);

            initFunctions.push({
                name: name,
                config: btnCfg,
                function: function init(editor, btnName, btnTinyCfg) {
                    editor.addButton(btnName, {
                        icon: `x ${btnTinyCfg.cssIcon}`,
                        stateSelector: `.${btnTinyCfg.className}`,
                        tooltip: btnTinyCfg.tooltip,
                        onclick: function onClick() {
                            tinymce.activeEditor.formatter.toggle(btnName);
                            tinymce.activeEditor.fire('change');
                        },
                    });
                },
            });
            // on setup, call each initFunction
            config.setup = function setup(editor) {
                Object.values(initFunctions).forEach(fn => {
                    fn.function.call(editor, editor, fn.name, fn.config);
                });
            };
        });

        // rebuilf toolbar1
        toolbar.push('|');
        toolbar.push('addToolbarButton');
        config.toolbar1 = toolbar.join(' ');
    }

    return config;
}
/**
 * Replace data-file attribute with complete href and src
 * @param {string} content
 */
function toTinyMCE(content) {
    let updated = Wegas.App.sanitize(content);
    if (updated === null || typeof content !== 'string') {
        updated = undefined;
    }
    if (updated && Wegas.Facade.File) {
        updated = updated.replace(
            new RegExp('data-file="([^"]*)"', 'gi'),
            `src="${Wegas.Facade.File.getPath()}$1"
             href="${Wegas.Facade.File.getPath()}$1"`,
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

    return Wegas.App.sanitize(
        root.innerHTML
            .replace(
                new RegExp('((src|href)="[^"]*/rest/File/GameModelId/[^"]*/read([^"]*)")', 'gi'),
                'data-file="$3"',
            ) // Replace absolute path with injector style path (old version)
            .replace(
                new RegExp('((src|href)="[^"]*/rest/GameModel/[^"]*/File/read([^"]*)")', 'gi'),
                'data-file="$3"',
            ), // Replace absolute path with injector style path
    );
}

let id = 0;
function toolbarIdGenerator() {
    const gid = ++id;
    return `generated-tinymce-toolbar-id--${  gid}`;
}

function tinySanitze(value) {
    return new tinymce.html.Serializer().serialize(new tinymce.html.DomParser().parse(value));
}

class HTMLView extends React.Component {
    static getDerivedStateFromProps(nextProps, state) {
        if (state.oldProps === nextProps) {
            return null;
        }
        const nextSent = toInjectorStyle(nextProps.value);
        if (nextSent !== state.sent) {
            return {
                oldProps: nextProps,
                sent: nextSent,
                previousTinyValue: null,
                content: toTinyMCE(nextProps.value) || '',
            };
        }
        return { oldProps: nextProps };
    }

    constructor(props) {
        super(props);
        this.id = toolbarIdGenerator();
        this.state = {
            // eslint-disable-next-line
            oldProps: props,
            sent: toInjectorStyle(props.value),
            previousTinyValue: null,
            content: toTinyMCE(props.value) || '',
        };
        //this.onChangeHandler = debounce(this.onChangeHandler.bind(this), 200);
    }

    //    componentWillUnmount() {
    //        this.onChangeHandler.flush();
    //    }

    onChangeHandler = content => {
        if (this.state.previousTinyValue !== null && this.state.previousTinyValue === content) {
            // new value (internal tiny format) equals previous one,
            // Don't do anything
            return;
        }
        if (this.state.previousTinyValue === null) {
            // first change is fired right after first mount
            // null previousTinyValue allows to identify such a first call
            // in this case, no need to fire props.onChange
            // but keep track of the previousTinyValue (tiny may change internal HTML event if user did
            // nothing)
            this.state.previousTinyValue = content;
            return;
        }
        // keep track of internal tiny value
        this.state.previousTinyValue = content;

        const oldContent = this.state.sent;
        // convert new content to wegas injector format
        const newContent = toInjectorStyle(content);

        // and compare to value which has already been sent
        if (oldContent !== newContent) {
            this.setState({ content, sent: newContent }, () => {
                this.props.onChange(newContent);
            });
        }
    };

    render() {
        if (this.props.view.readOnly) {
            return (
                <div
                    className={FormStyles.disabled.toString()}
                    dangerouslySetInnerHTML={{
                        __html: this.state.content,
                    }}
                />
            );
        } else {
            return (
                <div {...tinymceStyle}>
                    <div id={this.id} className="tinymce-toolbar"></div>
                    <Editor
                        value={this.state.content}
                        init={getTinyConfig(`#${  this.id}`)}
                        onEditorChange={this.onChangeHandler}
                    />
                </div>
            );
        }
    }
}
HTMLView.propTypes = {
    onChange: PropTypes.func.isRequired,
    value: PropTypes.string,
};

export default commonView(labeled(HTMLView));
