/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.statemachine.StateMachineFacade;
import com.wegas.core.exception.client.WegasScriptException;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstance;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor/StateMachine/")
public class StateMachineController {

    /**
     *
     */
    @Inject
    private PlayerFacade playerFacade;
    /**
     *
     */
    @Inject
    private RequestFacade requestFacade;
    /**
     *
     */
    @Inject
    private StateMachineFacade stateMachineFacade;

    /**
     * Transition triggered by players.
     * Dialogues
     *
     * @param gameModelId
     * @param playerId
     * @param stateMachineDescriptorId
     * @param transitionId
     * @return StateMachineInstance
     */
    @GET
    @Path("{stateMachineDescriptorId : [1-9][0-9]*}/Player/{playerId : [1-9][0-9]*}/Do/{transitionId : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public StateMachineInstance doTransition(
            @PathParam("gameModelId") Long gameModelId,
            @PathParam("playerId") Long playerId,
            @PathParam("stateMachineDescriptorId") Long stateMachineDescriptorId,
            @PathParam("transitionId") Long transitionId) throws WegasScriptException {

        Player player = playerFacade.find(playerId);

        final StateMachineInstance stateMachineInstance = stateMachineFacade.doTransition(gameModelId, playerId, stateMachineDescriptorId, transitionId);
        requestFacade.commit(player);
        return stateMachineInstance;
    }
}
