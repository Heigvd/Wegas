/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

package com.wegas.core.rest.util;

import com.wegas.core.persistence.game.Script;
import java.util.Map;

/**
 *
 * @author maxence
 */
public class LoadedScript {

    private Script script;

    private Map<String, Object> payload;

    public Script getScript() {
        return script;
    }

    public void setScript(Script script) {
        this.script = script;
    }

    public Map<String, Object> getPayload() {
        return payload;
    }

    public void setPayload(Map<String, Object> payload) {
        this.payload = payload;
    }

}
