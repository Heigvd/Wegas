/// <reference lib="es5"/>

/* global gameModel, self, Variable, Log, ErrorManager */

// Types used accross this file
/**
 * @typedef MapItem
 * @property {string} id
 * @property {number} x
 * @property {number} y
 * @property {(1|2|3|4)=} direction
 * @property {boolean=} collides
 * @property {string} components
 * @property {boolean=} open Door is open
 *
 * @typedef LevelPage ProgGame level
 * @property {string} `@pageId` Level's id
 * @property {"ProgGameLevel"} type
 * @property {string} label
 * @property {string} intro
 * @property {{x:0, y:0|1}[][]} map Matrix of {x, y} where
 * - y = 1 means a path
 * - x is unused (history...)
 * @property {MapItem[]} objects
 * @property {string[]} api
 * @property {string} winningCondition
 * @property {string} onStart
 * @property {string} onAction
 * @property {string | number} onWin
 * @property {string} defaultCode
 * @property {number} maxTurns
 *
 * @typedef Configuration
 * @property {boolean} debug
 * @property {boolean} callLine
 * @property {unknown[]} breakpoints
 * @property {unknown[]} watches
 * @property {number} startStep
 * @property {number} targetStep
 * @property {boolean} recordCommands
 */

/* exported Action*/
var Action = {
    init: function() {
        Log.post([
            Log.statement('initialized', 'proggame'),
            Log.statement(
                'initialized',
                'level',
                Variable.find(gameModel, 'currentLevel').getValue(self)
            ),
        ]);
    },
    /**
     *
     * @param {number | string} level
     */
    changeLevel: function(level) {
        /**
         * @type {com.wegas.core.persistence.variable.primitive.NumberDescriptor}
         */
        var currentLevelDesc = Variable.find(gameModel, 'currentLevel');
        var curValue = currentLevelDesc.getValue(self);
        var maxValue = Math.min(
            Variable.find(gameModel, 'maxLevel').getValue(self),
            Variable.find(gameModel, 'levelLimit').getValue(self)
        );
        if (Number(level) <= maxValue) {
            currentLevelDesc.setValue(self, Number(level));
            if (curValue != currentLevelDesc.getValue(self)) {
                Log.post(Log.statement('initialized', 'level', level));
            }
        } else {
            ErrorManager.throwWarn(
                'Vous ne pouvez pas encore aller à ce niveau'
            );
        }
    },
    /**
     * @param {number} level
     */
    completeLevel: function(level) {
        var maxLevel = Variable.find(gameModel, 'maxLevel');
        var currentLevel = Variable.find(gameModel, 'currentLevel');
        var lvlCfg = JSON.parse(gameModel.getPages()[String(level)]);
        var nextLevel = lvlCfg.onWin;
        var r;
        if (
            typeof lvlCfg.onWin === 'string' &&
            (r = lvlCfg.onWin.match(
                /Variable.find\(gameModel, "currentLevel"\).setValue\(self, (\d+)\)/
            ))
        ) {
            nextLevel = Number(r[1]);
        }
        if (maxLevel.getValue(self) <= currentLevel.getValue(self)) {
            Variable.find(gameModel, 'money').add(self, 100);
        }
        maxLevel.setValue(
            self,
            Math.max(maxLevel.getValue(self), Number(nextLevel))
        );
    },
};
