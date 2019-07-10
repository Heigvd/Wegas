/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.editor.View;

/**
 * @author maxence
 */
public abstract class ScriptView extends CommonView {

    @Override
    public String getType() {
        return "script";
    }

    public abstract String getMode();

    public static class Condition extends ScriptView {

        @Override
        public String getMode() {
            return "GET";
        }

    }

    public static class Impact extends ScriptView {

        @Override
        public String getMode() {
            return "SET";
        }
    }
}
