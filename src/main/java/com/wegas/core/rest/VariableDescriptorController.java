/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.GameModelEntity;
import com.wegas.core.persistence.variable.VariableDescriptorEntity;
import java.util.Collection;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor")
public class VariableDescriptorController extends AbstractRestController<VariableDescriptorFacade> {

    private static final Logger logger = LoggerFactory.getLogger(VariableDescriptorController.class);;
    /**
     *
     */
    @EJB
    private VariableDescriptorFacade variableDescriptorFacade;
    /**
     *
     */
    @EJB
    private GameModelFacade gameModelFacade;

    /**
     *
     * @return
     */
    @Override
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Collection<AbstractEntity> index() {
        Long gameModelId = this.getGameModelId();
        GameModelEntity gameModel = gameModelFacade.find(gameModelId);
        return (Collection) gameModel.getRootVariableDescriptors();
    }

    @Override
    public AbstractEntity create(AbstractEntity entity) {
        this.variableDescriptorFacade.create(new Long(this.getPathParam("gameModelId")),
                (VariableDescriptorEntity) entity);
        return entity;
    }

    /**
     * Resets all the variables of a given game model
     *
     * @param gameModelId game model id
     * @return OK
     */
    @GET
    @Path("reset")
    @Produces(MediaType.APPLICATION_JSON)
    public Collection<VariableDescriptorEntity> reset(
            @PathParam("gameModelId") Long gameModelId) {
        return gameModelFacade.reset(gameModelId).getVariableDescriptors();
    }

    private Long getGameModelId() {
        return new Long(this.getPathParam("gameModelId"));
    }

    /**
     *
     * @return
     */
    @Override
    protected VariableDescriptorFacade getFacade() {
        return this.variableDescriptorFacade;
    }
}
