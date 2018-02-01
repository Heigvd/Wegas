/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.merge.patch;

import com.wegas.core.merge.utils.LifecycleCollector;
import com.wegas.core.merge.utils.WegasCallback;
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.variable.ModelScoped;
import com.wegas.core.persistence.variable.ModelScoped.ProtectionLevel;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.List;
import java.util.Objects;

/**
 * Patch for primitive value.
 * <p>
 * There is two cases. First one patch an entity field with the help of getter and setter.
 * The second one patch a primitive within a collection or a map.
 *
 * @author maxence
 */
public final class WegasPrimitivePatch extends WegasPatch {

    private Object fromValue;
    private Object toValue;

    private Mergeable toEntity;

    /**
     * patch through getter and setter or with add/remove callback ?
     */
    private boolean isField;

    /**
     *
     * @param identifier     primitive identified (field name or map key)
     * @param order          patch index
     * @param userCallback
     * @param entity         parent entity which owns the field (field case only)
     * @param getter         getter to fetch value from entity (field case only)
     * @param setter         setter to set the value in entity
     * @param fromValue      previous value
     * @param toValue        new value
     * @param ignoreNull     should ignore new null value ?
     * @param sameEntityOnly avoid patching another entity (toEntity must equals apply(target,...);
     * @param initOnly       only set if value to patch is null
     * @param cascade
     */
    WegasPrimitivePatch(Object identifier, int order,
            WegasCallback userCallback, Mergeable entity,
            Method getter, Method setter, Object fromValue, Object toValue,
            boolean ignoreNull, boolean sameEntityOnly, boolean initOnly,
            ProtectionLevel protectionLevel) {
        super(identifier, order, getter, setter, userCallback, ignoreNull, sameEntityOnly, initOnly, false, protectionLevel);
        this.identifier = identifier;
        this.fromValue = fromValue;
        this.toValue = toValue;
        this.toEntity = entity;

        /**
         *
         */
        this.isField = this.setter != null;
    }

    private boolean isProtected(Mergeable target, boolean bypassVisibility) {
        return isField // not yet implemented for primitive lists
                && !bypassVisibility // target is never protected when bypassing visibilities
                && target.isProtected() // and target is protected
                && this.toEntity != null && this.toEntity.isProtected(); // toEntity is also protected (ie allows changes from upstream)
    }

    @Override
    public LifecycleCollector apply(GameModel targetGameModel, Object target, WegasCallback callback, PatchMode parentMode, ModelScoped.Visibility visibility, LifecycleCollector collector, Integer numPass, boolean bypassVisibility) {
        Mergeable targetEntity = null;

        if (isField) {
            targetEntity = (Mergeable) target;
        }

        if (numPass < 2) {
            try {
                if (!isField || shouldApplyPatch(targetEntity, toEntity)) {
                    Object oldTargetValue;
                    if (isField) {
                        oldTargetValue = getter.invoke(targetEntity);
                    } else {
                        oldTargetValue = target;
                    }
                    PatchMode myMode = this.updateOrOverride(visibility, null);
                    logger.trace("MyMode: {}", myMode);

                    if (!initOnly || oldTargetValue == null) { // do no overwrite non-null value if initOnly is set
                        if (myMode.equals(PatchMode.OVERRIDE) || (Objects.equals(oldTargetValue, fromValue))) { // do not override user-change but in protected mode
                            if (!myMode.equals(PatchMode.OVERRIDE) || !isProtected(targetEntity, bypassVisibility)) { // prevent protected changes
                                if (!ignoreNull || toValue != null) {

                                    logger.debug("Apply {} := {} => (from {} to {})", identifier, oldTargetValue, fromValue, toValue);
                                    List<WegasCallback> callbacks = this.getCallbacks(callback);

                                    for (WegasCallback cb : callbacks) {
                                        cb.preUpdate(targetEntity, toValue, identifier);
                                    }

                                    if (isField) {
                                        if (!parentMode.equals(PatchMode.DELETE)) { // skip delete mode
                                            setter.invoke(targetEntity, toValue);
                                        } else {
                                            logger.debug("SKIP MODIFICATION {} : DELETE", this);
                                        }
                                    } else {
                                        for (WegasCallback cb : callbacks) {
                                            Object key = null;

                                            if (oldTargetValue != null) {
                                                key = cb.remove(oldTargetValue, null, identifier);
                                            } else {
                                                key = identifier;
                                            }
                                            if (toValue != null) {
                                                cb.add(toValue, null, key);
                                            }
                                        }
                                    }

                                    for (WegasCallback cb : callbacks) {
                                        cb.postUpdate(targetEntity, toValue, identifier);
                                    }
                                } else {
                                    logger.debug("REJECT IGNORE NULL {} := {} => (from {} to {})", identifier, oldTargetValue, fromValue, toValue);
                                }
                            } else {
                                logger.debug("PROHIBITED CHANGE {} := {} => (from {} to {})", identifier, oldTargetValue, fromValue, toValue);
                            }
                        } else {
                            logger.debug("REJECT USER CHANGE {} := {} => (from {} to {})", identifier, oldTargetValue, fromValue, toValue);
                        }
                    } else {
                        logger.debug("REJECT NO RE-INIT {} := {} => (from {} to {})", identifier, oldTargetValue, fromValue, toValue);
                    }
                } else {
                    logger.debug("REJECT {}: SAME_ENTITY_ONLY FAILED {} ->  {}", this, targetEntity, toEntity);
                }
            } catch (IllegalAccessException | IllegalArgumentException | InvocationTargetException ex) {
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
