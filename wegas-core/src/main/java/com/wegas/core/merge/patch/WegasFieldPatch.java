/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.merge.patch;

import com.wegas.core.merge.utils.LifecycleCollector;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.merge.utils.WegasCallback;
import com.wegas.core.persistence.variable.ModelScoped;
import com.wegas.core.persistence.variable.ModelScoped.Visibility;
import java.lang.reflect.Method;
import java.util.List;
import java.util.Objects;

/**
 *
 * @author maxence
 */
public final class WegasFieldPatch extends WegasPatch {

    private Object fromValue;
    private Object toValue;
    private AbstractEntity entity;

    WegasFieldPatch(Object identifier, int order,
            WegasCallback userCallback, AbstractEntity entity,
            Method getter, Method setter, Object fromValue, Object toValue,
            boolean ignoreNull, boolean sameEntityOnly, boolean initOnly,
            Visibility[] cascade) {
        super(identifier, order, getter, setter, userCallback, ignoreNull, sameEntityOnly, initOnly, false, cascade);
        this.identifier = identifier;
        this.fromValue = fromValue;
        this.toValue = toValue;
        this.entity = entity;

    }

    @Override
    public LifecycleCollector apply(AbstractEntity target, WegasCallback callback, PatchMode parentMode, ModelScoped.Visibility visibility, LifecycleCollector collector, Integer numPass) {
        if (numPass < 2) {
            try {
                if (shouldApplyPatch(target, entity)) {
                    Object oldTargetValue = getter.invoke(target);
                    if (!parentMode.equals(PatchMode.DELETE)) {
                        if (oldTargetValue == null
                                || parentMode.equals(PatchMode.OVERRIDE)
                                || (!initOnly && Objects.equals(oldTargetValue, fromValue))) {
                            if (!ignoreNull || toValue != null) {

                                logger.debug("Apply {} := {} => (from {} to {})", identifier, oldTargetValue, fromValue, toValue);
                                List<WegasCallback> callbacks = this.getCallbacks(callback);

                                for (WegasCallback cb : callbacks) {
                                    cb.preUpdate(target, toValue, identifier);
                                }

                                setter.invoke(target, toValue);

                                for (WegasCallback cb : callbacks) {
                                    cb.postUpdate(target, toValue, identifier);
                                }
                            } else {
                                logger.debug("REJECT IGNORE NULL {} := {} => (from {} to {})", identifier, oldTargetValue, fromValue, toValue);
                            }

                        } else {
                            logger.debug("REJECT  NO RE-INIT OR USER CHANGE {} := {} => (from {} to {})", identifier, oldTargetValue, fromValue, toValue);
                        }
                    } else {
                        logger.debug("REJECT {} : DELETE", this);
                    }
                } else {
                    logger.debug("REJECT {}: SAME_ENTITY_ONLY FAILED {} ->  {}", this, target, entity);
                }
            } catch (Exception ex) {
                throw new RuntimeException(ex);
            }
        }
        return collector;
    }

    @Override
    protected StringBuilder print(int ident) {
        StringBuilder sb = super.print(ident);
        sb.append(" from ").append(fromValue).append(" to ").append(toValue);
        return sb;
    }

}
