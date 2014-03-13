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
import com.wegas.core.exception.PersistenceException;
import com.wegas.core.exception.WegasException;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameAccountKey;
import com.wegas.core.persistence.game.GameEnrolmentKey;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.jparealm.GameAccount;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.User;
import com.wegas.core.security.util.SecurityHelper;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import org.apache.shiro.SecurityUtils;

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
    public Game create(@PathParam("gameModelId") Long gameModelId, Game entity) throws IOException {
        SecurityUtils.getSubject().checkPermission("GameModel:Instantiate:gm" + gameModelId);

        gameFacade.publishAndCcreate(gameModelId, entity);
        //gameFacade.create(gameModelId, entity);
        return entity;
    }

    @POST
    @Path("ShadowCreate")
    public Game shadowCreate(@PathParam("gameModelId") Long gameModelId, Game entity) throws IOException {
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
    public Game createBis(@PathParam("gmId") Long gameModelId, Game entity) throws IOException {
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
     */
    @GET
    @Path("/JoinGame/{token : .*}/")
    public Object tokenJoinGame(@PathParam("token") String token) throws WegasException {
        Game game = gameFacade.findByToken(token);                              // 1st case: game token
        if (game != null) {
            AbstractAccount account = userFacade.getCurrentUser().getMainAccount();
            if (account instanceof GameAccount) {                               //Logged in with a GameAccount
                GameAccountKey accountKey = gameFacade.findGameAccountKey(((GameAccount) account).getEmail());
                if (accountKey.getGame() == game && !accountKey.getUsed()) {        //Account matches currentGame and key is not used
                    accountKey.setUsed(Boolean.TRUE);
                }
            } else {
                if (game.getAccess() != Game.GameAccess.ENROLMENTKEY) {             // Check game token are authorized on this game
                    return "Team token required";                                   // Return a string indicating the client it should provide an enrolment key (not an error)
                }
            }
        } else {                                                                // 2nd case: single usage enrolement key
            GameEnrolmentKey gameEnrolmentKey = gameFacade.findGameEnrolmentKey(token);// Look the key up
            game = gameEnrolmentKey.getGame();
            if (gameEnrolmentKey.getUsed()) {                                   // Check the token has not already been used
                throw new WegasException("This key has already been used");
            }
            if (game.getAccess() != Game.GameAccess.SINGLEUSAGEENROLMENTKEY) {  // Check single usage enrolement key are authorized on this game
                throw new WegasException("Not allowed to connect using sinle usage enrolment keys");
            }
            gameEnrolmentKey.setUsed(true);                                     // Mark the current key as used
        }

        try {                                                                   // Check if logged user is already registered in the target game
            playerFacade.findByGameIdAndUserId(game.getId(), userFacade.getCurrentUser().getId());
            throw new WegasException("You are already registered to this game.");// Current user is already registered to target game

        } catch (NoResultException e) {                                         // If there is no NoResultException, everything is ok, we can pursue

            SecurityHelper.checkAnyPermission(game, Arrays.asList("View", "Token"));
            if (game.getGameModel().hasProperty(GameModel.PROPERTY.freeForAll)) {// If game is "freeForAll" (single team)
                //if (game.getTeams().isEmpty()) {
                if (game.getTeams().size() <= 1) {                              // Create a team if none present (first team is debug team)
                    teamFacade.create(game.getId(), new Team("Default"));
                }
                Team team = game.getTeams().get(1);                             // Join the first team available
                return Arrays.asList(team, game);
            } else {
                return game;
            }
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
                Arrays.asList("View", "Token"));                                // Make sure the user can join

        return gameFacade.joinTeam(teamId, userFacade.getCurrentUser().getId()).getGame();
    }

    @POST
    @Path("/JoinTeam/{teamId : .*}/")
    public Game joinTeamByGroup(@PathParam("teamId") Long teamId, List<AbstractAccount> accounts) {
        SecurityHelper.checkAnyPermission(teamFacade.find(teamId).getGame(),
                Arrays.asList("View", "Token"));                                // Make sure the user can join

        List<User> users = userFacade.findOrCreate(accounts);
        Game g = null;
        Player p = null;
        StringBuilder r = new StringBuilder();
        r.append("The following users are already part of a team in the same game:");

        for (User user : users) {
            try {
                p = playerFacade.findByGameIdAndUserId(teamFacade.find(teamId).getGame().getId(), user.getId());
                r.append(" - ").append(user.getName()).append(";");
            } catch (PersistenceException e) {   
                // Gotcha
            }
        }
        if (p != null) {
            throw new WegasException(r.toString());
        }
        for (User user : users) {
            g = gameFacade.joinTeam(teamId, user.getId()).getGame();
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

    /**
     *
     * @param entityId
     * @return
     */
    @POST
    @Path("{gameId : [1-9][0-9]*}/CreateGameAccount/{accountNumber : [1-9][0-9]*}")
    public Game createGameAccount(@PathParam("gameId") Long gameId, @PathParam("accountNumber") Long accountNumber) {
        Game g = gameFacade.find(gameId);
        SecurityUtils.getSubject().checkPermission("GameModel:Edit:g" + gameId);
        return gameFacade.createGameAccount(g, accountNumber);
    }
}
