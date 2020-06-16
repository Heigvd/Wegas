/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.api;

import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.statemachine.DialogueDescriptor;

/**
 *
 * StateMachine related business method
 *
 * @author maxence
 */
public interface StateMachineFacadeI {

    /**
     * Count the number of reply currently available in the currentPlayer
     * instance of the given dialogue descriptor
     *
     * @param dialogueDescriptor
     * @param currentPlayer
     *
     * @return kind of unreadCount
     */
    long countValidTransition(DialogueDescriptor dialogueDescriptor, Player currentPlayer);

}
