/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.ejb;

import com.wegas.core.persistence.game.PlayerEntity;
import com.wegas.core.persistence.variable.VariableDescriptorEntity;
import com.wegas.core.persistence.variable.VariableInstanceEntity;
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
public class VariableInstanceFacade extends AbstractFacadeImpl<VariableInstanceEntity> {

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
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;
    /**
     *
     */
    @Inject
    private GameManager requestManager;

    /**
     *
     * @param variableDescriptorId
     * @param player
     * @return
     */
    public VariableInstanceEntity find(Long variableDescriptorId,
            PlayerEntity player) {
        VariableDescriptorEntity vd = variableDescriptorFacade.find(variableDescriptorId);
        return vd.getScope().getVariableInstance(player);
    }

    /**
     *
     * @param variableDescriptorId
     * @param playerId
     * @return
     */
    public VariableInstanceEntity find(Long variableDescriptorId,
            Long playerId) {
        return this.find(variableDescriptorId, playerFacade.find(playerId));
    }

    /**
     *
     * Update the variable instance entity fo the given descriptor and player.
     *
     * @param gameModelId
     * @param variableDescriptorId
     * @param playerId
     * @param variableInstance
     * @return
     */
    public VariableInstanceEntity update(Long variableDescriptorId,
            Long playerId, VariableInstanceEntity variableInstance) {

        VariableDescriptorEntity vd = variableDescriptorFacade.find(variableDescriptorId);
        VariableInstanceEntity vi = vd.getScope().getVariableInstance(playerFacade.find(playerId));
        vi.merge(variableInstance);
        return vi;
    }

    /**
     *
     * @param vi
     */
    public void onVariableInstanceUpdate(VariableInstanceEntity vi) {
        logger.info("onVariableInstanceUpdate() {}", requestManager);
        //  logger.info("onVariableInstanceUpdate() {} {}", requestManager.getCurrentPlayer(), requestManager.getUpdatedInstances());
        requestManager.addUpdatedInstance(vi);
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
        super(VariableInstanceEntity.class);
    }
}
