/*
YUI 3.7.2 (build 5639)
Copyright 2012 Yahoo! Inc. All rights reserved.
Licensed under the BSD License.
http://yuilibrary.com/license/
*/
YUI.add('datatype-xml-parse', function (Y, NAME) {

/**
 * Parse XML submodule.
 *
 * @module datatype-xml
 * @submodule datatype-xml-parse
 * @for XML
 */

var LANG = Y.Lang;

Y.mix(Y.namespace("XML"), {
    /**
     * Converts data to type XMLDocument.
     *
     * @method parse
     * @param data {String} Data to convert.
     * @return {XMLDoc} XML Document.
     */
    parse: function(data) {
        var xmlDoc = null;
        if(LANG.isString(data)) {
            try {
                if(!LANG.isUndefined(ActiveXObject)) {
                        xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                        xmlDoc.async = false;
                        xmlDoc.loadXML(data);
                }
            }
            catch(ee) {
                try {
                    if(!LANG.isUndefined(DOMParser)) {
                        xmlDoc = new DOMParser().parseFromString(data, "text/xml");
                    }
                }
                catch(e) {
                }
                    Y.log(ee.message + " (Could not parse data to type XML Document)", "warn", "xml");
            }
        }
        
        if( (LANG.isNull(xmlDoc)) || (LANG.isNull(xmlDoc.documentElement)) || (xmlDoc.documentElement.nodeName === "parsererror") ) {
            Y.log("Could not parse data to type XML Document", "warn", "xml");
        }
        
        return xmlDoc;
    }
});

// Add Parsers shortcut
Y.namespace("Parsers").xml = Y.XML.parse;

Y.namespace("DataType");
Y.DataType.XML = Y.XML;


}, '3.7.2');
