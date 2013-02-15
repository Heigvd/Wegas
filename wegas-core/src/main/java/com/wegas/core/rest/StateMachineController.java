/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.*;
import com.wegas.core.exception.WegasException;
import com.wegas.core.persistence.variable.statemachine.State;
import com.wegas.core.persistence.variable.statemachine.StateMachineDescriptor;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstance;
import com.wegas.core.persistence.variable.statemachine.Transition;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.leaderway.persistence.DialogueTransition;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.script.ScriptException;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authz.UnauthorizedException;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor/StateMachine/")
public class StateMachineController {
    /*
     *
     */

    @EJB
    private VariableDescriptorFacade variableDescriptorFacade;
    @EJB
    private VariableInstanceFacade variableInstanceFacade;
    @EJB
    private ScriptFacade scriptManager;
    @EJB
    private PlayerFacade playerFacade;
    @EJB
    private UserFacade userFacade;
    @Inject
    private RequestManager requestManager;

    /**
     *
     * @param gameModelId
     * @param playerId
     * @param stateMachineDescriptorId
     * @param transitionId
     * @return StateMachineInstance
     * @throws ScriptException
     * @throws WegasException
     */
    @GET
    @Path("{stateMachineDescriptorId : [1-9][0-9]*}/Player/{playerId : [1-9][0-9]*}/Do/{transitionId : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public StateMachineInstance doTransition(
            @PathParam("gameModelId") Long gameModelId,
            @PathParam("playerId") Long playerId,
            @PathParam("stateMachineDescriptorId") Long stateMachineDescriptorId,
            @PathParam("transitionId") Long transitionId)
            throws ScriptException, WegasException {

        checkPermissions(playerFacade.find(playerId).getGame().getId(), playerId);

        StateMachineDescriptor stateMachineDescriptor =
                (StateMachineDescriptor) variableDescriptorFacade.find(stateMachineDescriptorId);
        StateMachineInstance stateMachineInstance = stateMachineDescriptor.getInstance(playerFacade.find(playerId));
        State currentState = stateMachineInstance.getCurrentState();
        List<Transition> transitions = currentState.getTransitions();

        for (Transition transition : transitions) {
            if (transition instanceof DialogueTransition && transition.getId().equals(transitionId)) {
                //TODO : eval attached script (AND)
                stateMachineInstance.setCurrentStateId(transition.getNextStateId());
                stateMachineInstance.transitionHistoryAdd(transitionId);
                requestManager.addUpdatedInstance(stateMachineInstance);  /*
                 * Force in case next state == current state
                 */
                if (stateMachineInstance.getCurrentState().getOnEnterEvent() != null) {
                    scriptManager.eval(playerId, stateMachineInstance.getCurrentState().getOnEnterEvent());
                }
                break;
            }
        }
        return (StateMachineInstance) variableInstanceFacade.update(stateMachineInstance.getId(), stateMachineInstance);
    }

    private void checkPermissions(Long gameId, Long playerId) throws UnauthorizedException {
        if (!SecurityUtils.getSubject().isPermitted("Game:Edit:g" + gameId) && !userFacade.matchCurrentUser(playerId)) {
            throw new UnauthorizedException();
        }
    }
}
