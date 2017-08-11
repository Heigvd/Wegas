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
import com.wegas.core.persistence.game.GameModel;
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
        this(null, 0, null, null, null, from, to, recursive, false, false, new Visibility[]{Visibility.INTERNAL, Visibility.PROTECTED});
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
            boolean sameEntityOnly, boolean initOnly,
            Visibility[] cascade) {

        super(identifier, order, getter, setter, userCallback, sameEntityOnly, initOnly, recursive, cascade);

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

            if (fromEntity != null && this.toEntity != null) {

                for (Entry<Field, WegasEntityProperty> entry : fields.entrySet()) {
                    Field field = entry.getKey();
                    WegasEntityProperty wegasProperty = entry.getValue();

                    String fieldName = field.getName();
                    Class fieldClass = field.getType();

                    int idx = wegasProperty.order();

                    boolean ignoreNull = wegasProperty.ignoreNull();
                    boolean fSameEntityOnly = wegasProperty.sameEntityOnly();
                    boolean fInitOnly = wegasProperty.initOnly();
                    Visibility[] fCascadeOverride = wegasProperty.cascadeOverride();

                    Class<? extends WegasCallback> userFieldCallbackClass = wegasProperty.callback();

                    WegasCallback userFieldCallback = null;
                    if (userFieldCallbackClass != null && !userFieldCallbackClass.equals(EmptyCallback.class)) {
                        userFieldCallback = userFieldCallbackClass.newInstance();
                    }

                    PropertyDescriptor property = new PropertyDescriptor(fieldName, field.getDeclaringClass());

                    Method fGetter = property.getReadMethod();
                    Method fSetter = property.getWriteMethod();

                    Object fromValue = fGetter.invoke(fromEntity);
                    Object toValue = fGetter.invoke(toEntity);

                    if (!ignoreNull || toValue != null) {

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
                                    recursive, ignoreNull, fSameEntityOnly, fInitOnly, fCascadeOverride));
                        } else if (AbstractEntity.class.isAssignableFrom(fieldClass)) {
                            /*
                            * the property is an abstract entity -> register patch
                             */
                            patches.add(new WegasEntityPatch(fieldName, idx,
                                    userFieldCallback,
                                    fGetter, fSetter,
                                    (AbstractEntity) fromValue, (AbstractEntity) toValue,
                                    recursive, fSameEntityOnly, fInitOnly, fCascadeOverride));
                        } else {
                            // fallback -> primitive or primitive related property (eg. Boolean, List<Double>, Map<String, String>, etc)
                            patches.add(new WegasFieldPatch(fieldName, idx,
                                    userFieldCallback, to,
                                    fGetter, fSetter, fromValue, toValue,
                                    fSameEntityOnly, fInitOnly, fCascadeOverride));
                        }

                    }
                }
                Collections.sort(patches, new PatchOrderComparator());
            }

        } catch (Exception ex) {
            throw new RuntimeException(ex);
        }
    }

    @Override
    public LifecycleCollector apply(AbstractEntity target, WegasCallback callback, PatchMode parentMode, Visibility inheritedVisibility, LifecycleCollector collector, Integer numPass) {
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
        do {
            if (rootPatch) {
                numPass++;
            }
            try {
                AbstractEntity oTarget = target;
                if (getter != null) {
                    target = (AbstractEntity) getter.invoke(oTarget);
                }
                logger.info("Apply #{} {} {} -> {}", numPass, this.getClass().getSimpleName(), fromEntity, target);

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

                                    AbstractEntity newEntity;
                                    if (collector.getDeleted().containsKey(toEntity.getRefId())) {
                                        // the newEntity to create has just been removed from another list -> MOVE
                                        logger.debug(" -> MOVE JUST DELETED");

                                        // Fetch previously deleted entity
                                        newEntity = collector.getDeleted().remove(toEntity.getRefId());
                                        for (WegasCallback cb : callbacks) {
                                            cb.preUpdate(target, this.toEntity, identifier);
                                        }

                                        // Force update
                                        //newEntity.merge(toEntity);
                                        //.apply(newEntity, null, PatchMode.UPDATE, null, collector, numPass);
                                        WegasEntityPatch createPatch = new WegasEntityPatch(newEntity, toEntity, true);
                                        createPatch.apply(newEntity, null, PatchMode.UPDATE, visibility, collector, null);

                                        for (WegasCallback cb : callbacks) {
                                            cb.postPersist(newEntity, identifier);
                                        }

                                        for (WegasCallback cb : callbacks) {
                                            cb.postUpdate(target, this.toEntity, identifier);
                                        }

                                    } else {
                                        //newEntity = toEntity.clone(); //   -> INTERNAL CLONE
                                        newEntity = toEntity.getClass().newInstance();
                                        WegasEntityPatch clone = new WegasEntityPatch(newEntity, toEntity, true);
                                        clone.apply(newEntity, null, PatchMode.UPDATE, visibility, collector, null);

                                        for (WegasCallback cb : callbacks) {
                                            cb.postPersist(newEntity, identifier);
                                        }

                                    }
                                    if (setter != null) {
                                        setter.invoke(oTarget, newEntity);
                                    }
                                } else {
                                    logger.debug("SKIP CREATION DURING 1st pass");
                                }
                                break;
                            case DELETE:
                                if (numPass < 2) {
                                    logger.debug(" DELETE");

                                    if (fromEntity != null && target != null) {
                                        String refId = fromEntity.getRefId();
                                        /*
                                 * entity which is to be delete here has been created elsewhere
                                 * let's mark the move
                                         */
                                        if (collector.getCreated().containsKey(refId)) {
                                            logger.debug(" BUT MOVED!!!");
                                            // remove entity from the list of entities to detroy
                                            AbstractEntity remove = collector.getCreated().remove(refId);

                                            /*
                                     * compute a patch to reflect changes between this fromEntity and other toEntity;
                                             */
                                            WegasEntityPatch patch = new WegasEntityPatch(this.fromEntity, remove, this.recursive);
                                            remove.merge(target);
                                            patch.apply(remove, callback, parentMode, visibility, collector, numPass);
                                        } else {
                                            // register entity to destroy
                                            collector.getDeleted().put(refId, target);
                                        }

                                        for (WegasCallback cb : callbacks) {
                                            cb.preDestroy(target, identifier);
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
            } catch (Exception ex) {
                throw new RuntimeException(ex);
            }
        } while (rootPatch && numPass < 2);

        logger.info("  ** DONE {} {} -> {}", this.getClass().getSimpleName(), fromEntity, target);

        if (processCollectedData) {
            // Finalize patch
            logger.info("Collect: {}", collector);
            VariableDescriptorFacade vdf = null;

            for (Entry<String, AbstractEntity> entry : collector.getDeleted().entrySet()) {
                AbstractEntity entity = entry.getValue();
                if (entity instanceof VariableDescriptor) {
                    VariableDescriptor vd = (VariableDescriptor) entity;
                    if (vdf == null) {
                        vdf = VariableDescriptorFacade.lookup();
                    }
                    vdf.preDestroy(vd.getGameModel(), vd);
                }
            }

            for (Entry<String, AbstractEntity> entry : collector.getCreated().entrySet()) {
                AbstractEntity entity = entry.getValue();
                if (entity instanceof VariableDescriptor) {
                    VariableDescriptor vd = (VariableDescriptor) entity;
                    if (vdf == null) {
                        vdf = VariableDescriptorFacade.lookup();
                    }
                    vdf.shallowRevive(null, vd, true);
                }
            }
        }

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
