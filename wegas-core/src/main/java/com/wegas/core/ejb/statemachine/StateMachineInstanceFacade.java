/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb.statemachine;

import com.wegas.core.ejb.AbstractFacadeImpl;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstance;
import com.wegas.core.persistence.variable.statemachine.Transition;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.ejb.ScriptFacade;
import com.wegas.core.exception.WegasException;
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

    /**
     *
     */
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

    /**
     *
     * @param entity
     * @throws ScriptException
     * @throws WegasException
     */
    public void step(StateMachineInstance entity) throws ScriptException, WegasException{
        List<Transition> transitions = entity.getCurrentState().getTransitions();
        for(Transition transition: transitions){
            Script script = transition.getTriggerCondition();
            //Get playerId, gameModelId and need an additional evalScript (true|false)
            scriptManager.eval(Long.MIN_VALUE, script);

        }
    }
}
