/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class Views {

    /**
     * Index minimal (w/ ids)
     */
    public interface IndexI {
    }

    /**
     * Potential heavy text
     * Extended (w/ blob texts)
     */
    public interface ExtendedI {
    }

    /**
     * Relevant only to editors
     * Editor view (w/ scripts, impacts)
     */
    public interface EditorI {
    }

    /**
     * Minimal view with IDs
     */
    public static class Public implements IndexI {
    }

    /**
     * View with IDs and blobs
     */
    public static class Extended implements ExtendedI, IndexI {
    }

    /**
     * View relevant to Editors
     */
    public static class Editor implements EditorI, IndexI {
    }

    /**
     * View relevant to Editors with blobs
     */
    public static class EditorExtended implements EditorI, ExtendedI, IndexI {
    }

    /**
     * Do not include ids, Export usage
     */
    public static class Export implements EditorI, ExtendedI {
    }

}
