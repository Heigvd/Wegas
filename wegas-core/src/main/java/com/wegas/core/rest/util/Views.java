/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class Views {

    /**
     * Index minimal (w/ ids)
     */
    public interface IndexI {
    }

    /**
     * Extended (w/ blob texts)
     */
    public interface ExtendedI {
    }

    /**
     *
     * @deprecated
     */
    public interface EditorExtendedI extends ExtendedI {
    }

    /**
     * Extend view (w/ scripts, impacts)
     */
    public interface EditorI {
    }

    /**
     * Player view (w/ all players instances)
     */
//    public static interface PlayerI {
//    }
    /**
     * Only display current player's VariableInstance
     * @deprecated
     */
    public interface WithScopeI {
    }

    /**
     *
     * @deprecated
     */
    public interface SinglePlayerI extends WithScopeI {
    }

    /**
     * @deprecated
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
     *
     * @deprecated
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
     *
     * @deprecated
     */
    public static class EditorPrivate extends Public implements SinglePlayerI, EditorI {
    }

    /**
     * 
     */
    public static class EditorExtended extends Public implements EditorI, ExtendedI, EditorExtendedI, WithScopeI {
    }

    /**
     * Do not include ids
     */
    public static class Export implements EditorI, EditorExtendedI, WithScopeI {
    }

    /**
     *
     */
    @JsonIgnoreProperties({"id"})
    //@JsonPropertyOrder(value = {"title", "id", "version", "price", "summary"})
    public interface ExportFilter {
    }
}
