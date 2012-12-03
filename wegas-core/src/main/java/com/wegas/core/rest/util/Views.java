/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.rest.util;

import org.codehaus.jackson.annotate.JsonIgnoreProperties;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class Views {

    /**
     * Index minimal (w/ ids)
     */
    public static interface IndexI {
    }

    /**
     * Extended (w/ blob texts)
     */
    public static interface ExtendedI {
    }

    /**
     * Extend view (w/ scripts, impacts)
     */
    public static interface EditorI {
    }

    /**
     * Player view (w/ instances)
     */
    public static interface PlayerI {
    }

    /**
     * Single view (w/ instances)
     */
    public static interface SinglePlayerI extends PlayerI {
    }

    /**
     *
     */
    public static class Index implements IndexI {
    }

    /**
     *
     */
    public static class Public extends Index {
    }

    /**
     *
     */
    public static class Private extends Public implements SinglePlayerI {
    }

    /**
     *
     */
    public static class Editor extends Public implements IndexI, PlayerI, EditorI {
    }

    /**
     *
     */
    public static class Export implements EditorI {
    }

    /**
     *
     */
    @JsonIgnoreProperties({"id"})
    //@JsonPropertyOrder(value = {"title", "id", "version", "price", "summary"})
    public interface ExportFilter {
    }
}
