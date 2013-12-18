/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.exception.NoResultException;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.User;
import com.wegas.core.security.util.SecurityHelper;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authz.UnauthorizedException;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel/{gameModelId : ([1-9][0-9]*)?}/Game/")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class GameController {

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
        Game g = gameFacade.find(entityId);
        SecurityHelper.checkAnyPermission(g, Arrays.asList("View", "Token", "TeamToken"));

        return gameFacade.find(entityId);
    }

    /**
     *
     * @param gameModelId
     * @return
     */
    @GET
    public Collection<Game> index(@PathParam("gameModelId") String gameModelId) {
        final Collection<Game> retGames = new ArrayList<>();
        final Collection<Game> games = (!gameModelId.isEmpty())
                ? gameFacade.findByGameModelId(Long.parseLong(gameModelId), "createdTime ASC")
                : gameFacade.findAll("game.createdTime ASC");

        for (Game g : games) {
            if (SecurityHelper.isPermitted(g, "Edit")) {
                retGames.add(g);
            }
        }
        return retGames;
    }

    /**
     *
     * @param gameModelId
     * @param entity
     * @return
     */
    @POST
    public Game create(@PathParam("gameModelId") Long gameModelId, Game entity) {
        SecurityUtils.getSubject().checkPermission("GameModel:Instantiate:gm" + gameModelId);

        gameFacade.create(gameModelId, entity);
        return entity;
    }

    /**
     * Same as above, but take the parent game model id from a path param
     *
     * @param gameModelId
     * @param entity
     * @return
     */
    @POST
    @Path("{gmId : [1-9][0-9]*}")
    public Game createBis(@PathParam("gmId") Long gameModelId, Game entity) {
        return this.create(gameModelId, entity);
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

        SecurityHelper.checkPermission(gameFacade.find(entityId), "Edit");

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

        Game entity = gameFacade.find(entityId);
        SecurityHelper.checkPermission(entity, "Edit");

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

        if (game.getGameModel().hasProperty(GameModel.PROPERTY.freeForAll)) {   // If game is "freeForAll" (single team)
            if (game.getTeams().isEmpty()) {
                team = new Team("Default");
                teamFacade.create(game.getId(), team);
            } else {
                team = game.getTeams().get(0);                                  // Join the first team available
            }
        }

        try {                                       // We check if logged user is already registered in the target game
            playerFacade.findByGameIdAndUserId(game.getId(), userFacade.getCurrentUser().getId());
            throw new Exception("You are already registered to this game.");    // There user is already registered to target game

        } catch (NoResultException e) {             // If there is no NoResultException, everything is ok, we can return the game

            if (team != null) {
                SecurityHelper.checkAnyPermission(game, Arrays.asList("View", "Token", "TeamToken"));
                return Arrays.asList(team, game);

            } else if (SecurityHelper.isAnyPermitted(game, Arrays.asList("View", "Token"))) {
                return game;

            } else if (SecurityHelper.isPermitted(game, "TeamToken")) {
                return "Team token required";
            } else {
                throw new UnauthorizedException();
            }
        }
    }

    @GET
    @Path("{gameId : [1-9][0-9]*}/KeyJoin/{key : .*}/")
    public Object keyJoinGame(@PathParam("gameId") Long gameId, @PathParam("key") String key) throws Exception {
        Game game = gameFacade.find(gameId);

        try {                                       // We check if logged user is already registered in the target game
            playerFacade.findByGameIdAndUserId(game.getId(), userFacade.getCurrentUser().getId());
            throw new Exception("You are already registered to this game.");    // There user is already registered to target game

        } catch (NoResultException e) {             // If there is no NoResultException, everything is ok, we can return the game
            gameFacade.checkKey(game, key);
            return game;
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
        SecurityHelper.checkAnyPermission(teamFacade.find(teamId).getGame(),
                Arrays.asList("View", "Token", "TeamToken"));                   // Make sure the user can join

        return teamFacade.joinTeam(teamId, userFacade.getCurrentUser().getId()).getGame();
    }

    @POST
    @Path("/JoinTeam/{teamId : .*}/")
    public Game joinTeamByGroup(@PathParam("teamId") Long teamId, List<AbstractAccount> accounts) {
        SecurityHelper.checkAnyPermission(teamFacade.find(teamId).getGame(),
                Arrays.asList("View", "Token", "TeamToken"));                   // Make sure the user can join

        List<User> users = userFacade.findOrCreate(accounts);
        Game g = null;

        for (User user : users) {
            g = teamFacade.joinTeam(teamId, user.getId()).getGame();
        }
        return g;
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

        SecurityHelper.checkAnyPermission(gameFacade.find(gameId), Arrays.asList("View", "Token"));

        Team t = new Team(name);
        this.teamFacade.create(gameId, t);
        //Game g = this.teamFacade.joinTeam(t.getId(), userFacade.getCurrentUser().getId()).getGame();

        return t;
    }
}
