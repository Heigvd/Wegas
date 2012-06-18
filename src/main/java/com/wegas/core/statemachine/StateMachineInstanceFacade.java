/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.statemachine;

import com.wegas.core.ejb.AbstractFacadeImpl;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstance;
import com.wegas.core.persistence.variable.statemachine.Transition;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.ejb.ScriptFacade;
import java.util.List;
import javax.ejb.EJB;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.script.ScriptException;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class StateMachineInstanceFacade extends AbstractFacadeImpl<StateMachineInstance> {

    @PersistenceContext(unitName="wegasPU")
    EntityManager em;

    @EJB
    private ScriptFacade scriptManager;

    public StateMachineInstanceFacade() {
        super(StateMachineInstance.class);
    }


    @Override
    protected EntityManager getEntityManager() {
        return this.em;
    }

//    @Override
//    public StateMachineInstance update(final Long entityId, final StateMachineInstance entity){
//        StateMachineInstance oldEntity = this.find(entityId);
//        Long newStateId = entity.getCurrentStateId();
//        StateMachineDescriptorEntity descriptorEntity = (StateMachineDescriptorEntity)entity.getDescriptor();
//        entity.setCurrentState(descriptorEntity.getStates().get(newStateId));
//        oldEntity.merge(entity);
//
//        return entity;
//    }

    public void step(StateMachineInstance entity) throws ScriptException{
        List<Transition> transitions = entity.getCurrentState().getTransitions();
        for(Transition transition: transitions){
            Script script = transition.getTriggerCondition();
            //Get playerId, gameModelId and need an additional evalScript (true|false)
            scriptManager.eval(Long.MIN_VALUE, script);

        }
    }
}
