/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.Helper;
import com.wegas.core.api.VariableInstanceFacadeI;
import com.wegas.core.persistence.InstanceOwner;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.persistence.variable.scope.AbstractScope;
import com.wegas.core.persistence.variable.scope.GameModelScope;
import com.wegas.core.persistence.variable.scope.GameScope;
import com.wegas.core.persistence.variable.scope.PlayerScope;
import com.wegas.core.persistence.variable.scope.TeamScope;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.mcq.ejb.QuestionDescriptorFacade;
import com.wegas.resourceManagement.ejb.IterationFacade;
import com.wegas.resourceManagement.ejb.ResourceFacade;
import com.wegas.reviewing.ejb.ReviewingFacade;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.naming.NamingException;
import javax.persistence.NoResultException;
import javax.persistence.TypedQuery;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@LocalBean
public class VariableInstanceFacade extends BaseFacade<VariableInstance> implements VariableInstanceFacadeI {

    static final private Logger logger = LoggerFactory.getLogger(VariableInstanceFacade.class);
    /**
     *
     */
    @EJB
    private VariableDescriptorFacade variableDescriptorFacade;
    /**
     *
     */
    @EJB
    private PlayerFacade playerFacade;
    /**
     *
     */
    @EJB
    private RequestFacade requestFacade;
    /**
     *
     */
    @EJB
    private TeamFacade teamFacade;
    /**
     *
     */
    @EJB
    private GameFacade gameFacade;

    @Inject
    private UserFacade userFacade;

    @Inject
    private ResourceFacade resourceFacade;

    @Inject
    private IterationFacade iterationFacade;

    @Inject
    private ReviewingFacade reviewingFacade;

    @Inject QuestionDescriptorFacade questionDescriptorFacade;

    private Beanjection beans = null;

    private Beanjection getBeans() {
        if (beans == null) {
            logger.error("INIT BEANS");
            beans = new Beanjection(this, variableDescriptorFacade,
                    resourceFacade, iterationFacade,
                    reviewingFacade, userFacade, teamFacade, questionDescriptorFacade);
        }
        return beans;
    }

    /**
     *
     * @param variableDescriptorId
     * @param player
     *
     * @return variableDescriptor instance owned by player
     */
    public VariableInstance find(Long variableDescriptorId,
            Player player) {
        VariableDescriptor vd = variableDescriptorFacade.find(variableDescriptorId);
        return vd.getInstance(player);
    }

    public VariableInstance getGameInstance(GameScope scope, Game game) {
        try {
            TypedQuery<VariableInstance> query = getEntityManager().createNamedQuery(
                    "VariableInstance.findGameInstance", VariableInstance.class);
            query.setParameter("scopeId", scope.getId());
            query.setParameter("gameId", game.getId());
            return query.getSingleResult();
        } catch (NoResultException ex) {
            return null;
        }
    }

    public VariableInstance getTeamInstance(TeamScope scope, Team team) {
        try {
            TypedQuery<VariableInstance> query = getEntityManager().createNamedQuery(
                    "VariableInstance.findTeamInstance", VariableInstance.class);
            query.setParameter("scopeId", scope.getId());
            query.setParameter("teamId", team.getId());
            return query.getSingleResult();
        } catch (NoResultException ex) {
            return null;
        }
    }

    public VariableInstance getPlayerInstance(PlayerScope scope, Player player) {
        try {
            TypedQuery<VariableInstance> query = getEntityManager().createNamedQuery(
                    "VariableInstance.findPlayerInstance", VariableInstance.class);
            query.setParameter("scopeId", scope.getId());
            query.setParameter("playerId", player.getId());
            return query.getSingleResult();
        } catch (NoResultException ex) {
            return null;
        }
    }

    /**
     *
     * @param instances
     *
     * @return
     */
    private Map<Long, VariableInstance> mapInstances(Map<? extends InstanceOwner, VariableInstance> instances) {
        Map<Long, VariableInstance> mappedInstances = new HashMap<>();
        for (Entry<? extends InstanceOwner, VariableInstance> entry : instances.entrySet()) {
            // GameModelScope Hack (null key means id=0...)
            mappedInstances.put((entry.getKey() != null ? entry.getKey().getId() : 0L), entry.getValue());
        }
        return mappedInstances;
    }

    public Map<Long, VariableInstance> getAllInstancesById(VariableDescriptor vd) {
        return this.mapInstances(this.getAllInstances(vd));
    }

    /**
     * get all instances
     *
     * @param vd
     *
     * @return
     */
    public Map<? extends InstanceOwner, VariableInstance> getAllInstances(VariableDescriptor vd) {
        AbstractScope scope = vd.getScope();
        if (scope instanceof TeamScope) {
            return this.getAllTeamInstances((TeamScope) scope);
        } else if (scope instanceof PlayerScope) {
            return this.getAllPlayerInstances((PlayerScope) scope);
        } else if (scope instanceof GameScope) {
            return this.getAllGameInstances((GameScope) scope);
        } else if (scope instanceof GameModelScope) {
            HashMap<GameModel, VariableInstance> hashMap = new HashMap<GameModel, VariableInstance>();
            hashMap.put(null, ((GameModelScope) scope).getVariableInstance());
            return hashMap;
        } else {
            return new HashMap<>();
        }
    }

    public Map<Player, VariableInstance> getAllPlayerInstances(PlayerScope scope) {
        Map<Player, VariableInstance> instances = new HashMap<>();
        TypedQuery<VariableInstance> query = getEntityManager().createNamedQuery(
                "VariableInstance.findAllPlayerInstances", VariableInstance.class);
        query.setParameter("scopeId", scope.getId());

        List<VariableInstance> resultList = query.getResultList();
        for (VariableInstance vi : resultList) {
            instances.put(vi.getPlayer(), vi);
        }
        return instances;
    }

    public Map<Team, VariableInstance> getAllTeamInstances(TeamScope scope) {
        Map<Team, VariableInstance> instances = new HashMap<>();
        TypedQuery<VariableInstance> query = getEntityManager().createNamedQuery(
                "VariableInstance.findAllTeamInstances", VariableInstance.class);
        query.setParameter("scopeId", scope.getId());

        List<VariableInstance> resultList = query.getResultList();
        for (VariableInstance vi : resultList) {
            instances.put(vi.getTeam(), vi);
        }
        return instances;
    }

    public Map<Game, VariableInstance> getAllGameInstances(GameScope scope) {
        Map<Game, VariableInstance> instances = new HashMap<>();
        TypedQuery<VariableInstance> query = getEntityManager().createNamedQuery(
                "VariableInstance.findAllGameInstances", VariableInstance.class);
        query.setParameter("scopeId", scope.getId());

        List<VariableInstance> resultList = query.getResultList();
        for (VariableInstance vi : resultList) {
            instances.put(vi.getGame(), vi);
        }
        return instances;
    }

    /**
     *
     * @param variableDescriptorId
     * @param playerId
     *
     * @return variableDescriptor instance owned by player
     */
    public VariableInstance find(Long variableDescriptorId,
            Long playerId) {
        return this.find(variableDescriptorId, playerFacade.find(playerId));
    }

    /**
     * Get all players owning the given entity. For a player scoped entity,
     * there will be only one player, for a team scopes one, all players from
     * the team. A game scoped instance will returns every players and the game
     * and a gameModel scoped, every players known in the gameModel
     *
     * @param instance
     *
     * @return list of instance owners
     */
    public List<Player> findAllPlayer(VariableInstance instance) {
        if (instance.getScope() instanceof PlayerScope) {
            List<Player> players = new ArrayList<>();
            players.add(playerFacade.find(instance.getPlayer().getId()));
            return players;
        } else if (instance.getScope() instanceof TeamScope) {
            return teamFacade.find(instance.getTeam().getId()).getPlayers();
        } else if (instance.getScope() instanceof GameScope) {
            List<Player> players = new ArrayList<>();

            for (Team t : gameFacade.find(instance.getGame().getId()).getTeams()) {
                players.addAll(t.getPlayers());
            }
            return players;
        } else if (instance.getScope() instanceof GameModelScope) {
            return instance.getDescriptor().getGameModel().getPlayers();
        } else {
            throw new UnsupportedOperationException(); // Should never occur
        }
    }

    /**
     * From an instance, retrieve the game it is part of
     *
     * @param instance
     *
     * @return the corresponding game
     *
     * @throws UnsupportedOperationException when instance is a default instance
     */
    public Game findGame(VariableInstance instance) {
        if (instance.getScope() instanceof PlayerScope) {
            return playerFacade.find(instance.getPlayer().getId()).getGame();
        } else if (instance.getScope() instanceof TeamScope) {
            return teamFacade.find(instance.getTeam().getId()).getGame();
        } else if (instance.getScope() instanceof GameScope) {
            return gameFacade.find(instance.getGame().getId());
        } else if (instance.getScope() instanceof GameModelScope) {
            return instance.getDescriptor().getGameModel().getGames().get(0);
        } else {
            throw new UnsupportedOperationException(); // Should never occur
        }
    }

    /**
     *
     * From an instance, retrieve the team it is part f
     *
     * @param instance
     *
     * @return the team the instance belongs to
     *
     * @throws UnsupportedOperationException when instance is a default
     *                                       instance, a gameModel scoped or
     *                                       game scoped one
     */
    public Team findTeam(VariableInstance instance) {
        if (instance.getScope() instanceof PlayerScope) {
            return playerFacade.find(instance.getPlayer().getId()).getTeam();
        } else if (instance.getScope() instanceof TeamScope) {
            return teamFacade.find(instance.getTeam().getId());
        } else if (instance.getScope() instanceof GameScope) {
            throw new UnsupportedOperationException();  // Should never be called
        } else if (instance.getScope() instanceof GameModelScope) {
            throw new UnsupportedOperationException();// Should never be called
            //return instance.getDescriptor().getGameModel().getGames().get(0);
        } else {
            throw new UnsupportedOperationException(); // Should never occur
        }
    }

    /**
     * Such a method should in a so-called GameFacade, nope ? Something like
     * {@link GameFacade#find(java.lang.Long) GameFacade.find()}
     *
     * @param instanceId
     *
     * @return the game matching the id.
     */
    public Game findGame(Long instanceId) {
        return this.findGame(this.find(instanceId));
    }

    /**
     *
     * Update the variable instance entity of the given descriptor and player.
     *
     * @param variableDescriptorId
     * @param playerId
     * @param variableInstance
     *
     * @return up to date instance
     */
    public VariableInstance update(Long variableDescriptorId,
            Long playerId, VariableInstance variableInstance) {

        VariableDescriptor vd = variableDescriptorFacade.find(variableDescriptorId);
        VariableInstance vi = vd.getScope().getVariableInstance(playerFacade.find(playerId));
        vi.merge(variableInstance);

        this.reviveInstance(vi);

        return vi;
    }

    public void reviveInstance(VariableInstance vi) {
        vi.revive(getBeans());
    }

    @Override
    public void create(VariableInstance entity) {
        getEntityManager().persist(entity);
        //getEntityManager().refresh(entity.getScope());
    }

    @Override
    public VariableInstance update(final Long entityId, final VariableInstance entity) {
        VariableInstance find = this.find(entityId);
        if (find.isDefaultInstance()) {
            return super.update(entityId, entity);
        } else {
            if (requestFacade.getRequestManager().getPlayer() == null) {
                /*
                 * When there is no player in the current requestFacade context and
                 * since requestFacade will blindly selects any player in such a
                 * case.
                 * A player who match the given variableInstance scope must be
                 * manually selected !
                 */
                Player p = find.getOwner().getAnyLivePlayer();
                requestFacade.getRequestManager().setPlayer(p);
            }

            VariableInstance ret = super.update(entityId, entity);
            requestFacade.commit();
            return ret;
        }
    }

    @Override
    public void remove(VariableInstance entity) {
        getEntityManager().remove(entity);

        if (entity.getPlayer() != null) {
            entity.getPlayer().getPrivateInstances().remove(entity);
        } else if (entity.getTeam() != null) {
            entity.getTeam().getPrivateInstances().remove(entity);
        } else if (entity.getGame() != null) {
            entity.getGame().getPrivateInstances().remove(entity);
        }
        /*
         * else {
         * nothing to do for GameModelScoped instance nor for default one
         * }
         */
    }

    /**
     *
     */
    public VariableInstanceFacade() {
        super(VariableInstance.class);
    }

    /**
     * @return Looked-up EJB
     */
    public static VariableInstanceFacade lookup() {
        try {
            return Helper.lookupBy(VariableInstanceFacade.class);
        } catch (NamingException ex) {
            logger.error("Error retrieving var inst f", ex);
            return null;
        }
    }
}
