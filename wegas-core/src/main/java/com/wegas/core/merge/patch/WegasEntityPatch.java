/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.merge.patch;

import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.merge.annotations.WegasEntityProperty;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.merge.annotations.WegasEntity;
import com.wegas.core.merge.utils.EmptyCallback;
import com.wegas.core.merge.utils.LifecycleCollector;
import com.wegas.core.merge.utils.WegasCallback;
import com.wegas.core.persistence.variable.ModelScoped;
import com.wegas.core.persistence.variable.ModelScoped.Visibility;
import com.wegas.core.persistence.variable.VariableDescriptor;
import java.beans.PropertyDescriptor;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

/**
 *
 * @author maxence
 */
public final class WegasEntityPatch extends WegasPatch {

    /**
     * Changes to apply
     */
    private List<WegasPatch> patches;

    private AbstractEntity fromEntity;
    private AbstractEntity toEntity;

    private List<WegasCallback> entityCallbacks;

    @Override
    protected List<WegasCallback> getCallbacks(WegasCallback userCallback) {
        List<WegasCallback> callbacks = super.getCallbacks(userCallback);
        callbacks.addAll(0, this.entityCallbacks);
        return callbacks;
    }

    public WegasEntityPatch(AbstractEntity from, AbstractEntity to, Boolean recursive) {
        this(null, 0, null, null, null, from, to, recursive, false, false, false, new Visibility[]{Visibility.INTERNAL, Visibility.PROTECTED});
    }

    /**
     * Compute diff between two entities
     *
     * @param identifier
     * @param order
     * @param mode
     * @param userCallback
     * @param getter
     * @param setter
     * @param from
     * @param to
     * @param recursive
     *
     */
    WegasEntityPatch(Object identifier, int order,
            WegasCallback userCallback, Method getter, Method setter,
            AbstractEntity from, AbstractEntity to, boolean recursive,
            boolean ignoreNull, boolean sameEntityOnly, boolean initOnly,
            Visibility[] cascade) {

        super(identifier, order, getter, setter, userCallback, ignoreNull, sameEntityOnly, initOnly, recursive, cascade);

        if ((from == null && to == null) // both entity are null
                || (from != null && to != null && !from.getClass().equals(to.getClass()))) {
            throw WegasErrorMessage.error("imcompatible entities");
        }

        try {

            this.fromEntity = from;
            this.toEntity = to;

            this.patches = new ArrayList<>();

            Class klass = (fromEntity != null) ? fromEntity.getClass() : toEntity.getClass();
            Map<Field, WegasEntityProperty> fields = new HashMap<>();

            this.entityCallbacks = new ArrayList<>();

            /*
             * Fetch all (inherited) WegasEntity annotations and all WegasEntityProperty annotated fields
             */
            while (klass != null) {

                for (Field f : klass.getDeclaredFields()) {
                    WegasEntityProperty wegasProperty = f.getDeclaredAnnotation(WegasEntityProperty.class);

                    /*
                     *  Only cares about annotated fields and exclude nonDefaultFields if the patch is not recursive
                     */
                    if (wegasProperty != null && (wegasProperty.includeByDefault() || recursive)) {
                        fields.put(f, wegasProperty);
                    }
                }

                /*
                 * Fetch all class level WegasEntity annotations
                 */
                WegasEntity wegasEntity = (WegasEntity) klass.getAnnotation(WegasEntity.class);
                if (wegasEntity != null) {
                    Class<? extends WegasCallback> entityCallbackClass = wegasEntity.callback();

                    if (entityCallbackClass != null && !entityCallbackClass.equals(EmptyCallback.class)) {
                        this.entityCallbacks.add(entityCallbackClass.newInstance());
                    }
                }

                klass = klass.getSuperclass();
            }

            if (fromEntity != null || this.toEntity != null) {

                // process @WegasEntityProperty fields
                for (Entry<Field, WegasEntityProperty> entry : fields.entrySet()) {
                    // Get field info 
                    Field field = entry.getKey();
                    WegasEntityProperty wegasProperty = entry.getValue();

                    String fieldName = field.getName();
                    Class fieldClass = field.getType();

                    PropertyDescriptor property = new PropertyDescriptor(fieldName, field.getDeclaringClass());

                    Method fGetter = property.getReadMethod();
                    Method fSetter = property.getWriteMethod();

                    // Get annotation properties
                    int idx = wegasProperty.order();

                    boolean fIgnoreNull = wegasProperty.ignoreNull();
                    boolean fSameEntityOnly = wegasProperty.sameEntityOnly();
                    boolean fInitOnly = wegasProperty.initOnly();
                    Visibility[] fCascadeOverride = wegasProperty.cascadeOverride();

                    Class<? extends WegasCallback> userFieldCallbackClass = wegasProperty.callback();

                    WegasCallback userFieldCallback = null;
                    if (userFieldCallbackClass != null && !userFieldCallbackClass.equals(EmptyCallback.class)) {
                        userFieldCallback = userFieldCallbackClass.newInstance();
                    }

                    // Get effective from and to values
                    Object fromValue = fromEntity != null ? fGetter.invoke(fromEntity) : null;
                    Object toValue = toEntity != null ? fGetter.invoke(toEntity) : null;

                    //if (!fIgnoreNull || toValue != null) {
                    // Which case ?
                    if (wegasProperty.propertyType().equals(WegasEntityProperty.PropertyType.CHILDREN)
                            && (List.class.isAssignableFrom(fieldClass) || Map.class.isAssignableFrom(fieldClass))) {
                        /*
                             * current property is a list or a map of abstract entities
                         */
                        patches.add(new WegasChildrenPatch(fieldName, idx,
                                userFieldCallback, to,
                                fGetter, fSetter,
                                fromValue, toValue,
                                recursive, fIgnoreNull, fSameEntityOnly, fInitOnly, fCascadeOverride));
                    } else if (AbstractEntity.class.isAssignableFrom(fieldClass)) {
                        /*
                            * the property is an abstract entity -> register patch
                         */
                        patches.add(new WegasEntityPatch(fieldName, idx,
                                userFieldCallback,
                                fGetter, fSetter,
                                (AbstractEntity) fromValue, (AbstractEntity) toValue,
                                recursive, fIgnoreNull, fSameEntityOnly, fInitOnly, fCascadeOverride));
                    } else {
                        // fallback -> primitive or primitive related property (eg. Boolean, List<Double>, Map<String, String>, etc)
                        patches.add(new WegasFieldPatch(fieldName, idx,
                                userFieldCallback, to,
                                fGetter, fSetter, fromValue, toValue,
                                fIgnoreNull, fSameEntityOnly, fInitOnly, fCascadeOverride));
                    }

                    //}
                }
                Collections.sort(patches, new PatchOrderComparator());
            }

        } catch (Exception ex) {
            throw new RuntimeException(ex);
        }
    }

    @Override
    public LifecycleCollector apply(AbstractEntity target, WegasCallback callback, PatchMode parentMode, Visibility inheritedVisibility, LifecycleCollector collector, Integer numPass) {

        /**
         * Two pass patch
         * First pass update and delete
         * Second create/move entities
         */
        boolean rootPatch = false;
        boolean processCollectedData = false;

        if (collector == null) {
            collector = new LifecycleCollector();
            processCollectedData = true;
        }
        if (numPass == null) {
            numPass = 0;
        }
        if (numPass == 0) {
            rootPatch = true;
        }

        logger.info("Apply #{} {} (from {} -> to {}) on {}", numPass, this.getClass().getSimpleName(), fromEntity, toEntity, target);
        logger.indent();

        do {
            if (rootPatch) {
                numPass++;
            }
            try {
                AbstractEntity oTarget = target;
                if (getter != null) {
                    target = (AbstractEntity) getter.invoke(oTarget);
                }

                if (!ignoreNull || toEntity != null) {
                    if (!initOnly || target == null) {
                        List<WegasCallback> callbacks = this.getCallbacks(callback);

                        Visibility visibility = null;
                        Visibility ownVisibility = null;
                        if (toEntity instanceof ModelScoped) {
                            ownVisibility = ((ModelScoped) toEntity).getVisibility();
                            visibility = ownVisibility;
                        }
                        PatchMode myMode = this.getPatchMode(target, fromEntity, toEntity, parentMode, inheritedVisibility, ownVisibility);

                        if (visibility == null) {
                            visibility = inheritedVisibility;
                        }
                        logger.debug("MODE IS: " + myMode);

                        if (myMode != null) {
                            switch (myMode) {
                                case CREATE:
                                    if (numPass > 1) {
                                        logger.debug(" CREATE CLONE");

                                        if (collector.getDeleted().containsKey(toEntity.getRefId())) {
                                            // the newEntity to create has just been removed from another list -> MOVE
                                            logger.debug(" -> MOVE JUST DELETED");

                                            // Fetch previously deleted entity
                                            LifecycleCollector.CollectedEntity remove = collector.getDeleted().remove(toEntity.getRefId());

                                            target = remove.getEntity();

                                            for (WegasCallback cb : callbacks) {
                                                cb.preUpdate(target, this.toEntity, identifier);
                                            }

                                            // Force update
                                            WegasEntityPatch createPatch = new WegasEntityPatch(remove.getPayload(), toEntity, true);
                                            createPatch.apply(target, null, PatchMode.UPDATE, visibility, collector, null);

                                            for (WegasCallback cb : callbacks) {
                                                cb.add(target, null, identifier);
                                            }

                                            for (WegasCallback cb : callbacks) {
                                                cb.postUpdate(target, this.toEntity, identifier);
                                            }

                                        } else {
                                            //newEntity = toEntity.clone(); //   -> INTERNAL CLONE
                                            target = toEntity.getClass().newInstance();
                                            WegasEntityPatch clone = new WegasEntityPatch(target, toEntity, true);
                                            clone.apply(target, null, PatchMode.UPDATE, visibility, collector, null);

                                            for (WegasCallback cb : callbacks) {
                                                cb.add(target, null, identifier);
                                            }
                                            collector.getCreated().put(target.getRefId(), new LifecycleCollector.CollectedEntity(target, toEntity, callbacks));

                                        }
                                        if (setter != null) {
                                            setter.invoke(oTarget, target);
                                        }
                                    } else {
                                        logger.debug("SKIP CREATION DURING 1st pass");
                                    }
                                    break;
                                case DELETE:
                                    if (numPass < 2) {
                                        logger.debug(" DELETE");

                                        if (fromEntity != null && target != null) {

                                            // DELETE CHILDREN TOO TO COLLECT THEM
                                            for (WegasPatch patch : patches) {
                                                patch.apply(target, null, myMode, visibility, collector, numPass);
                                            }

                                            String refId = fromEntity.getRefId();
                                            // Should include all AbstractEntity contained within target, so they can be reused by CREATE case
                                            collector.getDeleted().put(refId, new LifecycleCollector.CollectedEntity(target, fromEntity, callbacks));

                                            for (WegasCallback cb : callbacks) {
                                                cb.remove(target, null, identifier);
                                            }

                                            if (setter != null) {
                                                setter.invoke(oTarget, (Object) null);
                                            }
                                        }
                                    }
                                    break;
                                case SKIP:
                                    logger.debug("SKIP");
                                    break;
                                default:
                                    if (shouldApplyPatch(target, toEntity)) {
                                        if (numPass > 1) {
                                            for (WegasCallback cb : callbacks) {
                                                cb.preUpdate(target, this.toEntity, identifier);
                                            }
                                        }

                                        for (WegasPatch patch : patches) {
                                            patch.apply(target, null, myMode, visibility, collector, numPass);
                                        }

                                        if (numPass > 1) {
                                            for (WegasCallback cb : callbacks) {
                                                cb.postUpdate(target, this.toEntity, identifier);
                                            }
                                        }
                                    } else {
                                        logger.debug(" REJECT ENTITY PATCH: SAME_ENTITY_ONLY FAILED");
                                    }
                                    break;
                            }
                        }
                    } else {
                        logger.debug("REJECT PATCH : NO RE-INIT");
                    }

                } else {
                    logger.debug("REJECT PATCH : IGNORE NULL");
                }

            } catch (Exception ex) {
                throw new RuntimeException(ex);
            }
        } while (rootPatch && numPass < 2);

        logger.info("  ** DONE {} (from {} to {}) on {}", this.getClass().getSimpleName(), fromEntity, toEntity, target);

        if (processCollectedData) {
            // TODO: @WegasEntity(finalizer = MyFinalizer.class)

            // Finalize patch
            logger.info("Collect: {}", collector);
            VariableDescriptorFacade vdf = null;

            // ->  implement as callbacks !!!!
            for (Entry<String, LifecycleCollector.CollectedEntity> entry : collector.getDeleted().entrySet()) {
                LifecycleCollector.CollectedEntity collectedEntity = entry.getValue();
                AbstractEntity entity = collectedEntity.getEntity();

                List<WegasCallback> callbacks = collectedEntity.getCallbacks();
                if (callbacks != null) {
                    for (WegasCallback cb : callbacks) {
                        cb.destroy(entity, identifier);
                    }
                }

                if (vdf == null) {
                    vdf = VariableDescriptorFacade.lookup();
                }

                vdf.removeAbstractEntity(entity);
            }

            for (Entry<String, LifecycleCollector.CollectedEntity> entry : collector.getCreated().entrySet()) {
                LifecycleCollector.CollectedEntity collectedEntity = entry.getValue();
                AbstractEntity entity = collectedEntity.getEntity();

                List<WegasCallback> callbacks = collectedEntity.getCallbacks();
                if (callbacks != null) {
                    for (WegasCallback cb : callbacks) {
                        cb.persist(entity, identifier);
                    }
                }
            }
        }

        logger.unindent();
        return collector;
    }

    private static final class PatchOrderComparator implements Comparator<WegasPatch> {

        @Override
        public int compare(WegasPatch o1, WegasPatch o2) {
            return o1.getOrder() - o2.getOrder();
        }
    }

    @Override
    protected StringBuilder print(int ident) {
        StringBuilder sb = super.print(ident);
        newLine(sb, ident);
        sb.append("Entity ").append(toEntity);
        if (entityCallbacks.size() > 0) {
            newLine(sb, ident);
            sb.append("EntityCallback:");
            for (WegasCallback wc : entityCallbacks) {
                newLine(sb, ident);
                sb.append(" * ").append(wc);
            }
        }
        for (WegasPatch patch : patches) {
            newLine(sb, ident);
            sb.append(patch.print(ident + 1));
        }
        return sb;
    }
}
