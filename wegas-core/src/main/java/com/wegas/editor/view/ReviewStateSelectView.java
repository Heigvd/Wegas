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
public class ReviewStateSelectView extends SelectView {

    public ReviewStateSelectView() {
        super(
                new Choice("Discarded", "DISCARDED"),
                new Choice("Evicted", "EVICTED"),
                new Choice("Not started", "NOT_STARTED"),
                new Choice("Submitted", "SUBMITTED"),
                new Choice("Dispatched", "DISPATCHED"),
                new Choice("Notified", "NOTIFIED"),
                new Choice("Completed", "COMPLETED")
        );
        this.setLabel("Review State");
    }
}
