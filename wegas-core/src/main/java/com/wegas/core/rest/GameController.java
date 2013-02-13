/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.exception.NoResultException;
import com.wegas.core.exception.WegasException;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.security.ejb.UserFacade;
import java.util.ArrayList;
import java.util.Collection;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ejb.TransactionAttribute;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authz.UnauthorizedException;
import org.apache.shiro.subject.Subject;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/Game/")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class GameController {

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
     * @param entityId
     * @return
     */
    @GET
    @Path("{entityId : [1-9][0-9]*}")
    public Game find(@PathParam("entityId") Long entityId) {

        SecurityUtils.getSubject().checkPermission("Game:View:g" + entityId);

        return gameFacade.find(entityId);
    }

    /**
     *
     * @param gameModelId
     * @return
     */
    @GET
    public Collection<Game> index(@PathParam("gameModelId") Long gameModelId) {
        Collection<Game> games = new ArrayList<>();
        Subject s = SecurityUtils.getSubject();

        for (Game g : gameModelEntityFacade.find(gameModelId).getGames()) {
            if (s.isPermitted("Game:Edit:g" + g.getId())) {
                games.add(g);
            }
        }
        return games;
    }

    /**
     *
     * @param gameModelId
     * @param entity
     * @return
     */
    @POST
    public Game create(@PathParam("gameModelId") Long gameModelId, Game entity) {

        SecurityUtils.getSubject().checkPermission("Game:Create");

        this.gameFacade.create(gameModelId, entity);
        return entity;
    }

    /**
     *
     * @param entityId
     * @param entity
     * @return
     */
    @PUT
    @Path("{entityId: [1-9][0-9]*}")
    public Game update(@PathParam("entityId") Long entityId, Game entity) {

        SecurityUtils.getSubject().checkPermission("Game:Edit:g" + entityId);

        return gameFacade.update(entityId, entity);
    }

    /**
     *
     * @param entityId
     * @return
     */
    @DELETE
    @Path("{entityId: [1-9][0-9]*}")
    public Game delete(@PathParam("entityId") Long entityId) {

        SecurityUtils.getSubject().checkPermission("Game:Edit:g" + entityId);

        Game entity = gameFacade.find(entityId);
        gameFacade.remove(entity);
        return entity;
    }

    /**
     * This method process a string token. It checks if the given token
     * corresponds to a game and then to a team, and return the corresponding
     * result.
     *
     * @param token
     * @return
     * @throws Exception
     */
    @GET
    @Path("/JoinGame/{token : .*}/")
    public Object tokenJoinGame(@PathParam("token") String token) throws Exception {
        Game game = gameFacade.findByToken(token);
        Team team = null;
        if (game == null) {                                                     // We check if there is game with given token
            team = teamFacade.findByToken(token);                               // we try to lookup for a team entity.
            if (team == null) {
                throw new WegasException("Could not find any game associated with this token.");
            }
            game = team.getGame();
        }

        try {                                       // We check if logged user is already registered in the target game
            playerFacade.findByGameIdAndUserId(game.getId(), userFacade.getCurrentUser().getId());
            throw new Exception("You are already registered to this game.");    // There user is already registered to target game

        } catch (NoResultException e) {             // If there is no NoResultException, everything is ok, we can return the game
            SecurityUtils.getSubject().checkPermission("Game:Token:g" + game.getId());
            return (team != null) ? team : game;
        }
    }

    /**
     *
     * @param teamId
     * @return
     */
    @GET
    @Path("/JoinTeam/{teamId : .*}/")
    public Game joinTeam(@PathParam("teamId") Long teamId) {
        checkPermissions(teamFacade.find(teamId).getGame().getId());
        return teamFacade.joinTeam(teamId, userFacade.getCurrentUser().getId()).getGame();
    }

    /**
     *
     * @param gameId
     * @param name
     * @return
     */
    @POST
    @Path("{gameId : .*}/CreateTeam/{name : .*}/")
    public Team createTeam(@PathParam("gameId") Long gameId, @PathParam("name") String name) {
        checkPermissions(gameId);
        Team t = new Team(name);
        this.teamFacade.create(gameId, t);
        //Game g = this.teamFacade.joinTeam(t.getId(), userFacade.getCurrentUser().getId()).getGame();

        return t;
    }

    private void checkPermissions(Long id) throws UnauthorizedException {
        if (!SecurityUtils.getSubject().isPermitted("Game:Token:g" + id) && !SecurityUtils.getSubject().isPermitted("Game:View:g" + id)) {
            throw new UnauthorizedException();
        }
    }
}
