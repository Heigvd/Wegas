/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.wegas.rest;

import com.wegas.ejb.GameModelEntityFacade;
import java.util.logging.Logger;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.Path;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel")
public class GameModelController extends AbstractRestController<GameModelEntityFacade> {

    private static final Logger logger = Logger.getLogger("Authoring_GM");
    
    /**
     * 
     */
    @EJB
    private GameModelEntityFacade gameModelFacade;

    /**
     * 
     * @return
     */
    @Override
    protected GameModelEntityFacade getFacade() {
        return gameModelFacade;
    }
}
