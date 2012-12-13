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

import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.persistence.variable.scope.GameModelScope;
import com.wegas.core.persistence.variable.scope.GameScope;
import com.wegas.core.persistence.variable.scope.PlayerScope;
import com.wegas.core.persistence.variable.scope.TeamScope;
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
    private TeamFacade teamFacade;
    /**
     *
     */
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;
    /**
     *
     */
    @Inject
    private RequestManager requestManager;

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

    public Player findAPlayer(VariableInstance instance) {
        if (instance.getScope() instanceof PlayerScope) {
            return playerFacade.find(instance.getPlayerScopeKey());
        } else if (instance.getScope() instanceof TeamScope) {
            return teamFacade.find(instance.getTeamScopeKey()).getPlayers().get(0);
        } else if (instance.getScope() instanceof  GameScope) {
            throw new UnsupportedOperationException();                          // @fixme 
        } else if (instance.getScope() instanceof GameModelScope) {
            return instance.getDescriptor().getGameModel().getGames().get(0).getTeams().get(0).getPlayers().get(0);
        } else {
            throw new UnsupportedOperationException();
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
