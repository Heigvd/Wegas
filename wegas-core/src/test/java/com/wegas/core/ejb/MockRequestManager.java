/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import javax.ejb.DependsOn;
import javax.enterprise.inject.Specializes;
import javax.inject.Singleton;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Specializes
@Singleton
@DependsOn("MutexSingleton")
public class MockRequestManager extends RequestManager {
}
