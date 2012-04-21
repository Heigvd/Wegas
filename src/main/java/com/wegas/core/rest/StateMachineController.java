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

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.VariableInstanceEntity;
import com.wegas.core.persistence.variable.statemachine.StateMachineDescriptorEntity;
import com.wegas.core.statemachine.StateMachineDescriptorFacade;
import com.wegas.crimesim.ejb.MCQDescriptorFacade;
import com.wegas.crimesim.ejb.MCQReplyDescriptorFacade;
import com.wegas.crimesim.persistence.variable.MCQInstanceEntity;
import com.wegas.crimesim.persistence.variable.MCQReplyInstanceEntity;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.Stateless;
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
    /**
     *
     * @return
     */
    @Override
    protected StateMachineDescriptorFacade getFacade() {
        return this.stateMachineDescriptorFacade;
    }

    @Override
    public StateMachineDescriptorEntity create(AbstractEntity entity){
        Long gameModelId = new Long(this.getPathParam("gameModelId"));
        this.stateMachineDescriptorFacade.create(gameModelId, (StateMachineDescriptorEntity) entity);
        return (StateMachineDescriptorEntity) entity;
    }
}
