/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 * @author Benjamin Gerber ger.benjamin@gmail.com
 */
YUI.add("wegas-book-fight", function(Y) {
    "use strict";

    var CONTENTBOX = "contentBox", Fight;

    Fight = Y.Base.create("wegas-book-fight", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        handlers: new Array(),
        dice: null,
        opponentStamina: 0,
        opponentCombatSkill: 0,
        success: null,
        failure: null,
        alternative: null,
        doFight: function(e) {
            var combatSkill = Y.Wegas.Facade.VariableDescriptor.cache.find("name", "combatSkill"),
                    stamina = Y.Wegas.Facade.VariableDescriptor.cache.find("name", "stamina").
                    getInstance().get("value"),
                    damageGiven, damageTaken, handicap,
                    diceValue = e.target.result;
            handicap = combatSkill.getInstance().
                    get("value") - this.opponentCombatSkill;
            if (handicap < -10)
                handicap = -10;
            if (handicap > 10)
                handicap = 10;
            switch (diceValue) {
                case 1 :
                    damageGiven = 0;
                    damageTaken = ((handicap < 0) ? Math.abs(handicap) : 0) + 2;
                    break;
                case 2 :
                    damageGiven = Math.floor(((handicap > 0) ? handicap : 0) / 5);
                    damageTaken = Math.ceil(((handicap < 0) ? Math.abs(handicap) : 0) / 2) + 1;
                    break;
                case 3 :
                    damageGiven = Math.floor(((handicap > 0) ? handicap : 0) / 4);
                    damageTaken = Math.ceil(((handicap < 0) ? Math.abs(handicap) : 0) / 3) + 1;
                    break;
                case 4 :
                    damageGiven = Math.ceil(((handicap > 0) ? handicap : 0) / 3) + 1;
                    damageTaken = Math.floor(((handicap < 0) ? Math.abs(handicap) : 0) / 4);
                    break;
                case 5 :
                    damageGiven = Math.ceil(((handicap > 0) ? handicap : 0) / 2) + 1;
                    damageTaken = Math.floor(((handicap < 0) ? Math.abs(handicap) : 0) / 5);
                    break;
                case 6 :
                    damageGiven = ((handicap > 0) ? handicap : 0) + 2;
                    damageTaken = 0;
                    break;
            }
            this.opponentStamina -= damageGiven;
            stamina -= damageTaken;
            if (this.opponentStamina <= 0) {
                this.opponentStamina = 0;
                this.doBattleResult(true);
            } else if (stamina <= 0) {
                stamina = 0;
                this.doBattleResult(false);
            } else {
                this.dice.rollButton.enable();
            }
            this.setStamina(stamina);
            this.syncUI();
        },
        setStamina: function(stamina) {
            if (typeof stamina !== "number")
                return;
            Y.Wegas.Facade.VariableDescriptor.sendRequest({
                request: "/Script/Run/" + Y.Wegas.app.get('currentPlayer'),
                headers: {
                    'Content-Type': 'application/json; charset=ISO-8859-1',
                    'Managed-Mode': 'true'
                },
                cfg: {
                    method: "POST",
                    data: Y.JSON.stringify({
                        "@class": "Script",
                        "language": "JavaScript",
                        "content": "importPackage(com.wegas.core.script);\nstamina.value =" + stamina + ";"
                    })
                }
            });
        },
        doBattleResult: function(success) {
            var cb = this.get(CONTENTBOX);
            if (success) {
                if (this.success)
                    this.success.render(cb.one(".result"));
            } else {
                if (this.failure)
                    this.failure.render(cb.one(".result"));
            }
        },
        displayOpponentState: function(cb) {
            cb.one(".opponent .stamina .value").setHTML(this.opponentStamina);
            cb.one(".opponent .combatSkill .value").
                    setHTML(this.opponentCombatSkill);
        },
        initializer: function() {
            this.dice = new Y.Wegas.Dice({
                label: "Combattre",
                animated: "true"
            });
            if (this.get("success")) {
                this.success = new Y.Wegas.List({
                    "label": "success",
                    "cssClass": "success-list",
                    "children": this.get("success")
                });
            }
            if (this.get("failure")) {
                this.failure = new Y.Wegas.List({
                    "label": "failure",
                    "cssClass": "failure-list",
                    "children": this.get("failure")
                });
            }
            if (this.get("alternative")) {
                this.alternative = new Y.Wegas.List({
                    "label": "alternative",
                    "cssClass": "alternative-list",
                    "children": this.get("alternative")
                });
            }
            this.opponentStamina = this.get("stamina");
            this.opponentCombatSkill = this.get("combatSkill");
        },
        renderUI: function() {
            var cb = this.get(CONTENTBOX), opponement;
            opponement = Y.Node.create("<div class='opponent'></div>");
            opponement.append("<div class='name'></div>").
                    append("<div class='stamina'></div>").
                    append("<div class='combatSkill'></div>");
            opponement.one(".stamina").append("<div class='label'></div>").
                    append("<div class='value'></div>");
            opponement.one(".combatSkill").append("<div class='label'></div>").
                    append("<div class='value'></div>");
            opponement.one(".stamina .label").
                    setHTML(this.get("staminaLabel"));
            opponement.one(".combatSkill .label").
                    setHTML(this.get("combatSkillLabel"));
            opponement.one(".name").setHTML(this.get("name"));
            cb.append(opponement);
            cb.append("<div class='dice'></div>");
            cb.append("<div class='result'></div>");
            cb.append("<div class='alternative'></div>");
            this.dice.render(cb.one(".dice"));
            if (this.alternative)
                this.alternative.render(cb.one(".alternative"));
        },
        bindUI: function() {
            this.dice.after("diceRolling", function() {
                this.dice.rollButton.disable();
            }, this);
            this.dice.after("diceRolled", this.doFight, this);
        },
        syncUI: function() {
            var cb = this.get(CONTENTBOX);
            this.displayOpponentState(cb);
        },
        destructor: function() {
            var i;
            for (i = 0; i < this.handlers.length; i++) {
                this.handlers[i].detach();
            }
            if (this.dice)
                this.dice.destroy();
            if (this.success)
                this.success.destroy();
            if (this.failure)
                this.failure.destroy();
            if (this.alternative)
                this.alternative.destroy();
        }

    }, {
        ATTRS: {
            name: {
                type: "string",
                value: "unknown"
            },
            staminaLabel: {
                type: "string",
                value: "Stamina: "
            },
            stamina: {
                type: "number",
                value: 1
            },
            combatSkillLabel: {
                type: "string",
                value: "Combat skill: "
            },
            combatSkill: {
                type: "number",
                value: 1
            },
            success: {
                validator: Y.Lang.isArray
            },
            failure: {
                validator: Y.Lang.isArray
            },
            alternative: {
                validator: Y.Lang.isArray
            }
        }
    });

    Y.namespace("Wegas").Fight = Fight;
});