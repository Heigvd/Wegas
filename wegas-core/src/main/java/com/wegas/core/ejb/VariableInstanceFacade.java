/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.ejb;

import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.persistence.variable.scope.GameModelScope;
import com.wegas.core.persistence.variable.scope.GameScope;
import com.wegas.core.persistence.variable.scope.PlayerScope;
import com.wegas.core.persistence.variable.scope.TeamScope;
import com.wegas.exception.NoGameException;
import com.wegas.exception.NoPlayerException;
import com.wegas.exception.NoTeamException;
import java.util.ArrayList;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@LocalBean
public class VariableInstanceFacade extends AbstractFacadeImpl<VariableInstance> {

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
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    /**
     *
     * @param variableDescriptorId
     * @param player
     * @return
     */
    public VariableInstance find(Long variableDescriptorId,
            Player player) {
        VariableDescriptor vd = variableDescriptorFacade.find(variableDescriptorId);
        return vd.getScope().getVariableInstance(player);
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

    public List<Player> findAllPlayer(VariableInstance instance) {
        if (instance.getScope() instanceof PlayerScope) {
            List<Player> players = new ArrayList<>();
            players.add(playerFacade.find(instance.getPlayerScopeKey()));
            return players;
        } else if (instance.getScope() instanceof TeamScope) {
            return teamFacade.find(instance.getTeamScopeKey()).getPlayers();
        } else if (instance.getScope() instanceof GameScope) {
            throw new UnsupportedOperationException();                          // @fixme
        } else if (instance.getScope() instanceof GameModelScope) {
            return instance.getDescriptor().getGameModel().getPlayers();
        } else {
            throw new UnsupportedOperationException();
        }

    }

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
                throw new UnsupportedOperationException();                          // @fixme
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
                throw new UnsupportedOperationException();
            }
        } catch (NoTeamException | NoGameException ex) {
            throw new NoPlayerException(ex.getMessage(), ex);
        }
    }

    /**
     *
     * Update the variable instance entity fo the given descriptor and player.
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
    public VariableInstance update(final Long entityId, final VariableInstance entity) {
        VariableInstance ret = super.update(entityId, entity);
        requestFacade.commit();
        return ret;
    }

    /**
     *
     * @return
     */
    @Override
    protected EntityManager getEntityManager() {
        return em;
    }

    /**
     *
     */
    public VariableInstanceFacade() {
        super(VariableInstance.class);
    }
}
