/*
 * Wegas.
 *
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.persistence.variable.statemachine.State;
import com.wegas.core.persistence.variable.statemachine.StateMachineDescriptor;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstance;
import com.wegas.core.persistence.variable.statemachine.Transition;
import com.wegas.core.ejb.ScriptFacade;
import com.wegas.core.statemachine.StateMachineDescriptorFacade;
import java.util.ArrayList;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.script.ScriptException;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor/StateMachine/")
public class StateMachineController extends AbstractRestController<StateMachineDescriptorFacade> {
    /*
     *
     */

    @EJB
    private StateMachineDescriptorFacade stateMachineDescriptorFacade;
    @EJB
    private VariableInstanceFacade variableInstanceFacade;
    @EJB
    private ScriptFacade scriptManager;
    @EJB
    private PlayerFacade playerFacade;

    /**
     *
     * @return
     */
    @Override
    protected StateMachineDescriptorFacade getFacade() {
        return this.stateMachineDescriptorFacade;
    }

//    @Override
//    public StateMachineDescriptor create(AbstractEntity entity) {
//        Long gameModelId = new Long(this.getPathParam("gameModelId"));
//        this.stateMachineDescriptorFacade.create(gameModelId, (StateMachineDescriptor) entity);
//        return (StateMachineDescriptor) entity;
//    }

    /**
     *
     * @param gameModelId
     * @param playerId
     * @param stateMachineDescriptorId
     * @return
     * @throws ScriptException
     */
    @GET
    @Path("{stateMachineDescriptorId : [1-9][0-9]*}/Player/{playerId : [1-9][0-9]*}/Step")
    @Produces(MediaType.APPLICATION_JSON)
    public StateMachineDescriptor step(
            @PathParam("gameModelId") Long gameModelId,
            @PathParam("playerId") Long playerId, @PathParam("stateMachineDescriptorId") Long stateMachineDescriptorId)
            throws ScriptException {
        StateMachineDescriptor stateMachineDescriptorEntity = (StateMachineDescriptor) stateMachineDescriptorFacade.find(stateMachineDescriptorId);
        StateMachineInstance stateMachineInstanceEntity = (StateMachineInstance) stateMachineDescriptorEntity.getInstance(playerFacade.find(playerId));
        State currentState = stateMachineInstanceEntity.getCurrentState();
        List<Transition> transitions = currentState.getTransitions();
        List<Transition> passedTransitions = new ArrayList<>();
        for (Transition transition : transitions) {
            if ((Boolean) scriptManager.eval(playerId, transition.getTriggerCondition())) {
                stateMachineInstanceEntity.setCurrentStateId(transition.getNextStateId());
                if (stateMachineInstanceEntity.getCurrentState().getOnEnterEvent() != null) {
                    scriptManager.eval(playerId, stateMachineInstanceEntity.getCurrentState().getOnEnterEvent());
                }
                break;                                                          //A valid transition was found
            }
        }
        variableInstanceFacade.update(stateMachineInstanceEntity.getId(), stateMachineInstanceEntity);
        return stateMachineDescriptorEntity;
    }
}
