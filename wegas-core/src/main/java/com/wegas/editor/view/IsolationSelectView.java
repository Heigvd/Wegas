/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.editor.view;

/**
 * @author maxence
 */
public class IsolationSelectView extends SelectView {

    public IsolationSelectView() {
        super(
                new Choice("OPEN", "OPEN"),
                new Choice("SECURED", "SECURED")//,
                //new Choice("HIDDEN", "HIDDEN")// not fully implemented hide the hidden option !
        );
        this.setLabel("Isolation");
    }
}
