/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class Views {

    private Views(){
        // empty private constructor prevents the class to be initialised
    }

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

            case "Shadow":
                return Shadow.class;

            case "Public":
            default:
                return Public.class;
        }
    }

    /**
     * PublicI
     */
    public interface PublicI {
    }

    /**
     * Index minimal (w/ ids)
     */
    public interface IndexI {
    }

    /**
     * Depict items which are required to display lists in lobby
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
     * Include private shadowed info
     */
    public interface ShadowI {
    }

    /**
     * Minimal view with IDs
     */
    public static class Public extends Views implements PublicI, IndexI {
    }

    /**
     * View with IDs and blobs
     */
    public static class Extended extends Public implements ExtendedI {
    }

    /**
     * contains protected contents (like shadowed email & password hash)
     */
    public static class Shadow extends Extended implements ShadowI {
    }

    /**
     * View relevant to Editors with blobs
     */
    public static class Editor extends Extended implements EditorI {
    }

    /**
     * View relevant to Lobby without Editor nor Extended items
     */
    public static class Lobby extends Public implements LobbyI {
    }

    /**
     * Editor view with VariableInstance embed into VariableDescriptors'Scope
     */
    public static class Instance extends Editor implements InstanceI {
    }

    /**
     * Do not include ids nor VariableInstances, Export usage
     */
    public static class Export extends Views implements PublicI, EditorI, ExtendedI, ExportI {
    }
}
