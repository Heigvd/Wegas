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
        ERRORED_CSS = "errored",
        DOT_SHEET_CSS = '.' + SHEET_CSS,
        DOT_NUMBERINPUT_CSS = DOT_SHEET_CSS + ' .' + NUMBERINPUT_CSS,
        DOT_CHECKBOX_CSS = DOT_SHEET_CSS + ' .' + CHECKBOX_CSS,
        SCENARIST_BUTTON = "<button class=\"answerkey-definition-button\">Scenarist: save current state as <b>answer keys</b></button>",
        HELP_BUTTON = "<button class=\"help-button\">Scenarist <b>help</b></button>",
        VALIDATE_BUTTON =  "<button class=\"yui3-button wegas-submit-button\">" + I18n.t("global.submit") + "</button>",

        // Shortcuts:
        Wegas = Y.Wegas,
        WegasScript = Wegas.Facade.Variable.script,
        Spreadsheet;


    Spreadsheet = Y.Base.create("wegas-spreadsheet", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {

        scenaristHelp: function() {
            var msg = 
                '<h3>Widget Parameters</h3><ol>' + 
                '<li>The "Source" variable is a text that contains the HTML code of the spreadsheet. This variable is not modified by the widget.' +
                '    Cells in a table are implicitly named according to the scheme <i>$B5</i> where "B" is the column name (from A to Z)' +
                '    and "5" is the row number (from 1 to 99).</li>' +
                '<li>The "Answers" variable is an object that will contain user inputs associated to cell names, e.g. { $B5, 3.14 }.' +
                '    Once the user has clicked on the "submit" button, it will also contain two special properties:<ul>' +
                '    <li>Property "validated" will be set to true when the user has clicked on the "submit" button.' +
                '    <li>Property "errors" will be set to the number of errors found (or -1 if no answer keys are provided).' +
                '    </ul>For further information, see below in section "Conditions on spreadsheet contents".' +
                '<li>The "Answer keys" variable is optional. If this object is specified, as a scenarist, you must first enter the answer keys into the widget,' +
                '    then click on the button ' + SCENARIST_BUTTON + ' to have your input saved as the expected solution.' + 
                '</ol>' +
                '<h3>Specification of Input Fields and Formulas</h3>' +
                'Input fields in the HTML table are cells containing either: <ul>' +
                '<li><i>=ReadNumber(decimals)</i><br>This will enable the user to enter a number. ' +
                '    Parameter "decimals" indicates the number of decimals that shall be displayed in the end.' +
                '<li><i>=ReadClick()</i><br>This will enable the user to click on the cell to validate or invalidate a proposition.' +
                '</ul>' +
                'A cell can contain a formula, consisting of a sum of numbers specified like this:' +
                '<ul><li><i>=Sum(from, to, nbDecimals)</i><ol>' +
                '<li>Parameter "from" is the first cell in a row or column, e.g. <i>$B3</i>' +
                '<li>Parameter "to" is the last cell in the same row or column, e.g. <i>$B6</i>' +
                '<li>Parameter "decimals" is the number of decimals to display' +
                '</ol></ul>' +
                '<h3>Formatting</h3>' +
                'Table cells can be quite freely formatted inside a text or HTML editor. To complete this, a few CSS classes are provided:<ul>' +
                '<li><i>header-row</i> centers the text' +
                '<li><i>header-column</i> aligns text to the left' +
                '<li><i>gray-background</i> gives the cell a gray background' +
                '<li><i>borders</i> gives the cell darker borders' +
                '<li><i>underline-1px</i> and <i>underline-2px</i> underline the result of a formula' +
                '</ul>' +
                '<h3>Conditions on Spreadsheet Contents</h3>' +
                'A condition in a trigger or state machine can detect when a spreadsheet has been "submitted" by the user:' +
                '<ul><li><span class="bordered">Answers</span> <span class="bordered-menu">property</span> <span class="bordered">validated</span> <span class="bordered-menu">equals</span> <span class="bordered">true</span><br>' +
                '    where Answers is the name of the Object variable specified to hold user input.</li></ul>' +
                'Add this condition to detect if user input contains errors:' +
                '<ul><li><span class="bordered">Answers</span> <span class="bordered-menu">property</span> <span class="bordered">errors</span> <span class="bordered-menu">is different from</span> <span class="bordered">0</span><br>' +
                '    This is only possible when an answer keys parameter has been provided to the widget.</li></ul>'                
            ;
            var panel = new Y.Wegas.Panel({
                headerContent: "<h2>Help on the Spreadsheet Widget</h2>",
                content: msg,
                modal: false,
                width: 600
            }).render();
            panel.get(CONTENTBOX).addClass("wegas-spreadsheet-help");
            panel.plug(Y.Plugin.DraggablePanel, {});
        },

        // *** Lifecycle Method *** //
        initializer: function() {
            this.handlers = {};
            this.finished = false;
            this.persistenceBuffer = "";
            this.isScenaristMode = (window.location.pathname.indexOf(GAME_EDITOR_PATH) >= 0),

            this.source = this.get("source.evaluated");
            if (this.source) {
                this.tableurHTML = this.source.getInstance().get("value");
            }
            
            this.answersEntered = this.get("answers.evaluated");
            if (this.answersEntered) {
                this.answersEnteredObject = this.answersEntered.getInstance().get("properties");
                this.finished = this.finished || (this.answersEnteredObject[PROP_VALIDATED] === "true" || this.answersEnteredObject[PROP_VALIDATED] === true);
            }
            
            this.answerKeys = this.get("answerkeys.evaluated");
            if (this.answerKeys) {
                this.answerKeysObject = this.answerKeys.get("properties");
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
                    this.saveAnswerKeys();
                }, ".answerkey-definition-button", this);
                this.get(CONTENTBOX).delegate("click", function (e) {
                    this.scenaristHelp();
                }, ".help-button", this);                
            }

            if (this.finished) return;

            this.get(CONTENTBOX).delegate("click", function(e) {
                // Do not finalize if we just had a persistence issue
                if (this.persistenceError ||
                    this.hasEmptyOrInvalidInputs()) {
                    return;
                }
                
                this.markAsFinished();

                var nbErrors = this.correctSheet();
                this.answersEnteredObject[PROP_ERRORS] = nbErrors;
                this.saveAnswerProperty(PROP_ERRORS);
                this.answersEnteredObject[PROP_VALIDATED] = true;
                this.saveAnswerProperty(PROP_VALIDATED);
                                
                this.doPersist();

            }, "button.yui3-button", this);

        },
        
        // Returns true if the spreadsheet has empty or invalid numeric inputs.
        hasEmptyOrInvalidInputs: function() {
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
                Y.Wegas.Panel.alert("Please fill in all inputs before.");
                return true;
            }
            if (invalidCells > 0) {
                Y.Wegas.Panel.alert("Some values are not valid.<br/>Please correct.");
                return true;
            }
            return false;
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
                                Y.Wegas.Panel.alert("Formula in " + cellName + ": 3 arguments expected");
                                continue;
                            }
                            var arg0 = args[0],
                                arg1 = args[1],
                                arg2 = args[2];
                            if (! this.isCellRef(arg0) ||
                                ! this.isCellRef(arg1) ||
                                isNaN(arg2)) {
                                Y.Wegas.Panel.alert("Error in formula arguments in " + cellName);
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
                    Y.Wegas.Panel.alert("These arguments are not in a row nor a column in " + cellName);
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
                    this.answersEnteredObject[name] = undefined;
                    this.saveInput(name);
                    this.displayNumber(name, undefined, decimals);
                    return;
                }
                var val = this.verifyNumber(strVal, decimals);
                if (typeof val === 'number') {
                    this.answersEnteredObject[name] = val;
                    this.saveInput(name);
                    this.displayNumber(name, val, decimals);
                } else {
                    this.answersEnteredObject[name] = undefined;
                    this.saveInput(name);
                    Y.Wegas.Panel.alert(Y.Wegas.I18n.t("errors.nan", {value: strVal}));
                }
            }, this);
            // Handle click on "readClick" cells:
            this.cb.all(DOT_CHECKBOX_CSS).on('click', function (e) {
                if (e.currentTarget.getAttribute('readonly')) {
                    return;
                }
                e.currentTarget.toggleClass('checked');
                var name = e.currentTarget.getAttribute('name');
                if (e.currentTarget.hasClass('checked')) {
                    // Store as string to facilitate comparison with expected results:
                    this.answersEnteredObject[name] = "true";
                } else {
                    this.answersEnteredObject[name] = undefined;
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
                    this.tableurHTML +
                        (this.answerKeysObject ? SCENARIST_BUTTON : '') +
                        HELP_BUTTON +
                        VALIDATE_BUTTON :
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


        // Returns the number of errors found, or -1 if no answer keys are defined.
        correctSheet: function() {
            var nbErrors = 0,
                enteredAnswer = this.answersEnteredObject,
                answerKeys = this.answerKeysObject,
                i;
        
            // Is there any answer key object ?
            if (!answerKeys) {
                return -1;
            }
            
            // Check if all expected values have been entered by the user:
            for (i in answerKeys) {
                // Allow implicit string-number conversions:
                if (enteredAnswer[i] != answerKeys[i]) {
                    nbErrors++;
                    this.setCellAsErrored(i);
                }
            }

            // Check if user has entered extraneous values:
            for (i in enteredAnswer) {
                if (i !== PROP_VALIDATED &&
                    i !== PROP_ERRORS) {
                    // Allow string-number conversions:
                    if (enteredAnswer[i] && !answerKeys[i]) {
                        nbErrors++;
                        this.setCellAsErrored(i);
                    }
                }
            }

            return nbErrors;
        },
        
        setCellAsErrored: function(name) {
            var cell = this.cb.one(DOT_SHEET_CSS + ' [name="' + name + '"]');
            cell.addClass(ERRORED_CSS);
        },

        // Persists some input:
        saveInput: function(propName) {
            var value = this.answersEnteredObject[propName],
                varName = this.answersEntered.get("name");
            if (value !== undefined) {
                WegasScript.remoteEval("Variable.find(gameModel, \"" + varName + "\").getInstance(self).setProperty(\"" + propName + "\", \"" + value + "\");", {});
            } else {
                WegasScript.remoteEval("Variable.find(gameModel, \"" + varName + "\").getInstance(self).removeProperty(\"" + propName + "\");", {});
            }

        },

        doPersist: function(successMsg) {
            var ctx = this,
                cfg = {
                    on: {
                        success: function(e) {
                            if (successMsg)
                                Y.Wegas.Panel.alert(successMsg);
                        },
                        failure: function(e) {
                            ctx.persistenceError = true;
                            Y.Wegas.Panel.alert("Problem saving this data.\nPlease try again.\n");
                        }
                    }
                };
            if (this.persistenceBuffer !== "") {
                this.persistenceError = false;
                WegasScript.remoteEval(this.persistenceBuffer, cfg);
                this.persistenceBuffer = "";
            }
        },

        schedulePersistence: function(cmd) {
            this.persistenceBuffer += cmd + "\n";
        },

        saveVariable: function(name, value) {
            this.schedulePersistence("Variable.find(gameModel, \"" + name + "\").setValue(self, " + value + ");");
        },

        saveAnswerProperty: function(propName) {
            var varName = this.answersEntered.get("name"),
                value = this.answersEnteredObject[propName];
            if (value !== undefined) {
                this.schedulePersistence("Variable.find(gameModel, \"" + varName + "\").getInstance(self).setProperty(\"" + propName + "\", \"" + value + "\");");
            } else {
                this.schedulePersistence("Variable.find(gameModel, \"" + varName + "\").getInstance(self).removeProperty(\"" + propName + "\");");
            }
        },

        // Persists into the descriptor of the Wegas "object" variable.
        saveAnswerKeyProperty: function(propName) {
            var varName = this.answerKeys.get("name"),
                value = this.answerKeysObject[propName];
            if (value !== undefined) {
                this.schedulePersistence("Variable.find(gameModel, \"" + varName + "\").setProperty(\"" + propName + "\", \"" + value + "\");");
            } else {
                this.schedulePersistence("Variable.find(gameModel, \"" + varName + "\").removeProperty(\"" + propName + "\");");
            }
        },

        // Scenarist: persists this.answersEnteredObject as answer keys into descriptor of chosen object.
        saveAnswerKeys: function() {
            if (this.hasEmptyOrInvalidInputs()) {
                return;
            }
            var inputs = this.answersEnteredObject,
                oldAnswerKeys = this.answerKeys.get("properties");
            this.answerKeysObject = {};
            for (var name in inputs) {
                if( inputs.hasOwnProperty(name) ) {
                    if (name !== PROP_VALIDATED &&
                        name !== PROP_ERRORS) {
                        this.answerKeysObject[name] = inputs[name];
                        this.saveAnswerKeyProperty(name);
                        delete oldAnswerKeys[name];
                    }
                }
            }
            // Remove from answer keys any properties that have not been kept :
            for (var name in oldAnswerKeys) {
                if (oldAnswerKeys.hasOwnProperty(name)) {
                    // Save with undefined value:
                    this.saveAnswerKeyProperty(name);
                }
            }
            this.doPersist("Successfully persisted as new answer keys !");
        },


        // Restore spreadsheet from persisted values
        restoreSheet: function() {
            var obj = this.answersEnteredObject,
                tab = this.cb.one(DOT_SHEET_CSS);
            for (var name in obj) {
                if( obj.hasOwnProperty(name) ) {
                    var valeur = obj[name],
                        cell, decimals;
                    cell = tab.one('[name="' + name + '"]');
                    // Skip object properties like "validated" and "errors"
                    if (cell) {
                        if (cell.hasClass("numberinput")) {
                            decimals = +cell.getData().decimals;
                            this.displayNumber(name, valeur, decimals);
                        } else if (cell.hasClass("checkbox")) {
                            if (valeur === "true") {
                                cell.addClass("checked")
                            }
                        }
                    }
                }
            }
        },


        // Affiche le montant donné 
        displayNumber: function(name, valeur, decimals){
            var cell = this.cb.one('[name="' + name + '"]');
            if (!cell) {
                Y.Wegas.Panel.alert("Error: cannot find a cell with name " + name);
                return;
            }
            cell.set('value', (valeur !== undefined) ? I18n.formatNumber(valeur, { decimalPlaces: decimals }) : '');
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
                    label: "Source table (HTML structure of the spreadsheet, read-only)",
                    classFilter: "TextDescriptor"
                }
            },
            // Output: Wegas object variable containing the answers entered by the user:
            answers: {
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                type: "object",
                view: {
                    type: "variableselect",
                    label: "Answers (object where player inputs will be stored)",
                    classFilter: "ObjectDescriptor"
                }
            },
            // Readonly: Wegas object variable containing answers keys:
            answerkeys: {
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                type: "object",
                view: {
                    type: "variableselect",
                    label: "Answer keys (for automatic correction, optional, read-only)",
                    description: "Answer keys must be stored in the descriptor properties.",
                    classFilter: "ObjectDescriptor"
                }
            }
        }
    });
    Y.Wegas.Spreadsheet = Spreadsheet;
},'V1.0', {});
