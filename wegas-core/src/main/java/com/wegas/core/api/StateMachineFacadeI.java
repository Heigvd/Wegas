/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.api;

import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.statemachine.DialogueDescriptor;

/**
 *
 * @author maxence
 */
public interface StateMachineFacadeI {

    
    long countValidTransition(DialogueDescriptor dialogueDescriptor, Player currentPlayer);

}
