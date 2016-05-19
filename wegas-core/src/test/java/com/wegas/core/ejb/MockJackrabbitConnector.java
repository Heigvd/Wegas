/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

//import com.wegas.core.jcr.JackrabbitConnector;
//import javax.enterprise.inject.Specializes;
import javax.inject.Singleton;

/**
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
//@Specializes
@Singleton
public class MockJackrabbitConnector /*extends JackrabbitConnector */{  

    //@Override
    protected void init() {
        // NO-OP
    }

    //@Override
    protected void close() {
        // NO-OP
    }
}
