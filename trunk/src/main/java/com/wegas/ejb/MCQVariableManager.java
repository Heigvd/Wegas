/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.wegas.ejb;

import com.wegas.persistence.GameModelEntity;
import com.wegas.persistence.variabledescriptor.MCQVariableDescriptorReplyEntity;
import com.wegas.persistence.variabledescriptor.VariableDescriptorEntity;
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
public class MCQVariableManager {

    private static final Logger logger = Logger.getLogger("EJB_GM");

    @EJB
    private AnonymousEntityManager aem;

    @EJB
    private VariableInstanceManager vim;
    
    @EJB 
    private GameModelManager gmm;

    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;


    /**
     * 
     * @param replyId 
     * @return
     */
    public MCQVariableDescriptorReplyEntity getMCQReply(Long replyId) {
        MCQVariableDescriptorReplyEntity reply = em.find(MCQVariableDescriptorReplyEntity.class, replyId);
        return reply;
    }
}