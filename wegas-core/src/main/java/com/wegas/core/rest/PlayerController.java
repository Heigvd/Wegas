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

import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.persistence.game.Player;
import java.util.Collection;
import java.util.logging.Logger;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.Path;
import org.apache.shiro.SecurityUtils;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/Game/{gameId : [1-9][0-9]*}/Team/{teamId : [1-9][0-9]*}/Player")
public class PlayerController extends AbstractRestController<PlayerFacade, Player> {

    private static final Logger logger = Logger.getLogger("Authoring_GM");
    /**
     *
     */
    @EJB
    private PlayerFacade playerFacade;

    @Override
    public Player get(Long entityId) {

        SecurityUtils.getSubject().checkPermission("Game:View:g" + this.getPathParam("gameId"));
        
        return super.get(entityId);
    }
    
    @Override
    public Collection<Player> index() {
        
        SecurityUtils.getSubject().checkPermission("Game:View:g" + this.getPathParam("gameId"));
        
        return super.index();
    }
    /**
     *
     * @param entity
     * @return
     */
    @Override
    public Player create(Player entity) {
        
        SecurityUtils.getSubject().checkPermission("Game:Edit:g" + this.getPathParam("gameId"));
        
        playerFacade.create(new Long(this.getPathParam("teamId")), entity);
        return entity;
    }
    
    @Override
    public Player update(Long entityId, Player entity){
        
        SecurityUtils.getSubject().checkPermission("Game:Edit:g" + this.getPathParam("gameId"));
        
        return super.update(entityId, entity);
    }
    
    @Override
    public Player delete(Long entityId){
        
        SecurityUtils.getSubject().checkPermission("Game:Edit:g" + this.getPathParam("gameId"));
        
        return super.delete(entityId); 
    }

    /**
     *
     * @return
     */
    @Override
    protected PlayerFacade getFacade() {
        return this.playerFacade;
    }
}
