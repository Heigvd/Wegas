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

import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.ejb.exception.PersistenceException;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.security.ejb.RoleFacade;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.Role;
import java.util.ArrayList;
import java.util.Collection;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ejb.TransactionAttribute;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.subject.Subject;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/Game/")
public class GameController extends AbstractRestController<GameFacade, Game> {

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
    /**
     *
     */
    @EJB
    private UserFacade userFacade;
    /**
     *
     */
    @EJB
    private TeamFacade teamFacade;
    /**
     *
     */
    @EJB
    private PlayerFacade playerFacade;
    
    /**
     * 
     */
    @EJB
    private RoleFacade roleFacade;

    @GET
    @Path("{entityId : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    @Override
    public Game get(@PathParam("entityId") Long entityId) {
        
        Subject s = SecurityUtils.getSubject();
        s.checkPermission("Game:View:g" + entityId);
        
        return super.get(entityId);
    }
    
    /**
     *
     * @return
     */
    @Override
    public Collection<Game> index() {        
        GameModel gameModel = gameModelEntityFacade.find(new Long(this.getPathParam("gameModelId")));
        Collection<Game> game = new ArrayList<>(gameModel.getGames());
        
        for (Game aG : gameModel.getGames()){
            Subject s = SecurityUtils.getSubject();
            boolean isPermitted = s.isPermitted("Game:View:g" + aG.getId());
            if (!isPermitted){
                game.remove(aG);
            }
        }
        return game;
        //return gameModel.getGames();
    }

    @Override
    public Game create(Game entity) {
        
        Subject s = SecurityUtils.getSubject();
        s.checkPermission("Game:Create");
        
        this.gameFacade.create(new Long(this.getPathParam("gameModelId")), entity);
        return entity;
    }

    @Override
    public Game update(Long entityId, Game entity){
        
        Subject s = SecurityUtils.getSubject();
        s.checkPermission("Game:Edit:g" + entityId);
        
        return super.update(entityId, entity);
    }
    
    @Override
    public Game delete(Long entityId){
        
        Subject s = SecurityUtils.getSubject();
        s.checkPermission("Game:Edit:g" + entityId);
        
        return super.delete(entityId);
    }
    /**
     * This method process a string token. It checks if the given token
     * corresponds to a game and then to a team, and return the corresponding
     * result.
     *
     * @param token
     * @return
     */
    @GET
    @Path("/JoinGame/{token : .*}/")
    @Produces(MediaType.APPLICATION_JSON)
    @TransactionAttribute()
    public Object tokenJoinGame(@PathParam("token") String token) throws Exception {
        Game game = null;
        Team team = null;
        try {
            team = teamFacade.findByToken(token);                               // we try to lookup for a team entity.
            game = team.getGame();
        } catch (PersistenceException e2) {
            try {
                game = gameFacade.findByToken(token);                           // We check if there is game with given token
            } catch (PersistenceException e) {
                throw new Exception("Could not find any game associated with this token.");
            }
        }
        try {                                                                   // We check if logged user is already registered in the target game
            playerFacade.findByGameIdAndUserId(
                    game.getId(), userFacade.getCurrentUser().getId());
            throw new Exception("You are already registered to this game.");    // There user is already registered to target game
        } catch (PersistenceException e) {                                        // If there is no NoResultException, everything is ok, we can return the game
            
            Subject s = SecurityUtils.getSubject();
            s.checkPermission("Game:Token:g"+game.getId());
                
            return (team != null) ? team : game;
        }
    }

    @GET
    @Path("/JoinTeam/{teamId : .*}/")
    @Produces(MediaType.APPLICATION_JSON)
    public Game joinTeam(@PathParam("teamId") Long teamId) {
        Game g = teamFacade.joinTeam(teamId, userFacade.getCurrentUser().getId()).getGame();
        addRights(g);
        return g;
    }

    @GET
    @Path("/CreateTeam/{name : .*}/")
    @Produces(MediaType.APPLICATION_JSON)
    public Game createTeam(@PathParam("gameId") Long gameId, @PathParam("name") String name) {
        Team t = new Team(name);
        this.teamFacade.create(new Long(this.getPathParam("gameId")), new Team(name));
        Game g = this.teamFacade.joinTeam(t.getId(), userFacade.getCurrentUser().getId()).getGame();
        addRights(g);
        return g;
    }

    /**
     *
     * @return
     */
    @Override
    protected GameFacade getFacade() {
        return gameFacade;
    }
    
    private void addRights(Game game){
        Subject s = SecurityUtils.getSubject();
        boolean gExist = s.isPermitted("Game:View:g" + game.getId());
        boolean gmExist = s.isPermitted("GameModel:View:gm" + game.getGameModel().getId());
            
        if (!gExist){
            userFacade.getCurrentUser().getMainAccount().getPermissions().add("Game:View:g"+game.getId());
        }
        if (!gmExist){
            userFacade.getCurrentUser().getMainAccount().getPermissions().add("GameModel:View:gm"+game.getGameModel().getId());
        }
    }
}
