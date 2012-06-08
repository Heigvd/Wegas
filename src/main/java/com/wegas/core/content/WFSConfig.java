/*
 * Wegas.
 *
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.content;

import java.util.HashMap;
import java.util.Map;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
final public class WFSConfig {

    /**
     * JNDI name for Repository lookup
     */
    protected static final String jndiRepo = "jcr/jackrabbit";
    /**
     * WeGAS file system namespace prefix for use with XPATH <b>wfs:</b>
     */
    protected static final String WeGAS_FILE_SYSTEM_PREFIX = "wfs:";
    /**
     * WeGAS file system data property name
     */
    protected static final String WFS_DATA = WeGAS_FILE_SYSTEM_PREFIX + "data";
    /**
     * WeGAS file system mime-type property name
     */
    protected static final String WFS_MIME_TYPE = WeGAS_FILE_SYSTEM_PREFIX + "contentType";
    /**
     * WeGAS file system last modified property name
     */
    protected static final String WFS_LAST_MODIFIED = WeGAS_FILE_SYSTEM_PREFIX + "lastModified";
    /**
     * WeGAS file system note property name
     */
    protected static final String WFS_NOTE = WeGAS_FILE_SYSTEM_PREFIX + "note";
    /**
     * Custom namespaces registered with JCR.
     */
    protected static final Map<String, String> namespaces = new HashMap<String, String>() {

        {
            put("wfs", "http://www.wegas.com/wfs/1.0");                         //WeGAS File System
        }
    };
}
