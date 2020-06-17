/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.jcr.content;

import com.wegas.core.Helper;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public final class WFSConfig {

    /**
     * JCR wegas storage root
     */
    private static final String WEGAS_ROOT = "/wegas";

    /**
     * gameModel root path
     */
    /* package */ public static final Function<Long, String> GM_ROOT = (Long gameModelId) -> String.format("%s/GM_%d", WEGAS_ROOT, gameModelId);
    /**
     *
     * path for gameModel files (inside workspace)
     */
    /* package */ public static final Function<Long, String> WFS_ROOT = (Long gameModelId) -> String.format("%s/files", GM_ROOT.apply(gameModelId));
    /**
     * path for gameModel pages
     */
    /* package */ public static final Function<Long, String> PAGES_ROOT = (Long gameModelId) -> String.format("%s/pages", GM_ROOT.apply(gameModelId));
    /**
     * path for gameModel pages
     */
    /* package */ public static final Function<Long, String> HISTORY_ROOT = (Long gameModelId) -> String.format("%s/history", GM_ROOT.apply(gameModelId));
    /**
     * WeGAS file system namespace prefix for use with XPATH
     * <b>{@value #WeGAS_FILE_SYSTEM_PREFIX}</b>
     */
    /* package */ static final String WeGAS_FILE_SYSTEM_PREFIX = "wfs:";
    /**
     * WeGAS file system data property name <b>{@value #WFS_DATA}</b>
     */
    /* package */ static final String WFS_DATA = WeGAS_FILE_SYSTEM_PREFIX + "data";
    /**
     * WeGAS file system mime-type property name <b>{@value #WFS_MIME_TYPE}</b>
     */
    /* package */ static final String WFS_MIME_TYPE = WeGAS_FILE_SYSTEM_PREFIX + "contentType";
    /**
     * WeGAS file system last modified property name <b>{@value #WFS_DATA}</b>
     */
    /* package */ static final String WFS_LAST_MODIFIED = WeGAS_FILE_SYSTEM_PREFIX + "lastModified";
    /**
     * WeGAS file system note property name <b>{@value #WFS_NOTE}</b>
     */
    /* package */ static final String WFS_NOTE = WeGAS_FILE_SYSTEM_PREFIX + "note";
    /**
     * WeGAS file system description property name
     * <b>{@value #WFS_DESCRIPTION}</b>
     */
    /* package */ static final String WFS_DESCRIPTION = WeGAS_FILE_SYSTEM_PREFIX + "description";
    /**
     * WeGAS file system description property name
     * <b>{@value #WFS_VISIBILITY}</b>
     */
    /* package */ static final String WFS_VISIBILITY = WeGAS_FILE_SYSTEM_PREFIX + "visibility";
    /**
     * WeGAS file system private property name <b>{@value #WFS_PRIVATE}</b>
     */
    /* package */ static final String WFS_PRIVATE = WeGAS_FILE_SYSTEM_PREFIX + "private";
    /**
     * File size limit in bytes
     */
    /* package */ static final Long MAX_FILE_SIZE = Long.valueOf(Helper.getWegasProperty("jcr.file.maxsize"));
    /**
     * Repository size limit in bytes
     */
    /* package */ static final Long MAX_REPO_SIZE = Long.valueOf(Helper.getWegasProperty("jcr.repository.maxsize"));
    /**
     * Custom namespaces registered with JCR.
     */
    /* package */ static final Map<String, String> namespaces = new HashMap<String, String>() {
        {
            put("wfs", "http://www.wegas.com/wfs/1.0");                         //WeGAS File System
        }
    };
}
