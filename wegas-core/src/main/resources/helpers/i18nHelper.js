/* global newValue, impact, index, code, newCode, com */

load("nashorn:parser.js");


var I18nHelper = (function() {
    "use strict";

    function mapProperties(node) {
        var p, ps = {};
        for (p in node.properties) {
            ps[node.properties[p].key.value] = node.properties[p].value;
        }
        return ps;
    }

    function fetchTranslations(node, code, path, sensitiveCaseCode) {
        var key, child, keys, i, j, results = [], result;

        path = path || "";

        if (node.type === 'ObjectExpression') {
            var i, p, properties;
            if (node.properties) {
                properties = mapProperties(node);

                // current node is and TranslatableContent object
                if (properties["@class"] && properties["@class"].value === "TranslatableContent") {

                    // current node is and TranslatableContent object
                    if (properties.translations &&
                        properties.translations.properties &&
                        properties.translations.properties.length === 0 ||
                        (properties.translations.properties[0].value &&
                            properties.translations.properties[0].value.type === "ObjectExpression")) {

                        // only extract i18nV2 translation
                        for (i in properties.translations.properties) {
                            p = properties.translations.properties[i];
                            if ((sensitiveCaseCode && p.key.value === code) || (
                                !sensitiveCaseCode && p.key.value.toUpperCase() === code)) {
                                var trProps = mapProperties(p.value);

                                // needle found
                                return [{
                                        status: 'found',
                                        keyLoc: p.key.loc,
                                        key: p.key.value,
                                        valueLoc: p.value.loc,
                                        trValue: trProps.translation.value,
                                        trStatus: trProps.status.value || "",
                                        path: path
                                    }];
                            }
                        }

                        return [{
                                status: 'missingCode',
                                loc: properties.translations.loc,
                                path: path
                            }];
                    } else {
                        return null;
                    }
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
                        result = fetchTranslations(child[j], code, path + "/" + key + "[" + j + "]", sensitiveCaseCode);
                        if (result && result.length > 0) {
                            results = results.concat(result);
                        }
                    }
                } else if (child instanceof Object && typeof child.type === "string") {
                    // the child is an object which contains a type property
                    result = fetchTranslations(child, code, path + "/" + key, sensitiveCaseCode);
                    if (result && result.length > 0) {
                        results = results.concat(result);
                    }
                }
            }
        }

        return results;
    }


    function fetchTranslatableContents(node) {
        var key, child, keys, i, j, results = [], result;

        if (node.type === 'ObjectExpression') {
            var i, p, properties = {};
            if (node.properties) {
                properties = mapProperties(node);

                // current node is and TranslatableContent object
                if (properties["@class"] && properties["@class"].value === "TranslatableContent") {
                    if (properties.translations &&
                        properties.translations.properties &&
                        properties.translations.properties.length > 0 &&
                        properties.translations.properties[0].value &&
                        properties.translations.properties[0].value.type === "ObjectExpression") {
                        // only extract i18nV2 translation
                        return [properties];
                    } else {
                        return [];
                    }
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
                        result = fetchTranslatableContents(child[j]);
                        if (result && result.length > 0) {
                            results = results.concat(result);
                        }
                    }
                } else if (child instanceof Object && typeof child.type === "string") {
                    // the child is an object which contains a type property
                    result = fetchTranslatableContents(child);
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

        results = fetchTranslations(ast, code, undefined, true);
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

    function getTranslatableContents(script) {
        var ast = parse(script, "impact", true),
            trcs = fetchTranslatableContents(ast),
            result = [];

        for (var i in trcs) {
            var properties = trcs[i], p;
            var tr = new com.wegas.core.i18n.persistence.TranslatableContent();
            for (var j in properties.translations.properties) {
                p = properties.translations.properties[j];
                var trProps = mapProperties(p.value);
                tr.updateTranslation(p.key.value, trProps.translation.value, trProps.status.value);
            }
            result.push(tr);
        }
        return result;
    }

    function getByIndex(script, index) {
        var ast = parse(script, "impact", true),
            trcs = fetchTranslatableContents(ast);

        if (trcs.length > index) {
            return trcs[index].translations.properties;
        } else {
            return  null;
        }
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
        },
        getTranslationsByIndex: function() {
            return getByIndex(impact, index);
        },
        /**
         * Parse impact and return list of TranslatableContent.
         * @returns {Array}
         */
        getTranslatableContents: function() {
            return getTranslatableContents(impact);
        }

    };

}());