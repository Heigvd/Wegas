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

import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.ejb.UserFacade;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Team;
import java.util.Collection;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/Game/")
public class GameController extends AbstractRestController<GameFacade> {

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
     * @return
     */
    @Override
    public Collection<AbstractEntity> index() {
        GameModel gameModel = gameModelEntityFacade.find(new Long(this.getPathParam("gameModelId")));
        return (Collection) gameModel.getGames();
    }

    @Override
    public AbstractEntity create(AbstractEntity entity) {
        this.gameFacade.create(new Long(this.getPathParam("gameModelId")), (Game) entity);
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
    @Produces(MediaType.APPLICATION_JSON)
    public Object joinGame(@PathParam("token") String token) throws Exception {
        Game game = null;
        Team team = null;
        try {
            game = gameFacade.findByToken(token);                               // We check if there is game with given token
        }
        catch (Exception e) {
        }
        if (game = null) {                                                      // If none was found,
            try {
                team = teamFacade.findByToken(token);                           // we try to lookup for a team entity.
                game = team.getGame();
            }
            catch (Exception e2) {
                throw new Exception("Could not find any game associated with this token.");
            }
        }
        try {                                                                   // We check if logged user is already registered in the target game
            playerFacade.findByGameIdAndUserId(
                    game.getId(), userFacade.getCurrentUser().getId());
        }
        catch (Exception e) {                                                   // If there is no NoResultException, everything is ok, we can return the game
            return ( team != null ) ? team : game;
        }
        throw new Exception("You are already registered to this game.");        // There user is already registered to target game
    }

    @GET
    @Path("/JoinTeam/{teamId : .*}/")
    @Produces(MediaType.APPLICATION_JSON)
    public Game joinTeam(@PathParam("teamId") Long teamId) {
        return teamFacade.joinTeam(teamId, userFacade.getCurrentUser().getId()).getGame();
    }

    /**
     *
     * @return
     */
    @Override
    protected GameFacade getFacade() {
        return gameFacade;
    }
}
