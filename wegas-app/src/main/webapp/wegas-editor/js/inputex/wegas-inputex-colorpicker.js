/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
YUI.add("wegas-inputex-colorpicker", function(Y) {

    var inputEx = Y.inputEx;

    Y.namespace("inputEx.Wegas").ColorField = function(options) {
        inputEx.Wegas.ColorField.superclass.constructor.call(this, options);
    };
    Y.extend(inputEx.Wegas.ColorField, inputEx.Field, {
        setOptions: function(options) {
            inputEx.Wegas.ColorField.superclass.setOptions.call(this, options);

            // Overwrite options
            this.options.className = options.className ? options.className : 'inputEx-Field inputEx-ColorField inputEx-PickerField';
            this.options.zIndex = options.zIndex || 4;
        },
        renderComponent: function() {
            this.el = inputEx.cn('input', {
                name: this.options.name || '',
                value: this.options.value || '#FFFFFF',
                size: 9
            });

            // This element wraps the input node in a float: none div
            this.wrapEl = inputEx.cn('div', {className: 'inputEx-PickerField-wrapper'});
            this.wrapEl.appendChild(this.el);

            // Create button
            this.button = Y.Node.create("<button>&nbsp;</button>").addClass("inputEx-ColorField-button");
            this.button.appendTo(this.wrapEl);

            this.fieldContainer.appendChild(this.wrapEl);

            this.button.on('click', this._toggleOverlay, this, true);
//            Y.one(this.el).on('click', this._toggleOverlay, this, true);

            Y.one(this.el).on("change", function(event) {
                this.markSelectedColor(this.el.value);
            }, this);

            // plugin colorpicker
            this.grid = inputEx.cn('div', {className: 'inputEx-ColorField-Grid'});
            var thisBis = this;
            Y.use('gallery-colorpickercss', 'gallery-colorpicker', function(Y) {
                var swatch = Y.one(thisBis.grid);
                // create an instance of the widget
                thisBis.colorpicker = new Y.ColorPicker();
                // render the widget into the #picker node
                thisBis.colorpicker.render(thisBis.grid);

                swatch.one(".yui3-colorpicker-swatch").setStyle("border", "1px solid white");
                swatch.one(".yui3-colorpicker-swatch").appendChild("<p style='text-align: center; margin-top: 9px'>Update Color</p>");
                swatch.one(".yui3-colorpicker-swatch").on('click', function(e) {
                    thisBis.el.value = "#" + thisBis.colorpicker.get('hex');
                    thisBis.oOverlay.hide();
                    thisBis.markSelectedColor();
                }, this);
            });

        },
        _toggleOverlay: function(e) {
            // PreventDefault to prevent submit in a form
            e.preventDefault();

            // palette may not have been rendered yet
            this.renderPalette();

            this.oOverlay[this.oOverlay.get('visible') ? 'hide' : 'show']();
        },
        renderPalette: function() {

            if (!this.oOverlay) {
                this.renderOverlay();
            }

            // render once !
            if (this.paletteRendered) {
                return;
            }

            this.colorpicker.set("hex", this.el.value.substr(1));
            if (this.el.value === "#ffffff") {
                this.colorpicker.set("hsl", {h: 0, s: 1, l: 1});
            }
            this.colorGrid = this.grid;
            this.oOverlay.set('bodyContent', this.colorGrid);

            this.paletteRendered = true;
        },
        renderOverlay: function() {

            // Create overlay
            this.oOverlay = new Y.Overlay({
                visible: false,
                constrain: true,
                zIndex: 1000
            });
            //his.oOverlay.render(this.fieldContainer);

            this.oOverlay.render();

            this.oOverlay.on('visibleChange', function(e) {

                if (e.newVal) { // show
                    // align
                    this.oOverlay.set("align", {node: this.button, points: [Y.WidgetPositionAlign.CC, Y.WidgetPositionAlign.TC]});

                    // Activate outside event handler
                    this.outsideHandler = this.oOverlay.get('boundingBox').on('mousedownoutside', function(e) {
                        this.oOverlay.hide();
                    }, this);
                }
                else { // hide
                    this.outsideHandler.detach();
                }

            }, this);
        },
        markSelectedColor: function(value) {

            value = value || this.getValue();

            // set background color on colorEl
            Y.one(this.el).setStyle('backgroundColor', value);

        },
        setValue: function(value, sendUpdatedEvt) {

            this.el.value = value;

            this.markSelectedColor(value);

            // Call Field.setValue to set class and fire updated event
            inputEx.Wegas.ColorField.superclass.setValue.call(this, value, sendUpdatedEvt);
        },
        /**
         * Return the color value
         * @method getValue
         * @return {String} Color value
         */
        getValue: function() {
            return this.el.value;
        }
    });
    inputEx.registerType("colorpicker", inputEx.Wegas.ColorField);
});
