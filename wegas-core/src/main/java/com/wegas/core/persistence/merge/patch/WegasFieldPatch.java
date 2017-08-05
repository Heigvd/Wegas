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

    WegasFieldPatch(Object identifier, int order, PatchMode mode,
            WegasCallback userCallback,
            Method getter, Method setter, Object fromValue, Object toValue) {
        this.mode = mode;
        this.order = order;
        this.identifier = identifier;
        this.getter = getter;
        this.setter = setter;
        this.fromValue = fromValue;
        this.toValue = toValue;
        this.fieldCallback = userCallback;
    }

    @Override
    public void apply(AbstractEntity target, WegasCallback callback) {
        try {
            Object oldValue = getter.invoke(target);
            if (mode.equals(PatchMode.OVERRIDE) || Objects.equals(oldValue, fromValue)) {

                if (callback != null) {
                    callback.preUpdate(target, toValue, identifier);
                }

                if (fieldCallback != null) {
                    fieldCallback.preUpdate(target, toValue, identifier);
                }

                setter.invoke(target, toValue);

                if (callback != null) {
                    callback.postUpdate(target, toValue, identifier);
                }

                if (fieldCallback != null) {
                    fieldCallback.postUpdate(target, toValue, identifier);
                }
            }
        } catch (Exception ex) {
            throw new RuntimeException(ex);
        }
    }
}
