/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.rest;

import com.wegas.core.Helper;
import com.wegas.test.AbstractEJBTestBase;
import com.wegas.core.security.jparealm.JpaAccount;
import java.io.IOException;
import javax.inject.Inject;
import javax.naming.NamingException;
import org.junit.Test;

/**
 *
 * @author maxence
 */
public class UserControllerTest extends AbstractEJBTestBase {

    private final UserController userController;

    public UserControllerTest() throws NamingException {
        this.userController = Helper.lookupBy(UserController.class);
    }

    @Test
    public void signUpTest() throws IOException {
        
    }

}
