/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2011 
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.GameEntityFacade;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.Path;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/Game/")
public class GameController extends AbstractRestController<GameEntityFacade> {

    /**
     *
     */
    @EJB
    private GameEntityFacade gameFacade;

    /**
     *
     * @return
     */
    @Override
    protected GameEntityFacade getFacade() {
        return gameFacade;
    }
}
