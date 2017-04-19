/**
 * Some call that Scenario
 */
interface GameModel { }
interface Player { }
/** The current Player */
declare var self: Player;
/** The current gameModel */
declare var gameModel: GameModel;


declare class Variable {
    /**
     * Find a variableDescriptor
     * @param gameModel gameModel container the variable to search for
     * @param name name of the variable to search for (scriptAlias)
     */
    static find(gameModel: GameModel, name: string): any
}
