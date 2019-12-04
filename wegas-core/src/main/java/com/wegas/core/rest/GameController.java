/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.XlsxSpreadsheet;
import com.wegas.core.async.PopulatorFacade;
import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.DebugTeam;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.User;
import java.io.IOException;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;
import org.apache.commons.text.StringEscapeUtils;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.shiro.authz.AuthorizationException;
import org.apache.shiro.authz.annotation.RequiresRoles;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@Path("GameModel/{gameModelId : ([1-9][0-9]*)?}{sep: /?}Game/")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class GameController {

    /**
     *
     */
    @Inject
    private GameFacade gameFacade;
    /**
     *
     */
    @Inject
    private RequestManager requestManager;
    /**
     *
     */
    @Inject
    private UserFacade userFacade;

    /**
     *
     */
    @Inject
    private TeamFacade teamFacade;

    /**
     *
     */
    @Inject
    private PlayerFacade playerFacade;

    @Inject
    private PopulatorFacade populatorFacade;

    /**
     * @param entityId
     *
     * @return game matching entityId
     *
     * @throws AuthorizationException current user doesn't have access to the requested game
     */
    @GET
    @Path("{entityId : [1-9][0-9]*}")
    public Game find(@PathParam("entityId") Long entityId) {
        Game g = gameFacade.find(entityId);

        return g; // was: gameFacade.find(entityId);
    }

    /**
     * Create a new game based on a given gameModel copy.
     *
     * @param gameModelId
     * @param game
     *
     * @return the new game with its debug team filtered out
     *
     * @throws java.lang.CloneNotSupportedException
     *
     */
    @POST
    public Game create(@PathParam("gameModelId") Long gameModelId, Game game) throws CloneNotSupportedException {
        gameFacade.publishAndCreate(gameModelId, game);
        //@Dirty: those lines exist to get a new game pointer. Cache is messing with it
        // removing debug team will stay in cache as this game pointer is new. work around
        gameFacade.flush();
        gameFacade.detach(game);
        game = gameFacade.find(game.getId());
        //gameFacade.create(gameModelId, game);
        return gameFacade.getGameWithoutDebugTeam(game);
    }

    /**
     * Create a new game within the given game model
     *
     * @param gameModelId
     * @param entity
     *
     * @return the new game with its debug team filtered out
     *
     * @throws IOException
     */
    @POST
    @Path("ShadowCreate")
    @Deprecated
    public Game shadowCreate(@PathParam("gameModelId") Long gameModelId, Game entity) throws IOException {
        gameFacade.create(gameModelId, entity);
        return gameFacade.getGameWithoutDebugTeam(entity);
    }

    /**
     * Same as above, but take the parent game model id from a path param
     *
     * @param gameModelId
     * @param entity
     *
     * @return the new game with its debug team
     *
     * @throws java.lang.CloneNotSupportedException
     *
     */
    @POST
    @Path("{gmId : [1-9][0-9]*}")
    public Game createBis(@PathParam("gmId") Long gameModelId, Game entity) throws CloneNotSupportedException {
        return this.create(gameModelId, entity);
    }

    /**
     * @param entityId
     * @param entity
     *
     * @return up to date game
     */
    @PUT
    @Path("{entityId: [1-9][0-9]*}")
    public Game update(@PathParam("entityId") Long entityId, Game entity) {

        requestManager.assertGameTrainer(entity);

        return gameFacade.update(entityId, entity);
    }

    /**
     * Change game status (bin, live, delete)
     *
     * @param entityId
     * @param status
     *
     * @return the game with up to date status
     */
    @PUT
    @Path("{entityId: [1-9][0-9]*}/status/{status: [A-Z]*}")
    public Game changeStatus(@PathParam("entityId") Long entityId, @PathParam("status") final Game.Status status) {
        Game game = gameFacade.find(entityId);
        requestManager.assertGameTrainer(game);
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

    /**
     * Get all game with given status
     *
     * @param status
     *
     * @return all game having the given status
     */
    @GET
    @Path("status/{status: [A-Z]*}")
    public Collection<Game> findByStatus(@PathParam("status") final Game.Status status) {
        return gameFacade.findByStatusAndUser(status);
    }

    /**
     * Count games by status
     *
     * @param status
     *
     * @return number of game having the given status
     */
    @GET
    @Path("status/{status: [A-Z]*}/count")
    public int countByStatus(@PathParam("status") final Game.Status status) {
        return findByStatus(status).size();
    }

    public static StringBuilder appendCSVField(StringBuilder sb, String value) {
        if (value != null) {
            sb.append(StringEscapeUtils.escapeCsv(value));
        }
        return sb;
    }

    @GET
    @Path("{gameId : [1-9][0-9]*}/ExportMembers")
    public Response exportMembers(@PathParam("gameId") Long gameId) throws UnsupportedEncodingException {
        Game game = gameFacade.find(gameId);
        StringBuilder sb = new StringBuilder();

        sb.append("\"Team Name\", \"Team Notes\", \"Team Creation Date\", \"Team Status\",");
        sb.append("\"Player Name\", \"Player email\", \"Email verified\", \"Player Join Time\", \"Player Language\", \"Player Status\"");
        sb.append(System.lineSeparator());

        for (Team t : game.getTeams()) {
            if (t instanceof DebugTeam == false) {
                for (Player p : t.getPlayers()) {
                    appendCSVField(sb, t.getName()).append(",");
                    appendCSVField(sb, t.getNotes()).append(",");
                    appendCSVField(sb, t.getCreatedTime().toString()).append(",");
                    appendCSVField(sb, t.getStatus().name()).append(",");
                    appendCSVField(sb, p.getName()).append(",");
                    if (p.getUser() != null) {
                        appendCSVField(sb, p.getUser().getMainAccount().getDetails().getEmail()).append(",");
                        appendCSVField(sb, Boolean.TRUE.equals(p.getUser().getMainAccount().isVerified()) ? "yes" : "no").append(",");
                    } else {
                        sb.append(",").append(",");
                    }
                    appendCSVField(sb, p.getJoinTime().toString()).append(",");
                    appendCSVField(sb, game.getGameModel().getLanguageByCode(p.getLang()).getLang()).append(",");
                    appendCSVField(sb, p.getStatus().name()).append(System.lineSeparator());
                }
            }
        }

        String filename = URLEncoder.encode(game.getName().replaceAll("\\" + "s+", "_") + ".csv", StandardCharsets.UTF_8.displayName());

        return Response.ok(sb.toString(), "text/csv")
                .header("Content-Disposition", "attachment; filename="
                        + filename).build();
    }

    @GET
    @Path("{gameId : [1-9][0-9]*}/ExportMembers.xlsx")
    public Response exportMembersXlsx(@PathParam("gameId") Long gameId) throws UnsupportedEncodingException {
        Game game = gameFacade.find(gameId);

        XlsxSpreadsheet xlsx = gameFacade.getXlsxOverview(gameId);
        Workbook workbook = xlsx.getWorkbood();

        StreamingOutput sout;
        sout = new StreamingOutput() {
            @Override
            public void write(OutputStream out) throws IOException, WebApplicationException {
                workbook.write(out);
                workbook.close();
            }
        };

        String filename = URLEncoder.encode(game.getName().replaceAll("\\" + "s+", "_") + ".xlsx", StandardCharsets.UTF_8.displayName());

        return Response.ok(sout, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .header("Content-Disposition", "attachment; filename=" + filename).build();
    }

    /**
     * @param entityId
     */
    @DELETE
    @Path("{entityId: [1-9][0-9]*}")
    @RequiresRoles("Administrator")
    public void forceDelete(@PathParam("entityId") Long entityId) {
        Game entity = gameFacade.find(entityId);
        switch (entity.getStatus()) {
            case DELETE:
                gameFacade.remove(entity);
                break;
        }
    }

    /**
     * @return all games which gave been deleted
     */
    @DELETE
    public Collection<Game> deleteAll() {
        final Collection<Game> retGames = new ArrayList<>();
        final Collection<Game> games = gameFacade.findAll(Game.Status.BIN);
        for (Game g : games) {
            if (requestManager.hasAnyPermission(g.getRequieredDeletePermission())) {
                gameFacade.delete(g);
                retGames.add(g);
            }
        }
        return retGames;
    }

    /**
     * Check if a user is logged, Find a game by id and check if this game has an open access, Check if current user is
     * already a player for this game, Check if the game is played individually, Create a new team with a new player
     * linked on the current user for the game found.
     *
     * @param request
     * @param gameId
     *
     * @return Response
     *
     * @throws com.wegas.core.exception.internal.WegasNoResultException
     */
    @POST
    @Path("{id}/Player")
    public Response joinIndividually(@Context HttpServletRequest request,
            @PathParam("id") Long gameId) throws WegasNoResultException {
        Response r = Response.status(Response.Status.UNAUTHORIZED).build();
        User currentUser = userFacade.getCurrentUser();
        if (currentUser != null) {
            r = Response.status(Response.Status.BAD_REQUEST).build();
            Game game = gameFacade.find(gameId);
            if (game != null) {
                r = Response.status(Response.Status.CONFLICT).build();
                if (game.getAccess() == Game.GameAccess.OPEN) {
                    if (requestManager.tryLock("join-" + gameId + "-" + currentUser.getId())) {
                        if (!playerFacade.isInGame(game.getId(), currentUser.getId())) {
                            if (game.getGameModel().getProperties().getFreeForAll()) {
                                Team team = new Team(teamFacade.findUniqueNameForTeam(game, currentUser.getName()), 1);
                                teamFacade.create(game.getId(), team); // return managed team
                                team = teamFacade.find(team.getId());
                                gameFacade.joinTeam(team.getId(), currentUser.getId(), request != null ? Collections.list(request.getLocales()) : null);
                                /**
                                 * Detach and re-find to fetch the new player
                                 */
                                teamFacade.detach(team);
                                team = teamFacade.find(team.getId());
                                Player p = team.getPlayers().get(0);
                                p.setQueueSize(populatorFacade.getQueue().indexOf(p) + 1);

                                r = Response.status(Response.Status.CREATED).entity(team).build();
                            }
                        }
                    }
                }
            }
        }
        return r;
    }

    /**
     * @param token
     *
     * @return game which matches the token, without its debug team
     */
    @GET
    @Path("/FindByToken/{token : ([a-zA-Z0-9_-]|\\.(?!\\.))*}")
    public Game findByToken(@PathParam("token") String token) {
        return gameFacade.getGameWithoutDebugTeam(gameFacade.findByToken(token));

    }

    /**
     * Resets all the variables of a given game
     *
     * @param gameId gameId id of game to reset
     *
     * @return HTTP 200 Ok
     */
    @GET
    @Path("{gameId : [1-9][0-9]*}/Reset")
    public Response reset(@PathParam("gameId") Long gameId) {

        Game game = gameFacade.find(gameId);
        requestManager.assertUpdateRight(game);

        gameFacade.reset(gameId);
        return Response.ok().build();
    }
}
