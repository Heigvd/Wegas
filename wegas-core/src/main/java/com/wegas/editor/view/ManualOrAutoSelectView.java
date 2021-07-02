/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.editor.view;

/**
 * drop-down select.
 *
 * @author maxence
 */
public class ManualOrAutoSelectView extends SelectView {

    /**
     * Create a select view with MANUAL and AUTO choices.
     */
    public ManualOrAutoSelectView() {
        super(
            new Choice("Automatic", "AUTO"),
            new Choice("Manual", "MANUAL")
        );
        this.setLabel("Depends-on strategy");
    }
}
