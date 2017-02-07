/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wegas.core.Helper;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.rest.util.JacksonMapperProvider;
import com.wegas.core.security.ejb.RoleFacade;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.guest.GuestJpaAccount;
import com.wegas.core.security.guest.GuestToken;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import java.util.Collection;
import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.ejb.embeddable.EJBContainer;
import javax.naming.NamingException;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.subject.Subject;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class AbstractEJBTestBase {

    // *** Static *** //
    private static final Logger logger = LoggerFactory.getLogger(AbstractEJBTestBase.class);
    private static EJBContainer ejbContainer;
    protected static GameModelFacade gameModelFacade;
    protected static GameFacade gameFacade;
    protected static TeamFacade teamFacade;
    protected static RoleFacade roleFacade;
    protected static UserFacade userFacade;
    protected static VariableDescriptorFacade descriptorFacade;
    protected static RequestFacade requestFacade;
    protected static SecurityFacade securityFacade;
    protected static RequestManager requestManager;
    protected static ObjectMapper jsonMapper;

    @BeforeClass
    public static void setUp() throws NamingException {
        jsonMapper = JacksonMapperProvider.getMapper();
        ejbContainer = TestHelper.getEJBContainer();
        gameModelFacade = lookupBy(GameModelFacade.class);
        gameFacade = GameFacade.lookup();
        teamFacade = TeamFacade.lookup();
        descriptorFacade = lookupBy(VariableDescriptorFacade.class);
        roleFacade = lookupBy(RoleFacade.class);
        userFacade = UserFacade.lookup();
        requestFacade = RequestFacade.lookup();
        securityFacade = requestFacade.getSecurityFacade();
        requestManager = requestFacade.getRequestManager();
    }

    public static void logout() {
        Subject subject = SecurityUtils.getSubject();
        subject.logout();
    }

    public static void login(User user) {
        Subject subject = SecurityUtils.getSubject();
        userFacade.logout();
        subject.login(new GuestToken(user.getMainAccount().getId()));
        userFacade.setCurrentUser(user);
    }

    @AfterClass
    public static void tearDown() {
        TestHelper.closeContainer();
    }

    public static <T> T lookupBy(Class<T> type, Class service) throws NamingException {
        return Helper.lookupBy(ejbContainer.getContext(), type, service);
    }

    public static <T> T lookupBy(Class<T> type) throws NamingException {
        return Helper.lookupBy(ejbContainer.getContext(), type, type);
    }
}
