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

import com.wegas.core.ejb.AbstractFacade;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstanceEntity;
import com.wegas.core.persistence.variable.statemachine.Transition;
import com.wegas.core.script.ScriptEntity;
import com.wegas.core.script.ScriptManager;
import java.util.List;
import javax.ejb.EJB;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class StateMachineInstanceFacade extends AbstractFacade<StateMachineInstanceEntity> {

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

    public void step(StateMachineInstanceEntity entity){
        List<Transition> transitions = entity.getCurrentState().getTransitions();
        for(Transition transition: transitions){
            ScriptEntity script = transition.getTriggerCondition();
            //Get playerId, gameModelId and need an additional evalScript (true|false)
            scriptManager.runScript(Long.MIN_VALUE, Long.MIN_VALUE, script);

        }
    }
}
