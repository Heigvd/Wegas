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

import com.wegas.core.ejb.AbstractFacadeBean;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstanceEntity;
import com.wegas.core.persistence.variable.statemachine.Transition;
import com.wegas.core.script.ScriptEntity;
import com.wegas.core.script.ScriptManager;
import java.util.List;
import javax.ejb.EJB;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.script.ScriptException;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class StateMachineInstanceFacade extends AbstractFacadeBean<StateMachineInstanceEntity> {

    @PersistenceContext(unitName="wegasPU")
    EntityManager em;

    @EJB
    private ScriptManager scriptManager;

    public StateMachineInstanceFacade() {
        super(StateMachineInstanceEntity.class);
    }


    @Override
    protected EntityManager getEntityManager() {
        return this.em;
    }

//    @Override
//    public StateMachineInstanceEntity update(final Long entityId, final StateMachineInstanceEntity entity){
//        StateMachineInstanceEntity oldEntity = this.find(entityId);
//        Long newStateId = entity.getCurrentStateId();
//        StateMachineDescriptorEntity descriptorEntity = (StateMachineDescriptorEntity)entity.getDescriptor();
//        entity.setCurrentState(descriptorEntity.getStates().get(newStateId));
//        oldEntity.merge(entity);
//
//        return entity;
//    }

    public void step(StateMachineInstanceEntity entity) throws ScriptException{
        List<Transition> transitions = entity.getCurrentState().getTransitions();
        for(Transition transition: transitions){
            ScriptEntity script = transition.getTriggerCondition();
            //Get playerId, gameModelId and need an additional evalScript (true|false)
            scriptManager.eval(Long.MIN_VALUE, script);

        }
    }
}
