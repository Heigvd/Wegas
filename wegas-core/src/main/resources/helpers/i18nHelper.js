/* global newValue, impact, index, code, newCode */

load("nashorn:parser.js");


var I18nHelper = (function() {
    "use strict";

    function fetchTranslations(node, code) {
        var key, child, keys, i, j, results = [], result;

        if (node.type === 'ObjectExpression') {
            var i, p, properties = {};
            if (node.properties) {
                for (i in node.properties) {
                    p = node.properties[i];
                    properties[p.key.value] = p.value;
                }
                // current node is and TranslatableContent object
                if (properties["@class"] && properties["@class"].value === "TranslatableContent") {
                    var found = false;
                    for (i in properties["translations"].properties) {
                        p = properties["translations"].properties[i];
                        if (p.key.value === code) {
                            // needle found
                            return [{
                                    status: 'found',
                                    keyLoc: p.key.loc,
                                    key: p.key.value,
                                    valueLoc: p.value.loc,
                                    value: p.value.value
                                }];
                        }
                    }

                    return [{
                            status: 'missingCode',
                            loc: properties["translations"].loc
                        }];
                }
            }
        }

        keys = Object.keys(node).sort();
        for (i in keys) {
            key = keys[i];
            if (node.hasOwnProperty(key)) {
                child = node[key];
                if (Array.isArray(child)) {
                    // process all items in arry
                    for (j = 0; j < child.length; j++) {
                        result = fetchTranslations(child[j], code);
                        if (result && result.length > 0) {
                            results = results.concat(result);
                        }
                    }
                } else if (child instanceof Object && typeof child.type === "string") {
                    // the child is an object which contains a type property
                    result = fetchTranslations(child, code);
                    if (result && result.length > 0) {
                        results = results.concat(result);
                    }
                }
            }
        }

        return results;
    }


    function getTranslationLocation(impact, index, code, newValue) {
        var ast, loc, results;
        // parse impact and expose node location
        ast = parse(impact, "impact", true);

        results = fetchTranslations(ast, code);
        if (results && results.length > index) {
            loc = results[index];
        } else {
            loc = {
                status: 'misingTranslationContent'
            };
        }

        loc.newValue = JSON.stringify(newValue);

        return loc;
    }

    function getTranslations(impact, code) {
        var ast, loc, results;
        // parse impact and expose node location
        ast = parse(impact, "impact", true);

        return fetchTranslations(ast, code);
        /*.filter(function(item) {
         if (item.status === "found") {
         return true;
         }
         return false;
         });*/
    }

    return {
        /**
         * impact, index, code, newValue
         */
        getTranslationLocation: function() {
            return getTranslationLocation(impact, index, code, newValue);
        },
        getTranslations: function() {
            return getTranslations(impact, code);
        }
    };

}());