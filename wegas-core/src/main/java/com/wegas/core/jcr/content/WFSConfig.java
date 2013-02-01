/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.content;

import java.util.HashMap;
import java.util.Map;
import java.util.ResourceBundle;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
final public class WFSConfig {

    final static private ResourceBundle resourceBundle = ResourceBundle.getBundle("wegas");
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
     * WeGAS file system description property name
     */
    protected static final String WFS_DESCRIPTION = WeGAS_FILE_SYSTEM_PREFIX + "description";
    /**
     * File size limit in bytes
     */
    protected static final Long MAX_FILE_SIZE = new Long(resourceBundle.getString("jcr.file.maxsize"));
    /**
     * Repository size limit in bytes
     */
    protected static final Long MAX_REPO_SIZE = new Long(resourceBundle.getString("jcr.repository.maxsize"));
    /**
     * Custom namespaces registered with JCR.
     */
    protected static final Map<String, String> namespaces = new HashMap<String, String>() {
        {
            put("wfs", "http://www.wegas.com/wfs/1.0");                         //WeGAS File System
        }
    };
}
