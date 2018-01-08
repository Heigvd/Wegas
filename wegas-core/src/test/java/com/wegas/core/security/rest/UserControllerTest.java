/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.rest;

import com.wegas.test.arquillian.AbstractArquillianTestMinimal;
import java.io.IOException;
import javax.ejb.EJB;
import org.junit.Test;

/**
 *
 * @author maxence
 */
public class UserControllerTest extends AbstractArquillianTestMinimal {

    @EJB
    private UserController userController;

    @Test
    public void signUpTest() throws IOException {
        
    }

}
