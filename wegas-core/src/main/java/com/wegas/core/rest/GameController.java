/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

package com.wegas.core.rest;

import com.wegas.core.Helper;
import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameEnrolmentKey;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.User;
import com.wegas.core.security.util.SecurityHelper;
import org.apache.shiro.SecurityUtils;

import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;

/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel/{gameModelId : ([1-9][0-9]*)?}{sep: /?}Game/")
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
     * @param gameModelId
     * @return
     */
    @GET
    public Collection<Game> index(@PathParam("gameModelId") String gameModelId) {
        final Collection<Game> retGames = new ArrayList<>();
        final Collection<Game> games = (!gameModelId.isEmpty())
            ? gameFacade.findByGameModelId(Long.parseLong(gameModelId), "createdTime ASC")
            : gameFacade.findAll(Game.Status.LIVE);

        for (Game g : games) {
            if (SecurityHelper.isPermitted(g, "Edit")) {
                retGames.add(g);
            }
        }
        return retGames;
    }

    /**
     * @param gameModelId
     * @param entity
     * @return
     * @throws IOException
     */
    @POST
    public Game create(@PathParam("gameModelId") Long gameModelId, Game entity) throws IOException {
        SecurityUtils.getSubject().checkPermission("GameModel:Instantiate:gm" + gameModelId);

        gameFacade.publishAndCreate(gameModelId, entity);
        //gameFacade.create(gameModelId, entity);
        return entity;
    }

    /**
     * @param gameModelId
     * @param entity
     * @return
     * @throws IOException
     */
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
     * @throws IOException
     */
    @POST
    @Path("{gmId : [1-9][0-9]*}")
    public Game createBis(@PathParam("gmId") Long gameModelId, Game entity) throws IOException {
        return this.create(gameModelId, entity);
    }

    /**
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

    @PUT
    @Path("{entityId: [1-9][0-9]*}/status/{status: [A-Z]*}")
    public Game changeStatus(@PathParam("entityId") Long entityId, @PathParam("status") final Game.Status status) {
        Game game = gameFacade.find(entityId);
        SecurityHelper.checkPermission(game, "Edit");
        switch (status) {
            case LIVE:
                gameFacade.live(game);
                break;
            case BIN:
                gameFacade.bin(game);
                break;
            case DELETE:
                gameFacade.delete(game);
                break;
        }
        return game;
    }

    @GET
    @Path("status/{status: [A-Z]*}")
    public Collection<Game> findByStatus(@PathParam("status") final Game.Status status) {
        final Collection<Game> retGames = new ArrayList<>();
        final Collection<Game> games = gameFacade.findAll(status);
        for (Game g : games) {
            if (SecurityHelper.isPermitted(g, "Edit")) {
                retGames.add(g);
            }
        }
        return retGames;
    }
    
    @GET
    @Path("status/{status: [A-Z]*}/count")
    public int countByStatus(@PathParam("status") final Game.Status status) {
        final Collection<Game> retGames = new ArrayList<>();
        final Collection<Game> games = gameFacade.findAll(status);
        for (Game g : games) {
            if (SecurityHelper.isPermitted(g, "Edit")) {
                retGames.add(g);
            }
        }
        return retGames.size();
    }


    /**
     * @param entityId
     * @return
     */
    @DELETE
    @Path("{entityId: [1-9][0-9]*}")
    public Game delete(@PathParam("entityId") Long entityId) {
        Game entity = gameFacade.find(entityId);
        SecurityHelper.checkPermission(entity, "Edit");
        switch (entity.getStatus()) {
            case LIVE:
                gameFacade.bin(entity);
                break;
            case BIN:
                gameFacade.delete(entity);
                break;
        }
//      gameFacade.remove(entity);
        return entity;
    }

    @DELETE
    public Collection<Game> deleteAll() {
        final Collection<Game> retGames = new ArrayList<>();
        final Collection<Game> games = gameFacade.findAll(Game.Status.BIN);
        for (Game g : games) {
            if (SecurityHelper.isPermitted(g, "Edit")) {
                gameFacade.delete(g);
                retGames.add(g);
            }
        }
        return retGames;
    }

    /**
     * Check if a user is logged,
     * Find a game by it's token and check if this game has an open access,
     * Check if current user is already a player for this game,
     * Check if the game is played individually,
     * Create a new team with a new player linked on the current user for the game found.
     *
     * @param token
     * @return
     */
    @GET
    @Path("/JoinGame/{token : .*}/")
    @Deprecated
    public Response tokenJoinGame(@PathParam("token") String token) throws WegasNoResultException {
        Response r = Response.status(Response.Status.UNAUTHORIZED).build();
        User currentUser = userFacade.getCurrentUser();
        if (currentUser != null) {
            r = Response.status(Response.Status.BAD_REQUEST).build();
            Game game = gameFacade.findByToken(token);
            if (game != null) {
                r = Response.status(Response.Status.CONFLICT).build();
                if (game.getAccess() == Game.GameAccess.OPEN) {
                    Player player = playerFacade.checkExistingPlayer(game.getId(), currentUser.getId());
                    if (player == null) {
                        SecurityHelper.checkAnyPermission(game, Arrays.asList("View", "Token"));
                        if (game.getGameModel().getProperties().getFreeForAll()) {
                            Team team = new Team("Team-" + Helper.genToken(20));
                            teamFacade.create(game.getId(), team);
                            gameFacade.joinTeam(team.getId(), currentUser.getId());
                            r = Response.status(Response.Status.CREATED).entity(Arrays.asList(team, game)).build();
                        }
                    }
                }
            }
        }
        return r;
    }
    
    /**
     * Check if a user is logged,
     * Find a game by id and check if this game has an open access,
     * Check if current user is already a player for this game,
     * Check if the game is played individually,
     * Create a new team with a new player linked on the current user for the game found.
     *
     * @param gameId
     * @return Response
     */
    @POST
    @Path("{id}/Player")
    public Response joinIndividually(@PathParam("id") Long gameId) throws WegasNoResultException {
        Response r = Response.status(Response.Status.UNAUTHORIZED).build();
        User currentUser = userFacade.getCurrentUser();
        if (currentUser != null) {
            r = Response.status(Response.Status.BAD_REQUEST).build();
            Game game = gameFacade.find(gameId);
            if (game != null) {
                r = Response.status(Response.Status.CONFLICT).build();
                if (game.getAccess() == Game.GameAccess.OPEN) {
                    Player player = playerFacade.checkExistingPlayer(game.getId(), currentUser.getId());
                    if (player == null) {
                        if (game.getGameModel().getProperties().getFreeForAll()) {
                            Team team = new Team("Individually-" + Helper.genToken(20));
                            teamFacade.create(game.getId(), team);
                            playerFacade.create(team, currentUser);
                            r = Response.status(Response.Status.CREATED).entity(team).build();
                        }
                    }
                }
            }
        }
        return r;
    }

    /**
     * @param teamId
     * @return
     */
    @GET
    @Path("/JoinTeam/{teamId : .*}/")
    @Deprecated
    public Game joinTeam(@PathParam("teamId") Long teamId) {

        // IN USE
        SecurityHelper.checkAnyPermission(teamFacade.find(teamId).getGame(),
            Arrays.asList("View", "Token"));                                // Make sure the user can join
        return gameFacade.joinTeam(teamId, userFacade.getCurrentUser().getId()).getGame();
    }

    /**
     * @param teamId
     * @param accounts
     * @return
     */
    @POST
    @Path("/JoinTeam/{teamId : .*}/")
    @Deprecated
    public Game joinTeamByGroup(@PathParam("teamId") Long teamId, List<AbstractAccount> accounts) {
        SecurityHelper.checkAnyPermission(teamFacade.find(teamId).getGame(),
            Arrays.asList("View", "Token"));                                // Make sure the user can join

        List<User> users = userFacade.findOrCreate(accounts);
        Game g = null;
        Player p = null;
        StringBuilder r = new StringBuilder("Some users have already joined this game in another team: ");

        for (User user : users) {
            try {
                p = playerFacade.findByGameIdAndUserId(teamFacade.find(teamId).getGame().getId(), user.getId());
                r.append(" - ").append(user.getName()).append(";");
            } catch (WegasNoResultException e) {
                // Gotcha
            }
        }
        if (p != null) {
            throw WegasErrorMessage.error(r.toString());
        }
        for (User user : users) {
            g = gameFacade.joinTeam(teamId, user.getId()).getGame();
        }
        return g;
    }

    @POST
    @Path("/JoinTeam/{teamId : .*}/{token : .+}")
    @Deprecated
    public Game joinTeamByGroup(@PathParam("teamId") Long teamId, @PathParam("token") String token,
                                List<AbstractAccount> accounts) {
        SecurityHelper.checkAnyPermission(teamFacade.find(teamId).getGame(),
            Arrays.asList("View", "Token"));                                // Make sure the user can join

        try {
            GameEnrolmentKey gameEnrolmentKey = gameFacade.findGameEnrolmentKey(token);// Look the key up
            gameEnrolmentKey.setUsed(true);
        } catch (WegasNoResultException e) {
            // GOTCHA
        }
        return this.joinTeamByGroup(teamId, accounts);
    }

    /**
     * @param gameId
     * @param name
     * @return
     */
    @POST
    @Path("{gameId : .*}/CreateTeam/{name : .*}/")
    @Deprecated
    public Team createTeam(@PathParam("gameId") Long gameId, @PathParam("name") String name) {

        SecurityHelper.checkAnyPermission(gameFacade.find(gameId), Arrays.asList("View", "Token"));

        Team t = new Team(name);
        this.teamFacade.create(gameId, t);
        //Game g = this.teamFacade.joinTeam(t.getId(), userFacade.getCurrentUser().getId()).getGame();

        return t;
    }

    /**
     * @param gameId
     * @return
     */
    @POST
    @Path("{gameId : .*}/CreateTeam")
    @Deprecated
    public Team createTeam(@PathParam("gameId") Long gameId) {

        SecurityHelper.checkAnyPermission(gameFacade.find(gameId), Arrays.asList("View", "Token"));

        Team t = new Team();
        this.teamFacade.create(gameId, t);
        //Game g = this.teamFacade.joinTeam(t.getId(), userFacade.getCurrentUser().getId()).getGame();

        return t;
    }

    /**
     * @param gameId
     * @param accountNumber
     * @return
     */
    @POST
    @Path("{gameId : [1-9][0-9]*}/CreateGameAccount/{accountNumber : [1-9][0-9]*}")
    @Deprecated
    public Game createGameAccount(@PathParam("gameId") Long gameId, @PathParam("accountNumber") Long accountNumber) {
        Game g = gameFacade.find(gameId);
        SecurityUtils.getSubject().checkPermission("GameModel:Edit:g" + gameId);
        return gameFacade.createGameAccount(g, accountNumber);
    }

    /**
     * @param token
     * @return
     */
    @GET
    @Path("/FindByToken/{token : .*}/")
    public Game findByToken(@PathParam("token") String token) {
        return gameFacade.findByToken(token);
    }

    /**
     * Resets all the variables of a given game
     *
     * @param gameId gameId
     * @return OK
     */
    @GET
    @Path("{gameId : [1-9][0-9]*}/Reset")
    public Response reset(@PathParam("gameId") Long gameId) {

        SecurityUtils.getSubject().checkPermission("Game:Edit:g" + gameId);

        gameFacade.reset(gameId);
        return Response.ok().build();
    }
}
