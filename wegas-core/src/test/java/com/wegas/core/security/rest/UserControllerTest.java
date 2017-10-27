/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.rest;

import com.wegas.test.arquillian.AbstractArquillianTest;
import java.io.IOException;
import javax.ejb.EJB;
import org.junit.Test;

/**
 *
 * @author maxence
 */
public class UserControllerTest extends AbstractArquillianTest {

    @EJB
    private UserController userController;

    @Test
    public void signUpTest() throws IOException {
        
    }

}
