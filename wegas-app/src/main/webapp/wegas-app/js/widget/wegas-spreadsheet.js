/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @author Jarle.Hulaas@heig-vd.ch
 */

YUI.add('wegas-spreadsheet', function(Y) {
    "use strict";

    var CONTENTBOX = 'contentBox',

        // URL of Wegas tab in scenario editor mode:
        GAME_EDITOR_PATH = "edit.html",
        // Exported Object properties:
        PROP_VALIDATED = "validated",
        PROP_ERRORS = "errors",
        // Various CSS classes:
        SHEET_CSS = "sheet",
        NUMBERINPUT_CSS = "numberinput",
        CHECKBOX_CSS = "checkbox",
        DOT_SHEET_CSS = '.' + SHEET_CSS,
        DOT_NUMBERINPUT_CSS = DOT_SHEET_CSS + ' .' + NUMBERINPUT_CSS,
        DOT_CHECKBOX_CSS = DOT_SHEET_CSS + ' .' + CHECKBOX_CSS,
        ERRORED = "errored",
        SCENARIST_BUTTON = "<button class=\"answerkey-definition-button\">Scenarist: save this as <b>answer key</b></button>",
        VALIDATE_BUTTON =  "<button class=\"yui3-button wegas-submit-button\">" + I18n.t("global.submit") + "</button>",

        // Shortcuts:
        Wegas = Y.Wegas,
        WegasScript = Wegas.Facade.Variable.script,
        Spreadsheet;

    /**
     *  Classe pour gérer les faits comptables.
     */
    Spreadsheet = Y.Base.create("wegas-spreadsheet", Y.Widget, [Y.WidgetParent, Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {

        finished : false,
        contenuActuel : null,

        // Variable permettant de regrouper les opérations de persistence des variables Wegas
        _bufferPersistence: "",

        // *** Lifecycle Methods *** //
        initializer: function() {
            this.handlers = {};
            
            this.isScenaristMode = (window.location.pathname.indexOf(GAME_EDITOR_PATH) >= 0),

            this.source = this.get("source.evaluated");
            if (this.source) {
                this.tableurHTML = this.source.getInstance().get("value");
            }
            
            this.reponseTableur = this.get("answers.evaluated");
            if (this.reponseTableur) {
                this.answersObject = this.reponseTableur.getInstance().get("properties");
                this.finished = this.finished || (this.answersObject[PROP_VALIDATED] === "true" || this.answersObject[PROP_VALIDATED] === true);
            }
            
            this.corrigeTableur = this.get("answerkeys.evaluated");
            if (this.corrigeTableur) {
                this.objCorrigeTableur = this.corrigeTableur.get("properties");
            }

        },

        renderUI: function() { // Create all DOM elements
            this.cb = this.get(CONTENTBOX);
        },

        bindUI: function() {            
            this.cb.all(".wegas-spreadsheet input").each(function(node) {
                node.getDOMNode().setAttribute("autocomplete", "off");
            });

            if (this.isScenaristMode) {
                this.get(CONTENTBOX).delegate("click", function (e) {
                    this.sauvegarderCorrigeTableur();
                }, ".answerkey-definition-button", this);
            }

            if (this.finished) return;

            this.get(CONTENTBOX).delegate("click", function(e) {
                // Ne pas finaliser si on vient d'avoir un problème de sauvegarde
                if (this.erreurPersistence) {
                    return;
                }
                
                // Tableur: vérifier que tous les inputs soient remplis avec un nombre:
                var emptyCells = 0,
                    invalidCells = 0,
                    ctx = this;
                this.cb.all(DOT_NUMBERINPUT_CSS).each(function(node) {
                    var val = node.getDOMNode().value.trim();
                    if (val === "") {
                        emptyCells++;
                    } else if (ctx.verifyNumber(val) === undefined) {
                        invalidCells++;
                    }
                });
                if (emptyCells > 0) {
                    Y.Wegas.Panel.alert("Please fill in all inputs.");
                    return;
                }
                if (invalidCells > 0) {
                    Y.Wegas.Panel.alert("Some values are not valid.<br/>Please correct.");
                    return;
                }
                
                this.markAsFinished();

                // 1. Corriger les données utilisateur
                var nbErrors = this.correctSheet();

                    
                // 2. MàJ les variables de comptage niveau Wegas, globale (mais transitoire) et locale au fait courant.
                //    Marquer la propriété "validé" de la réponse comme "true" (persiste que cet exercice est fini)

                this.answersObject[PROP_ERRORS] = nbErrors;
                this.saveProperty(PROP_ERRORS);
                this.answersObject[PROP_VALIDATED] = true;
                this.saveProperty(PROP_VALIDATED);
                                
                this.doPersist();

            }, "button.yui3-button", this);

        },

        // Evaluate all formulas inside the spreadsheet.
        evalFormulas: function() {
            var f, sum, c, val, decimals;
            for (var fi in this.formulas) {
                f = this.formulas[fi];
                if (f.op === "SUM") {
                    sum = 0;
                    for (var ci in f.range) {
                        c = f.range[ci];
                        decimals = +c.getAttribute("data-decimals");
                        if (c.nodeName === "INPUT") {
                            val = this.verifyNumber(c.value, decimals);
                        } else {
                            val = this.verifyNumber(c.innerText, decimals);
                        }
                        if (val !== undefined) {
                            sum += val;
                        }
                    }
                    if (!f.cell) {
                        f.cell = document.getElementsByName(f.cellName)[0];
                    }
                    f.cell.innerText = I18n.formatNumber(sum, { decimalPlaces: decimals });
                }
            }
        },

        // Returns true if the given string is a valid cell reference (e.g. $A1)
        // Columns are in the range [A..Z] and rows in the range [1..99].
        isCellRef: function(ref) {
            if (ref.length < 3 ||
                ref.length > 4 ||
                ref.charAt(0) !== '$' ||
                ref.charAt(1) < 'A' ||
                ref.charAt(1) > 'Z' ||
                ref.charAt(2) < '0' ||
                ref.charAt(2) > '9') {
                return false;
            }
            if (ref.length === 4 && (
                ref.charAt(3) < '0' ||
                ref.charAt(3) > '9')) {
                return false;
            }
            return true;
        },
        
        // Returns the list of cells from reference x1 to x2 if x1 and x2 are on the same column or same row.
        getRange: function(x1, x2) {
            var col1 = x1.charAt(1),
                row1 = x1.substr(2),
                col2 = x2.charAt(1),
                row2 = x2.substr(2);
            if (col1 !== col2 &&
                row1 !== row2) {
                return [];
            }
            var res = [],
                cellRef,
                cell;
            if (col1 === col2) {
                // Iterate on the rows of this column:
                var limit = +row2;
                for (var r = +row1; r <= limit; r++) {
                    cellRef = "$" + col1 + r;
                    cell = document.getElementsByName(cellRef);
                    if (cell && cell[0]) {
                        var c = cell[0];
                        if (c.nodeName === "TD" && c.innerText.trim() === "") {
                            // Skip empty cells
                            continue;
                        }
                        res.push(cell[0]);
                    } else {
                        continue;
                    }
                }
            } else if (row1 === row2) {
                // Iterate on the columns of this row:
                var limit = col2.charCodeAt(0);
                for (var c = col1.charCodeAt(0); c <= limit; r++) {
                    cellRef = "$" + String.fromCharCode(r) + row1;
                    cell = document.getElementsByName(cellRef);
                    if (cell && cell[0]) {
                        var c = cell[0];
                        if (c.nodeName === "TD" && c.innerText.trim() === "") {
                            // Skip empty cells
                            continue;
                        }
                        res.push(cell[0]);
                    } else {
                        continue;
                    }
                }
            }
            return res;
        },
        
        // Scans the given HTML table and implements all known annotations/formulas.
        processTable: function(table) {
            this.formulas = [];
            for (var i = 0, row; row = table.rows[i]; i++) {
                var rowName = String(i + 1);
                for (var j = 0, cell; cell = row.cells[j]; j++) {
                    var cellName = "$" + String.fromCharCode(65 + j) + rowName,
                        contents = cell.innerText.trim().toUpperCase(),
                        args, decimals,
                        cellparts = [],
                        output = '';
                    
                    // Try to correctly process any formatting tags inside the cell:
                    if (cell.innerHTML.length !== cell.innerText.length) {
                        cellparts = cell.innerHTML.split(cell.innerText);
                        if (cellparts.length === 2) {
                            output = cellparts[0];
                        }
                    }
                    // Handle =ReadNumber(decimals)
                    if (contents.length > 13 && contents.indexOf("=READNUMBER(") === 0 && contents.charAt(contents.length-1) === ")") {
                        args = contents.substring(12, contents.length-1);
                        decimals = +args;
                        output += 
                                '<input type="text" class="' + NUMBERINPUT_CSS +
                                '" name="' + cellName + 
                                '" data-decimals="' + decimals +
                                '" autocomplete="off">';
                            
                    // Handle =ReadClick()
                    } else if (contents.length === 12 && contents.indexOf("=READCLICK()") === 0) {
                        // We could specify the classes through which the user cycles when clicking
                        output +=  
                                '<span class="' + CHECKBOX_CSS + 
                                '" name="' + cellName + 
                                '">';
                    // Cells without input (constant content or formula)
                    } else {
                        // =Sum(from, to, decimals)
                        if (contents.length > 6 && contents.indexOf("=SUM(") === 0 && contents.charAt(contents.length-1) === ")") {
                            args = contents.substring(5, contents.length-1).split(',');
                            if (args.length !== 3) {
                                alert("Formula in " + cellName + ": 3 arguments expected");
                                continue;
                            }
                            var arg0 = args[0],
                                arg1 = args[1],
                                arg2 = args[2];
                            if (! this.isCellRef(arg0) ||
                                ! this.isCellRef(arg1) ||
                                isNaN(arg2)) {
                                alert("Error in formula arguments in " + cellName);
                                continue;
                            }
                            arg2 = +arg2;
                            this.formulas.push({
                                cellName: cellName,
                                cell: undefined,  // To be updated at first use
                                formula: contents,
                                op: "SUM",
                                from: arg0,
                                to: arg1,
                                decimals: arg2
                            });
                            output +=
                                '<span class="formula no-input" title="sum(' + 
                                arg0 + ":" + arg1 + ')" data-decimals="' + String(arg2) + 
                                '" name="' + cellName + '"></span>';                                
                        } else {
                            // This cell has plain constant contents
                            output += cell.innerHTML;
                            cell.setAttribute("name", cellName);
                            cell.className = cell.className + " no-input";
                        }
                    }
                    
                    if (cellparts.length === 2) {
                        output += cellparts[1];
                    }
                    cell.innerHTML = output;
                }
            }
            // Post-process formulas now that cell names are generated everywhere:
            for (var fi in this.formulas) {
                var f = this.formulas[fi],
                    range = this.getRange(f.from, f.to);
                if (range.length === 0) {
                    alert("These arguments are not in a row nor a column in " + cellName);
                }
                f.range = range;
            }
            
        },
        
        // Bind handlers to spreadsheet
        doSheetBindings: function() {
            // Handle number inputs
            this.cb.all(DOT_NUMBERINPUT_CSS).on('change', function (e) {
                var strVal = e.currentTarget.get('value'),
                    name = e.currentTarget.get('name'),
                    decimals = +e.currentTarget.getData().decimals;
                if (strVal === '') { // Enable clearing the cell
                    this.answersObject[name] = undefined;
                    this.saveInput(name);
                    this.displayNumber(name, undefined, decimals);
                    return;
                }
                var val = this.verifyNumber(strVal, decimals);
                if (typeof val === 'number') {
                    this.answersObject[name] = val;
                    this.saveInput(name);
                    this.displayNumber(name, val, decimals);
                } else {
                    this.answersObject[name] = undefined;
                    this.saveInput(name);
                    Y.Wegas.Panel.alert(Y.Wegas.I18n.t("errors.nan", {value: strVal}));
                }
            }, this);
            // Handle click on "readClick" cells:
            this.cb.all(DOT_CHECKBOX_CSS).on('click', function (e) {
                var ro = e.currentTarget.getAttribute('readonly');
                if (ro) {
                    return;
                }
                e.currentTarget.toggleClass('checked');
                var name = e.currentTarget.getAttribute('name');
                if (e.currentTarget.hasClass('checked')) {
                    // Store as string to facilitate comparison with expected results:
                    this.answersObject[name] = "true";
                } else {
                    this.answersObject[name] = undefined;
                }
                this.saveInput(name);
            }, this);
        },
        
        /**
         * Displays the spreadsheet
         */
        displaySpreadsheet: function() {
            var cb = this.get(CONTENTBOX);

            cb.hide().setHTML(
                this.isScenaristMode ?
                    this.tableurHTML + SCENARIST_BUTTON + VALIDATE_BUTTON :
                    this.tableurHTML + VALIDATE_BUTTON);
            this.processTable(cb.one("table").addClass(SHEET_CSS).getDOMNode());
            cb.show();
            
            this.evalFormulas();
            this.doSheetBindings();
        },
        
        /**
         * Clears the spreadsheet 
         */
        clearSpreadsheet: function() {
            var cb = this.get(CONTENTBOX);
            cb.setHTML("");
        },
        
        
        /**
         *
         */
        syncUI: function() { // Show / hide elements depending on their visibility attribute
            if (this.tableurHTML) {
                this.displaySpreadsheet();
                this.restoreSheet();

                if (this.finished) {
                    this.markAsFinished();
                    this.correctSheet();
                } else {
                    this.markAsActive();
                }
            }
        },


        // Retourne le bilan des fautes trouvées dans la réponse au tableur courant:
        correctSheet: function() {
            // Une réponse juste est une table où chaque input est identique à l'input correspondant du corrigé,
            // Les inputs vides sont interdits lors du click sur "valider".
            var nbErrors = 0,
                userRep = this.answersObject,
                corr = this.objCorrigeTableur,
                i;
        
            // Check if all expected values have been entered by the user:
            for (i in corr) {
                // Allow implicit string-number conversions:
                if (userRep[i] != corr[i]) {
                    nbErrors++;
                    this.setErroredCell(i);
                }
            }

            // Check if user has entered extraneous values:
            for (i in userRep) {
                // Allow string-number conversions:
                if (userRep[i] && !corr[i]) {
                    nbErrors++;
                    this.setErroredCell(i);
                }
            }

            return nbErrors;
        },
        
        setErroredCell: function(name) {
            var cellule = this.cb.one(DOT_SHEET_CSS + " [name=" + name + "]");
            cellule.addClass(ERRORED);
        },

        // Persiste immédiatement une donnée entrée à la main:
        saveInput: function(propName) {
            var value = this.answersObject[propName],
                varName = this.reponseTableur.get("name");
            if (value !== undefined) {
                WegasScript.remoteEval("Variable.find(gameModel, \"" + varName + "\").getInstance(self).setProperty(\"" + propName + "\", \"" + value + "\");", {});
            } else {
                WegasScript.remoteEval("Variable.find(gameModel, \"" + varName + "\").getInstance(self).removeProperty(\"" + propName + "\");", {});
            }

        },

        doPersist: function(successMsg) {
            var ctx = this,
                buffer = this._bufferPersistence,
                cfg = {
                    on: {
                        success: function(e) {
                            if (successMsg)
                                Y.log(successMsg);
                        },
                        failure: function(e) {
                            ctx.erreurPersistence = true;
                            alert("Problème de sauvegarde des données.\nVeuillez recommencer SVP.\n" + buffer);
                        }
                    }
                };
            if (this._bufferPersistence !== "") {
                this.erreurPersistence = false;
                WegasScript.remoteEval(this._bufferPersistence, cfg);
                this._bufferPersistence = "";
            }
        },

        planifierPersistence: function(cmd) {
            this._bufferPersistence += cmd + "\n";
        },

        saveVariable: function(name, value) {
            this.planifierPersistence("Variable.find(gameModel, \"" + name + "\").setValue(self, " + value + ");");
        },

        planifierPersistencePropriete: function(obj, varName, propName) {
            var value = obj[propName];
            if (value !== undefined) {
                this.planifierPersistence("Variable.find(gameModel, \"" + varName + "\").getInstance(self).setProperty(\"" + propName + "\", \"" + value + "\");");
            } else {
                this.planifierPersistence("Variable.find(gameModel, \"" + varName + "\").getInstance(self).removeProperty(\"" + propName + "\");");
            }
        },

        saveProperty: function(propName) {
            this.planifierPersistencePropriete(this.answersObject, this.reponseTableur.get("name"), propName);
        },

        // Persiste dans la valeur par défaut de la variable "corrigé" du tableur.
        planifierPersistenceCorrigeTableur: function(propName) {
            var varName = this.corrigeTableur.get("name"),
                value = this.objCorrigeTableur[propName];
            if (value !== undefined) {
                this.planifierPersistence("Variable.find(gameModel, \"" + varName + "\").setProperty(\"" + propName + "\", \"" + value + "\");");
            } else {
                this.planifierPersistence("Variable.find(gameModel, \"" + varName + "\").removeProperty(\"" + propName + "\");");
            }
        },

        // Scénariste: Sauvegarde this.answersObject comme réponse juste dans le descripteur de l'objet "Tableur - Corrigé".
        sauvegarderCorrigeTableur: function() {
            var reponse = this.answersObject,
                ancienCorrige = this.corrigeTableur.get("properties");
            this.objCorrigeTableur = {};
            // Copier et persister la réponse actuelle comme corrigé
            for (var name in reponse) {
                if( reponse.hasOwnProperty(name) ) {
                    // Ignorer certaines propriétés (les totaux ne sont jamais stockés dans la réponse, donc pas besoin de les filtrer ici)
                    if (name !== PROP_VALIDATED &&
                        name !== PROP_ERRORS) {
                        this.objCorrigeTableur[name] = reponse[name];
                        this.planifierPersistenceCorrigeTableur(name);
                        delete ancienCorrige[name];
                    }
                }
            }
            // Supprimer de l'ancien corrigé les éventuelles propriétés non gardées :
            for (var name in ancienCorrige) {
                if (ancienCorrige.hasOwnProperty(name)) {
                    this.planifierPersistenceCorrigeTableur(name);
                }
            }
            this.doPersist("Sauvegardé comme corrigé du tableur no " + this.faitActuel + " !");
        },


        // Restore spreadsheet from persisted values
        restoreSheet: function() {
            var obj = this.answersObject,
                tab = this.cb.one(DOT_SHEET_CSS);
            for (var name in obj) {
                if( obj.hasOwnProperty(name) ) {
                    var valeur = obj[name],
                        cell, decimals;
                    cell = tab.one("[name=" + name + "]");
                    // Skip object properties like "validated" and "errors"
                    if (cell) {
                        decimals = +cell.getData().decimals;
                        this.displayNumber(name, valeur, decimals);
                    }
                }
            }
        },


        // Affiche le montant donné 
        displayNumber: function(name, valeur, decimals){
            // The computation of this lookup often generates a caught exception:
            var celluleMontant = this.cb.one('input[name=' + name + ']');
            
            if (!celluleMontant) {
                alert("Error: cannot find a cell with name=" + name);
                return;
            }
            celluleMontant.set('value', (valeur !== undefined) ? I18n.formatNumber(valeur, { decimalPlaces: decimals }) : '');
            this.evalFormulas();
        },
        
        
        // Returns the integer value of 'strVal' if it's an integer, otherwise returns undefined.
        // @param maxDigits (optional) Max number of digits, the result is always the leftmost 'maxDigits' characters.
        // @param allowNegative (optional, default false) tells if the result is allowed to be negative.
        verifInt: function(strVal, maxDigits, allowNegative){
            if (strVal.length === 0) return undefined;
            var val = parseInt(strVal, 10);
            if (isNaN(val)) return undefined;
            if (val < 0 && allowNegative !== true) {
                val = -val;
            }
            strVal = val.toString(); // Filter out any leading/trailing chars
            var len = strVal.length;
            if (typeof maxDigits === 'number' && maxDigits < len) {
                return parseInt(strVal.substr(0,maxDigits));
            }
            return val;
        },

        // Returns the float value of 'strVal' if it's a valid monetary amount, otherwise returns undefined.
        // Allowed formats: 12'345.67 or 12345,67 (or even 12 345,67 as sometimes formatted in Excel)
        // @param decimals the number of decimals to display.
        // @param forbidNegative (optional, default false) tells if the result can be negative.
        verifyNumber: function(strVal, decimals, forbidNegative){
            if (!decimals) {
                decimals = 0;
            }
            if (strVal.length === 0) return undefined;
            // Remove anything not a number, dot, comma or minus:
            strVal = strVal.replace(/[^\d.,-]/g,'');
            var val = I18n.parseNumber(strVal);
            if (val === null) {
                // Try parsing again with commas as thousands separator:
                val = I18n.parseNumber(strVal, { thousandsSeparator: ',' });
                if (val === null) {
                    return undefined;
                }
            }
            if (val < 0 && forbidNegative === true) {
                val = -val;
            }
            // Chop off any excessive decimals:
            return parseFloat(I18n.formatNumber(val, { decimalPlaces: decimals, thousandsSeparator: '' }));
        },

        markAsFinished: function() {
            
            this.cb.one('button.yui3-button').hide();
            this.cb.all(DOT_NUMBERINPUT_CSS).setAttribute('readonly', 'readonly');
            this.cb.all(DOT_CHECKBOX_CSS).setAttribute('readonly', 'readonly');
        },

        markAsActive: function() {
            this.cb.one('button.yui3-button').show();
            this.cb.all(DOT_NUMBERINPUT_CSS).removeAttribute('readonly');
            this.cb.all(DOT_CHECKBOX_CSS).removeAttribute('readonly');
        },

        /**
         *
         */
        destructor: function() {
            for (var i in this.handlers) {
                this.handlers[i].detach();
            }
            return;
        }
    }, {
        EDITORNAME: "Spreadsheet",
        ATTRS: {
            // Readonly: Wegas text variable containing the HTML code of the spreadsheet:
            source: {
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                type: "object",
                view: {
                    type: "variableselect",
                    label: "HTML table (structure of the spreadsheet, read-only)",
                    classFilter: "TextDescriptor"
                }
            },
            // Output: Wegas object variable containing the answers entered by the user:
            answers: {
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                type: "object",
                view: {
                    type: "variableselect",
                    label: "Where inputs will be stored",
                    classFilter: "ObjectDescriptor"
                }
            },
            // Readonly: Wegas object variable containing answers keys:
            answerkeys: {
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                type: "object",
                view: {
                    type: "variableselect",
                    label: "Answer keys for automatic correction (read-only)",
                    classFilter: "ObjectDescriptor"
                }
            }
        }
    });
    Y.Wegas.Spreadsheet = Spreadsheet;
},'V1.0', {});
