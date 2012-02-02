/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.albasim.wegas.ejb;

import com.albasim.wegas.helper.AnonymousEntityMerger;
import com.albasim.wegas.persistence.GameModelEntity;
import com.albasim.wegas.persistence.variabledescriptor.VariableDescriptorEntity;
import java.util.logging.Logger;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@LocalBean
public class VariableDescriptorManager {

    private static final Logger logger = Logger.getLogger("EJB_GM");

    @EJB
    private WegasEntityManager aem;

    @EJB
    private VariableInstanceManager vim;
    
    @EJB 
    private GameModelManager gmm;

    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;


    /**
     * 
     * @param variableDescriptorId
     * @return
     */
    public VariableDescriptorEntity getVariableDescriptor(Long variableDescriptorId) {
        VariableDescriptorEntity vDesc = em.find(VariableDescriptorEntity.class, variableDescriptorId);

        return vDesc;
    }


    /**
     * 
     * @param gameModelId
     * @param variableDescriptor
     */
    public void create(Long gameModelId, VariableDescriptorEntity variableDescriptor) {
        
        GameModelEntity gm = gmm.getGameModel(gameModelId);
        gm.getVariableDescriptors().add(variableDescriptor);
        variableDescriptor.setGameModel(gm);
        aem.create(variableDescriptor);
        //aem.update(gm);
    }

    /**
     * 
     * @param variableDescriptorId
     * @param variableDescriptor
     * @return
     */
    public VariableDescriptorEntity update(Long variableDescriptorId, VariableDescriptorEntity variableDescriptor) {
        VariableDescriptorEntity vd = this.getVariableDescriptor(variableDescriptorId);
        vd.merge(variableDescriptor);
        vd = aem.update(vd);
        return vd;
    }

    /**
     * 
     * @param gmID
     * @param vdID
     */
    public void destroyVariableDescriptor(String gmID, String vdID) {
        VariableDescriptorEntity variableDescriptor = getVariableDescriptor(Long.parseLong(vdID));
        aem.destroy(variableDescriptor);
    }
}
