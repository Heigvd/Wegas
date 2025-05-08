/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.game;

import com.wegas.core.Helper;
import jakarta.persistence.Entity;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
public class DebugGame extends Game {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    public final static String DEBUGGAMENAME = "Test game";

    /**
     *
     */
    public DebugGame() {
        super(DEBUGGAMENAME + "-" + Helper.genToken(10), Helper.genToken(10));  // Name is fixed (with a suffix so it wont break unique name constraint)
    }
}
