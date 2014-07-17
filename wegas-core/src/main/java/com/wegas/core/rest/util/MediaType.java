/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util;

import com.wegas.core.Config;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class MediaType {

    /**
     *
     */
    public static final String APPLICATION_JSON = "application/json; charset=" + Config.CHARSET;

    /**
     *
     */
    final static public String TEXT_CSS = "text/css; charset=" + Config.CHARSET;

    /**
     *
     */
    final static public String APPLICATION_JS = "text/javascript; charset=" + Config.CHARSET;
}
