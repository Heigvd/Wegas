/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.AbstractAccount;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.subject.Subject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel")
public class GameModelController extends AbstractRestController<GameModelFacade, GameModel> {

    private static final Logger logger = LoggerFactory.getLogger(GameModelController.class);
    /**
     *
     */
    @EJB
    private GameModelFacade gameModelFacade;
    /**
     *
     */
    @EJB
    private UserFacade userFacade;
    
    @Inject
    private RequestManager requestManager;

    /**
     *
     * @return
     */
    @Override
    protected GameModelFacade getFacade() {
        return gameModelFacade;
    }

    @Override
    public GameModel create(GameModel entity) {
        // logger.info(Level.INFO, "POST GameModel");
        Subject s = SecurityUtils.getSubject();
        s.checkPermission("GameModel:Create");

        GameModel gm = super.create(entity);
        if (gm.getId() != null){
            userFacade.getCurrentUser().getMainAccount().addPermission("GameModel:Edit:gm" + gm.getId());
            userFacade.getCurrentUser().getMainAccount().addPermission("GameModel:View:gm" + gm.getId());
            if (gm.getGames().get(0) != null){
                userFacade.getCurrentUser().getMainAccount().addPermission("Game:Edit:g" + gm.getGames().get(0).getId());
                userFacade.getCurrentUser().getMainAccount().addPermission("Game:View:g" + gm.getGames().get(0).getId());
            }
        }
        
        return gm;
    }
  
    @GET
    @Path("{entityId : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    @Override
    public GameModel get(@PathParam("entityId") Long entityId) {

        SecurityUtils.getSubject().checkPermission("GameModel:View:gm" + entityId);
        
        return super.get(entityId);
    }
  
    @Override
    public GameModel update(Long entityId, GameModel entity) {
        
        SecurityUtils.getSubject().checkPermission("GameModel:Edit:gm" + entityId);
        
        return super.update(entityId, entity);
    }
    
    @Override
    public GameModel duplicate(Long entityId) throws IOException{
        
        SecurityUtils.getSubject().checkPermission("GameModel:Duplicate:gm" + entityId);
        
        return super.duplicate(entityId);
    }
    
    @Override
    public GameModel delete(Long entityId){
        
        SecurityUtils.getSubject().checkPermission("GameModel:Delete:gm" + entityId);

        userFacade.deleteUserPermissionByInstance("gm" + entityId);
        userFacade.deleteAllRolePermissionsById("gm" + entityId);
        
        List<Game> allg = gameModelFacade.find(entityId).getGames();
        for (Game aGame : allg){
            userFacade.deleteUserPermissionByInstance("g" + aGame.getId());
            userFacade.deleteAllRolePermissionsById("g" + aGame.getId());
        }
        
        return super.delete(entityId); 
    }
    
    @Override
    public Collection<GameModel> index() {
        
        Collection<GameModel> allGm = getFacade().findAll();
        Collection<GameModel> newGm = new ArrayList<>(allGm);

//            String r =  (requestManager.getView() == Views.Index.class) ? "View": "Edit";
        for (GameModel aGm : allGm){
            Subject s = SecurityUtils.getSubject();
//            boolean isPermitted = s.isPermitted("GameModel:" + r +":gm" + aGm.getId());
            boolean isPermitted = s.isPermitted("GameModel:View:gm" + aGm.getId());
            if (!isPermitted){
                newGm.remove(aGm);
            }
        }
        return newGm;
    }
}
