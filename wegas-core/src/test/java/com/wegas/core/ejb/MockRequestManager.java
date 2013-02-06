/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import javax.enterprise.inject.Specializes;
import javax.inject.Singleton;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Specializes
@Singleton
public class MockRequestManager extends RequestManager {
}
