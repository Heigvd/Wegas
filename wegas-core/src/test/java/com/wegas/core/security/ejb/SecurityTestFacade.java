/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

package com.wegas.core.security.ejb;

import com.wegas.core.ejb.RequestManager;
import com.wegas.core.security.persistence.User;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.inject.Inject;
import org.junit.jupiter.api.Assertions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author maxence
 */
@Stateless
@LocalBean
public class SecurityTestFacade {

    private static final Logger logger = LoggerFactory.getLogger(SecurityTestFacade.class);

    @Inject
    private RequestManager requestManager;

    public void inFacadeSuTest(User currentUser, User otherUser) {
        User u = requestManager.getCurrentUser();
        logger.error("CurrentUser: {}", u);
        Assertions.assertEquals(currentUser, u, "Admin is not the current user");

        requestManager.su(otherUser.getMainAccount().getId());

        u = requestManager.getCurrentUser();
        Assertions.assertEquals(otherUser, u, "User is not the current user");

        requestManager.releaseSu();
        u = requestManager.getCurrentUser();
        Assertions.assertEquals(currentUser, u, "Admin is not the current user");
    }
}
