/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.api;

import com.wegas.core.persistence.game.Player;
import com.wegas.reviewing.persistence.PeerReviewDescriptor;

/**
 *
 * @author maxence
 */
public interface ReviewingFacadeI {

    /**
     * Let a player submit his variable. It means the variable become ready to
     * be reviewed
     *
     * @param prd the PeerReview Descriptor
     * @param p   the player submitting
     */
    void submit(PeerReviewDescriptor prd, Player p);

}
