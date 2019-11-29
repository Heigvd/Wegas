/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class Views {

    /**
     *
     * @param str
     *
     * @return Views.Class matching str or public
     */
    public static Class stringToView(String str) {
        switch (str) {
            case "Extended":
                return Extended.class;

            case "Export":
                return Export.class;

            case "Instance":
                return Instance.class;

            case "Lobby":
                return Lobby.class;

            case "Editor":
                return Editor.class;

            case "Admin":
                return Admin.class;

            case "Public":
            default:
                return Public.class;
        }
    }

    /**
     * Index minimal (w/ ids)
     */
    public interface IndexI {
    }

    /**
     * FUCK
     */
    public interface LobbyI {
    }

    /**
     * Potential heavy text Extended (w/ blob texts)
     */
    public interface ExtendedI {
    }

    /**
     * Relevant only to editors EditorI view (w/ scripts, impacts)
     */
    public interface EditorI {
    }

    /**
     * TO be included in exports
     */
    public interface ExportI {
    }

    /**
     * Provides VariableDescriptor instances
     */
    public interface InstanceI {
    }

    /**
     * Minimal view with IDs
     */
    public static class Public extends Views implements IndexI {
    }

    /**
     * View with IDs and blobs
     */
    public static class Extended extends Views implements ExtendedI, IndexI {
    }

    /**
     * contains protected contents (like shadowed email)
     */
    public static class Admin extends Views implements ExtendedI, IndexI {
    }

    /**
     * View relevant to Editors with blobs
     */
    public static class Editor extends Views implements EditorI, ExtendedI, IndexI {
    }

    /**
     * View relevant to Lobby without Editor items
     */
    public static class Lobby extends Views implements ExtendedI, IndexI, LobbyI {
    }

    /**
     * Editor view with VariableInstance embed into VariableDescriptors'Scope
     */
    public static class Instance extends Views implements InstanceI, EditorI, ExtendedI, IndexI {
    }

    /**
     * Do not include ids nor VariableInstances, Export usage
     */
    public static class Export extends Views implements EditorI, ExtendedI, ExportI {
    }
}
