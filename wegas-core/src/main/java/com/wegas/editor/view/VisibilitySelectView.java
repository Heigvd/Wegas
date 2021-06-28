/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.editor.view;

/**
 * @author maxence
 */
public class VisibilitySelectView extends SelectView {

    public VisibilitySelectView() {
        super(
                new Choice("Model", "INTERNAL"),
                new Choice("Protected", "PROTECTED"),
                new Choice("Inherited", "INHERITED"),
                new Choice("Private", "PRIVATE")
        );
        this.setLabel("Visibility");
    }
}
