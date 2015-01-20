/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.reviewing.ejb;

import com.wegas.reviewing.persistence.PeerReviewingDescriptor;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.ScriptEventFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.event.internal.DescriptorRevivedEvent;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Observes;
import javax.inject.Inject;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@Stateless
@LocalBean
public class ReviewingFacade {

    static final private Logger logger = LoggerFactory.getLogger(ReviewingFacade.class);
    /**
     *
     */
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    /**
     *
     */
    public ReviewingFacade() {
    }
    /**
     *
     */
    @EJB
    private PlayerFacade playerFacade;
    /**
     *
     */
    @EJB
    private VariableInstanceFacade variableInstanceFacade;
    /**
     *
     */
    @EJB
    private VariableDescriptorFacade variableDescriptorFacade;
    /**
     *
     */
    @Inject
    private ScriptEventFacade scriptEvent;

    /**
     * Since PeerReviewingDescriptor toReview variable is only referenced by its own
 private name on the JSON side, we have to resolve those name to effective
 VariableDescriptor

 Moreover, as the variable may not yet exists (especially when posting a
 whole GameModel) when the PeerReviewingDescriptor is creted, we'll have to wait
 to resolve such identifier.
     *
     * This is done by listening to DescriptorRevivedEvent
     *
     * @param event
     */
    public void descriptorRevivedEvent(@Observes DescriptorRevivedEvent event) {
        if (event.getEntity() instanceof PeerReviewingDescriptor) {
            logger.debug("Received DescriptorRevivedEvent event");
            PeerReviewingDescriptor reviewD = (PeerReviewingDescriptor) event.getEntity();

            reviewD.setToReview(variableDescriptorFacade.find(reviewD.getGameModel(), reviewD.getImportedToReviewName()));
        }
    }
}
