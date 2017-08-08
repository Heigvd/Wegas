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
import java.util.List;
import java.util.Objects;

/**
 *
 * @author maxence
 */
public final class WegasFieldPatch extends WegasPatch {

    private Method getter;
    private Method setter;
    private Object fromValue;
    private Object toValue;
    private AbstractEntity entity;

    WegasFieldPatch(Object identifier, int order, PatchMode mode,
            WegasCallback userCallback, AbstractEntity entity,
            Method getter, Method setter, Object fromValue, Object toValue,
            boolean sameEntityOnly, boolean initOnly) {
        this.mode = mode;
        this.order = order;
        this.identifier = identifier;
        this.getter = getter;
        this.setter = setter;
        this.fromValue = fromValue;
        this.toValue = toValue;
        this.fieldCallback = userCallback;
        this.sameEntityOnly = sameEntityOnly;
        this.initOnly = initOnly;
        this.entity = entity;

    }

    @Override
    public void apply(AbstractEntity target, WegasCallback callback) {
        try {
            if (shouldApplyPatch(target, entity)) {
                Object oldValue = getter.invoke(target);
                if (!initOnly || oldValue == null) {
                    if (mode.equals(PatchMode.OVERRIDE) || Objects.equals(oldValue, fromValue)) {

                        List<WegasCallback> callbacks = this.getCallbacks(callback);

                        for (WegasCallback cb : callbacks) {
                            cb.preUpdate(target, toValue, identifier);
                        }

                        setter.invoke(target, toValue);

                        for (WegasCallback cb : callbacks) {
                            cb.postUpdate(target, toValue, identifier);
                        }
                    }
                }
            }
        } catch (Exception ex) {
            throw new RuntimeException(ex);
        }
    }
}
