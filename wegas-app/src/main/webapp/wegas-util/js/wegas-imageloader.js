/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-imageloader', function(Y) {
    "use strict";

    /**
     * Image objects to be registered with the groups
     * @name Y.Wegas.ImgageLoader
     * @extends Y.ImgLoadImgObj
     * @constructor
     */
    var BlobBuilder = window.MozBlobBuilder || window.WebKitBlobBuilder || window.BlobBuilder,
        ImgageLoader = function() {
            Y.Wegas.ImgageLoader.superclass.constructor.apply(this, arguments);
        };

    ImgageLoader.NAME = 'ImgageLoader';

    ImgageLoader.ATTRS = {
        target: {}
    };

    Y.extend(ImgageLoader, Y.ImgLoadImgObj, {
        _getImgEl: function() {

            return this.get("target");

            if (this._imgEl === null) {
                this._imgEl = Y.one('#' + this.get('domId'));
            }
            return this._imgEl;
        },
        fetch: function(withinY) {
            if (this._fetched) {
                return true;
            }

            var yPos, el = this._getImgEl();

            if (!el) {
                return false;
            }

            if (withinY) {
                // need a distance check
                yPos = this._getYPos();
                if (!yPos || yPos > withinY) {
                    return false;
                }
                Y.log('Image with id "' + this.get('domId') + '" is within distance of the fold. Fetching image.', 'info', 'imageloader');
            }

            Y.log('Fetching image with id "' + this.get('domId') + '".', 'info', 'imageloader');

            // apply url
            if (this.get('bgUrl') !== null) {
                // bg url
                if (this.get('isPng') && Y.UA.ie && Y.UA.ie <= 6) {
                    // png for which to apply AlphaImageLoader
                    el.setStyle('filter', 'progid:DXImageTransform.Microsoft.AlphaImageLoader(src="' + this.get('bgUrl') + '", sizingMethod="' + this.get('sizingMethod') + '", enabled="' + this.get('enabled') + '")');
                } else {
                    el.setStyle('backgroundImage', "url('" + this.get('bgUrl') + "')");// regular bg image
                }
            } else if (this.get('srcUrl') !== null) {
                this.loadImage(el, "src");
            }

            if (this.get('setVisible')) {                                       // apply attributes
                el.setStyle('visibility', 'visible');
            }
            if (this.get('width')) {
                el.setAttribute('width', this.get('width'));
            }
            if (this.get('height')) {
                el.setAttribute('height', this.get('height'));
            }

            this._fetched = true;

            return true;
        },
        loadImage: function(el, attr) {

            // Method 1, using BlobBuilder & XMLHttpRequest
            if (window.XMLHttpRequest && window.BlobBuilder) {
                var request = new XMLHttpRequest();
                request.onload = Y.bind(function(loadEvt) {
                    if (loadEvt.target.status === 200) {
                        var blob, bb = new BlobBuilder(),
                            reader = new FileReader();

                        bb.append(loadEvt.target.response);                     // Note: not request.responseText
                        blob = bb.getBlob(loadEvt.target.getResponseHeader("Content-Type"));

                        reader.onload = Y.bind(function(e) {
                            el.setAttribute(attr, e.target.result);
                            this.fire("load", {
                                meta: {
                                    contentType: loadEvt.target.getResponseHeader("Content-Type"),
                                    description: loadEvt.target.getResponseHeader("Description")
                                }
                            });
                        }, this);
                        reader.readAsDataURL(blob);
                    }
                }, this);
                request.open("GET", this.get('srcUrl'), true);
                request.responseType = "arraybuffer";
                request.send(null);
                return;
            } else if (window.GM_xmlhttpRequest) {                              // Method 2, using overrideMimeType
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: this.get('srcUrl'),
                    onload: function(respDetails) {
                        var binResp = customBase64Encode(respDetails.responseText);
                        el.setAttribute(attr, 'data:image/png;base64,' + binResp);
                    },
                    overrideMimeType: 'text/plain; charset=x-user-defined'
                });
                return;
            }

            // Method 3 (fallback), set img src
            el.setAttribute(attr, this.get('srcUrl'));
            el.once("load", function(e) {
                this.fire("load", {
                    meta: {}
                });
            }, this);
        }
    });

    Y.namespace("Wegas").ImgageLoader = ImgageLoader;

    function customBase64Encode(inputStr) {
        var bbLen = 3,
            enCharLen = 4,
            inpLen = inputStr.length,
            inx = 0,
            jnx,
            keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
            + "0123456789+/=",
            output = "",
            paddingBytes = 0;
        var bytebuffer = new Array(bbLen),
            encodedCharIndexes = new Array(enCharLen);

        while (inx < inpLen) {
            for (jnx = 0; jnx < bbLen; ++jnx) {
                /*--- Throw away high-order byte, as documented at:
                 https://developer.mozilla.org/En/Using_XMLHttpRequest#Handling_binary_data
                 */
                if (inx < inpLen)
                    bytebuffer[jnx] = inputStr.charCodeAt(inx++) & 0xff;
                else
                    bytebuffer[jnx] = 0;
            }

            /*--- Get each encoded character, 6 bits at a time.
             index 0: first  6 bits
             index 1: second 6 bits
             (2 least significant bits from inputStr byte 1
             + 4 most significant bits from byte 2)
             index 2: third  6 bits
             (4 least significant bits from inputStr byte 2
             + 2 most significant bits from byte 3)
             index 3: forth  6 bits (6 least significant bits from inputStr byte 3)
             */
            encodedCharIndexes[0] = bytebuffer[0] >> 2;
            encodedCharIndexes[1] = ((bytebuffer[0] & 0x3) << 4) | (bytebuffer[1] >> 4);
            encodedCharIndexes[2] = ((bytebuffer[1] & 0x0f) << 2) | (bytebuffer[2] >> 6);
            encodedCharIndexes[3] = bytebuffer[2] & 0x3f;

            //--- Determine whether padding happened, and adjust accordingly.
            paddingBytes = inx - (inpLen - 1);
            switch (paddingBytes) {
                case 1:
                    // Set last character to padding char
                    encodedCharIndexes[3] = 64;
                    break;
                case 2:
                    // Set last 2 characters to padding char
                    encodedCharIndexes[3] = 64;
                    encodedCharIndexes[2] = 64;
                    break;
                default:
                    break; // No padding - proceed
            }

            /*--- Now grab each appropriate character out of our keystring,
             based on our index array and append it to the output string.
             */
            for (jnx = 0; jnx < enCharLen; ++jnx)
                output += keyStr.charAt(encodedCharIndexes[jnx]);
        }
        return output;
    }
});
