/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.merge.patch;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.merge.utils.WegasCallback;
import java.lang.reflect.Method;

/**
 *
 * @author maxence
 */
public abstract class WegasPatch {

    public static enum PatchMode {
        CREATE,
        DELETE,
        UPDATE,
        OVERRIDE
    }

    protected Object identifier;

    protected PatchMode mode;

    protected Integer order;

    protected Method getter;

    protected Method setter;

    protected WegasCallback fieldCallback;

    public Object getIdentifier() {
        return identifier;
    }

    public void setIdentifier(Object identifier) {
        this.identifier = identifier;
    }

    public PatchMode getMode() {
        return mode;
    }

    public void setMode(PatchMode mode) {
        this.mode = mode;
    }

    public Integer getOrder() {
        return order;
    }

    public void setOrder(Integer order) {
        this.order = order;
    }

    public WegasCallback getUserCallback() {
        return fieldCallback;
    }

    public void setUserCallback(WegasCallback userCallback) {
        this.fieldCallback = userCallback;
    }

    public void apply(AbstractEntity target){
        this.apply(target, null);
    }

    public abstract void apply(AbstractEntity target, WegasCallback callback);
}
