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
public abstract class SelectView extends CommonView {

    private final Choice[] choices;

    protected SelectView(Choice... choices) {
        this.choices = choices;
    }

    @Override
    public String getType() {
        return "select";
    }

    public Choice[] getChoices() {
        return choices;
    }

    public static class Choice {

        private final String label;
        private final Object value;

        public Choice(String value) {
            this(value, value);
        }

        public Choice(String label, Object value) {
            this.label = label;
            this.value = value;
        }

        public String getLabel() {
            return label;
        }

        public Object getValue() {
            return value;
        }
    }

    public static class FreeForAllSelector extends SelectView {

        public FreeForAllSelector() {
            super(new Choice("individually", Boolean.TRUE),
                    new Choice("in team", Boolean.FALSE));
        }
    }

    public static class ScriptLanguageSelector extends SelectView {

        public ScriptLanguageSelector() {
            super(new Choice("JavaScript"));
        }
    }

    public static class ScopeSelector extends SelectView {

        public ScopeSelector() {
            super(
                    new Choice("each player", "PlayerScope"),
                    new Choice("each team", "TeamScope"),
                    new Choice("the whole game", "GameModelScope")
            );
        }
    }

    public static class BScopeSelector extends SelectView {

        public BScopeSelector() {
            super(
                    new Choice("the player only", "PlayerScope"),
                    new Choice("team members", "TeamScope"),
                    new Choice("everybody", "GameModelScope")
            );
        }
    }

    public static class WorkSkills extends SelectView {

        public WorkSkills() {
            super(
                    new Choice("Sales"),
                    new Choice("Engineer"),
                    new Choice("HR")
            );
        }
    }

    public static class WorkLevels extends SelectView {

        public WorkLevels() {
            super(
                    new Choice("Apprentice*", 1),
                    new Choice("Apprentice**", 2),
                    new Choice("Apprentice***", 3),
                    new Choice("Junior*", 4),
                    new Choice("Junior**", 5),
                    new Choice("Junior***", 6),
                    new Choice("Senior*", 7),
                    new Choice("Senior**", 8),
                    new Choice("Senior***", 9),
                    new Choice("Expert*", 10),
                    new Choice("Expert**", 11),
                    new Choice("Expert***", 12)
            );
        }
    }
}
