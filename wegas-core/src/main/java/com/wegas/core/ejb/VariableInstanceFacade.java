/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.Helper;
import com.wegas.core.exception.internal.NoGameException;
import com.wegas.core.exception.internal.NoPlayerException;
import com.wegas.core.exception.internal.NoTeamException;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.persistence.variable.scope.GameModelScope;
import com.wegas.core.persistence.variable.scope.GameScope;
import com.wegas.core.persistence.variable.scope.PlayerScope;
import com.wegas.core.persistence.variable.scope.TeamScope;
import java.util.ArrayList;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.naming.NamingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@LocalBean
public class VariableInstanceFacade extends BaseFacade<VariableInstance> {

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

    /**
     *
     * @param variableDescriptorId
     * @param player
     * @return
     */
    public VariableInstance find(Long variableDescriptorId,
            Player player) {
        VariableDescriptor vd = variableDescriptorFacade.find(variableDescriptorId);
        return vd.getInstance(player);
    }

    /**
     *
     * @param variableDescriptorId
     * @param playerId
     * @return
     */
    public VariableInstance find(Long variableDescriptorId,
            Long playerId) {
        return this.find(variableDescriptorId, playerFacade.find(playerId));
    }

    /**
     *
     * @param instance
     * @return
     */
    public List<Player> findAllPlayer(VariableInstance instance) {
        if (instance.getScope() instanceof PlayerScope) {
            List<Player> players = new ArrayList<>();
            players.add(playerFacade.find(instance.getPlayerScopeKey()));
            return players;
        } else if (instance.getScope() instanceof TeamScope) {
            return teamFacade.find(instance.getTeamScopeKey()).getPlayers();
        } else if (instance.getScope() instanceof GameScope) {
            List<Player> players = new ArrayList<>();

            for (Team t : gameFacade.find(instance.getGameScopeKey()).getTeams()) {
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
     *
     * @param instance
     * @return
     */
    public Game findGame(VariableInstance instance) {
        if (instance.getScope() instanceof PlayerScope) {
            return playerFacade.find(instance.getPlayerScopeKey()).getGame();
        } else if (instance.getScope() instanceof TeamScope) {
            return teamFacade.find(instance.getTeamScopeKey()).getGame();
        } else if (instance.getScope() instanceof GameScope) {
            return gameFacade.find(instance.getGameScopeKey());
        } else if (instance.getScope() instanceof GameModelScope) {
            return instance.getDescriptor().getGameModel().getGames().get(0);
        } else {
            throw new UnsupportedOperationException(); // Should never occur
        }
    }

    /**
     *
     * @param instance
     * @return
     */
    public Team findTeam(VariableInstance instance) {
        if (instance.getScope() instanceof PlayerScope) {
            return playerFacade.find(instance.getPlayerScopeKey()).getTeam();
        } else if (instance.getScope() instanceof TeamScope) {
            return teamFacade.find(instance.getTeamScopeKey());
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
     *
     * @param instanceId
     * @return
     */
    public Game findGame(Long instanceId) {
        return this.findGame(this.find(instanceId));
    }

    /**
     *
     * @param instance
     * @return
     * @throws NoPlayerException
     */
    public Player findAPlayer(VariableInstance instance)
            throws NoPlayerException {
        Player p;
        try {
            if (instance.getScope() instanceof PlayerScope) {
                p = playerFacade.find(instance.getPlayerScopeKey());
                if (p == null) {
                    throw new NoPlayerException();
                }
                return p;
            } else if (instance.getScope() instanceof TeamScope) {
                try {
                    p = teamFacade.find(instance.getTeamScopeKey()).getPlayers().get(0);
                } catch (ArrayIndexOutOfBoundsException ex) {
                    throw new NoPlayerException("Team [" + teamFacade.find(instance.getTeamScopeKey()).getName() + "] has no player");
                }
                return p;
            } else if (instance.getScope() instanceof GameScope) {

                try {
                    p = gameFacade.find(instance.getGameScopeKey()).getPlayers().get(0);
                } catch (ArrayIndexOutOfBoundsException ex) {
                    throw new NoPlayerException("Team [" + teamFacade.find(instance.getTeamScopeKey()).getName() + "] has no player");
                }
                return p;                          // @fixme
            } else if (instance.getScope() instanceof GameModelScope) {
                Game g;
                Team t;
                try {
                    g = instance.getDescriptor().getGameModel().getGames().get(0);
                } catch (ArrayIndexOutOfBoundsException ex) {
                    throw new NoGameException("GameModel [" + instance.getDescriptor().getGameModel().getName() + "] has no game");
                }
                try {
                    t = g.getTeams().get(0);
                } catch (ArrayIndexOutOfBoundsException ex) {
                    throw new NoTeamException("Game [" + g.getName() + "] has no team");
                }
                try {
                    p = t.getPlayers().get(0);
                } catch (ArrayIndexOutOfBoundsException ex) {
                    throw new NoPlayerException("Team [" + t.getName() + "] has no player");
                }

                return p;

            } else {
                throw new UnsupportedOperationException();  // Should never occur
            }
        } catch (NoTeamException | NoGameException ex) {
            throw new NoPlayerException(ex.getMessage(), ex);
        }
    }

    /**
     *
     * Update the variable instance entity of the given descriptor and player.
     *
     * @param variableDescriptorId
     * @param playerId
     * @param variableInstance
     * @return
     */
    public VariableInstance update(Long variableDescriptorId,
            Long playerId, VariableInstance variableInstance) {

        VariableDescriptor vd = variableDescriptorFacade.find(variableDescriptorId);
        VariableInstance vi = vd.getScope().getVariableInstance(playerFacade.find(playerId));
        vi.merge(variableInstance);
        return vi;
    }

    @Override
    public void create(VariableInstance entity) {
        getEntityManager().persist(entity);
        //getEntityManager().refresh(entity.getScope());
    }

    @Override
    public VariableInstance update(final Long entityId, final VariableInstance entity) {
        VariableInstance ret = super.update(entityId, entity);
        requestFacade.commit();
        return ret;
    }

    @Override
    public void remove(VariableInstance entity) {
        getEntityManager().remove(entity);
        /*
        if (entity.getPlayerScopeKey() != null) {
            Player find = playerFacade.find(entity.getPlayerScopeKey());
            find.getPrivateInstances().remove(entity);
        } else if (entity.getTeamScopeKey() != null) {
            Team find = teamFacade.find(entity.getTeamScopeKey());
            find.getPrivateInstances().remove(entity);
        } else if (entity.getGameScopeKey() != null) {
            Game find = gameFacade.find(entity.getGameScopeKey());
            find.getPrivateInstances().remove(entity);
        } else if (entity.getGameModelScope() != null) {
            //find.getPrivateInstances().remove(entity);
        }
         */
        entity.getScope().getVariableInstances().remove(entity.getId());
    }

    /**
     *
     */
    public VariableInstanceFacade() {
        super(VariableInstance.class);
    }

    /**
     * @return
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
