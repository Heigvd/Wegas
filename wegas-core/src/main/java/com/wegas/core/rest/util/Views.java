/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
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
    
    public static interface EditorExtendedI extends ExtendedI {
    }

    /**
     * Extend view (w/ scripts, impacts)
     */
    public static interface EditorI {
    }

    /**
     * Player view (w/ all players instances)
     */
//    public static interface PlayerI {
//    }
    /**
     * Only display current player's VariableInstance
     */
    public static interface WithScopeI {
    }

    public static interface SinglePlayerI extends WithScopeI {
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
    public static class Extended extends Public implements ExtendedI {
    }

    /**
     * Variable Descriptor with a single instance for the current player
     */
    public static class Private extends Public implements SinglePlayerI {
    }

    /**
     *
     */
    public static class Editor extends Public implements EditorI, WithScopeI {
    }

    /**
     * Variable Descriptor with a single instance for the current player
     */
    public static class EditorPrivate extends Public implements SinglePlayerI, EditorI {
    }

    /**
     * Variable Descriptor with a single instance for the current player
     */
    public static class EditorExtended extends Public implements EditorI, ExtendedI, EditorExtendedI {
    }

    /**
     *
     */
    public static class Export implements EditorI, ExtendedI, EditorExtendedI {
    }

    /**
     *
     */
    @JsonIgnoreProperties({"id"})
    //@JsonPropertyOrder(value = {"title", "id", "version", "price", "summary"})
    public interface ExportFilter {
    }
}
