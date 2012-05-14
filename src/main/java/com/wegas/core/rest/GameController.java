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

import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.GameEntity;
import com.wegas.core.persistence.game.GameModelEntity;
import java.util.Collection;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.Path;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/Game/")
public class GameController extends AbstractRestController<GameFacade> {

    /**
     *
     */
    @EJB
    private GameModelFacade gameModelEntityFacade;
    /**
     *
     */
    @EJB
    private GameFacade gameFacade;

    @Override
    public Collection<AbstractEntity> index() {
        GameModelEntity gameModel = gameModelEntityFacade.find(new Long(this.getPathParam("gameModelId")));
        return (Collection) gameModel.getGames();
    }

    @Override
    public AbstractEntity create(AbstractEntity entity) {
        this.gameFacade.create(new Long(this.getPathParam("gameModelId")), (GameEntity) entity);
        return entity;
    }

    /**
     *
     * @return
     */
    @Override
    protected GameFacade getFacade() {
        return gameFacade;
    }
}
