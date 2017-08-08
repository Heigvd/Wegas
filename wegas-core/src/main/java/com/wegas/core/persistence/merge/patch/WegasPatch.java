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
import java.util.ArrayList;
import java.util.List;

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

    protected boolean sameEntityOnly;

    protected boolean initOnly;

    protected List<WegasCallback> getCallbacks(WegasCallback userCallback) {
        ArrayList<WegasCallback> cbs = new ArrayList<>();
        if (fieldCallback != null) {
            cbs.add(this.fieldCallback);
        }
        if (userCallback != null) {
            cbs.add(userCallback);
        }
        return cbs;
    }

    protected boolean shouldApplyPatch(AbstractEntity target, AbstractEntity reference) {
        return (!sameEntityOnly || target.equals(reference));
    }

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

    public void apply(AbstractEntity target) {
        this.apply(target, null);
    }

    public abstract void apply(AbstractEntity target, WegasCallback callback);
}
