/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.merge.patch;

import com.wegas.core.Helper;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasRuntimeException;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.i18n.persistence.Translation;
import com.wegas.core.merge.annotations.WegasEntityProperty;
import com.wegas.core.merge.utils.DefaultWegasFactory;
import com.wegas.core.merge.utils.EmptyCallback;
import com.wegas.core.merge.utils.LifecycleCollector;
import com.wegas.core.merge.utils.LifecycleCollector.CollectedEntity;
import com.wegas.core.merge.utils.LifecycleCollector.OrphanContainer;
import com.wegas.core.merge.utils.MergeHelper;
import com.wegas.core.merge.utils.WegasCallback;
import com.wegas.core.merge.utils.WegasEntitiesHelper;
import com.wegas.core.merge.utils.WegasEntityFields;
import com.wegas.core.merge.utils.WegasFactory;
import com.wegas.core.merge.utils.WegasFieldProperties;
import static com.wegas.core.merge.utils.WegasFieldProperties.FieldType.CHILD;
import static com.wegas.core.merge.utils.WegasFieldProperties.FieldType.CHILDREN;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.variable.DescriptorListI;
import com.wegas.core.persistence.variable.ModelScoped;
import com.wegas.core.persistence.variable.ModelScoped.ProtectionLevel;
import com.wegas.core.persistence.variable.ModelScoped.Visibility;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import java.beans.PropertyDescriptor;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Deque;
import java.util.LinkedList;
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

    private Mergeable fromEntity;
    //private Mergeable toEntity;

    private List<WegasCallback> entityCallbacks;

    private WegasFactory factory;

    /**
     * Get the factory to use.
     * This method may initialise the factory to a default one.
     *
     * @return the factory to use to create new instances
     */
    private WegasFactory getFactory() {
        if (this.factory == null) {
            this.factory = new DefaultWegasFactory();
        }
        return factory;
    }

    @Override
    protected List<WegasCallback> getCallbacks(WegasCallback userCallback) {
        List<WegasCallback> callbacks = super.getCallbacks(userCallback);
        callbacks.addAll(0, this.entityCallbacks);
        return callbacks;
    }

    /**
     * Create a patch to transform "from" into "to"
     *
     * @param from
     * @param to
     * @param recursive
     */
    public WegasEntityPatch(Mergeable from, Mergeable to, Boolean recursive) {
        this(null, 0, null, null, null, from, to, recursive, false, false, false, ProtectionLevel.PROTECTED);
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
            Mergeable from, Mergeable to, boolean recursive,
            boolean ignoreNull, boolean sameEntityOnly, boolean initOnly,
            ProtectionLevel protectionLevel) {

        super(identifier, order, getter, setter, userCallback, ignoreNull, sameEntityOnly, initOnly, recursive, protectionLevel);

        if (from == null && to == null) {// both entity are null
            logger.trace("BOTH ARE NULL");
        }
        if (from != null && to != null && !from.getClass().equals(to.getClass())) {
            throw WegasErrorMessage.error("imcompatible entities");
        }

        try {

            this.fromEntity = from;
            this.toEntity = to;

            this.patches = new ArrayList<>();
            this.entityCallbacks = new ArrayList<>();

            if (fromEntity != null || this.toEntity != null) {
                Class klass = (fromEntity != null) ? fromEntity.getClass() : toEntity.getClass();

                WegasEntityFields entityIterator = WegasEntitiesHelper.getEntityIterator(klass);

                this.factory = entityIterator.getFactory();

                this.entityCallbacks.addAll(entityIterator.getEntityCallbacks());

                // process @WegasEntityProperty fields
                for (WegasFieldProperties fieldProperties : entityIterator.getFields()) {
                    // Get field info 
                    Field field = fieldProperties.getField();
                    WegasEntityProperty wegasProperty = fieldProperties.getAnnotation();

                    //  ignore nonDefaultFields if the patch is not recursive
                    if (wegasProperty.includeByDefault() || recursive) {

                        String fieldName = field.getName();

                        PropertyDescriptor property = fieldProperties.getPropertyDescriptor();

                        Method fGetter = property.getReadMethod();
                        Method fSetter = property.getWriteMethod();

                        Class<? extends WegasCallback> userFieldCallbackClass = wegasProperty.callback();

                        WegasCallback userFieldCallback = null;
                        if (userFieldCallbackClass != null && !userFieldCallbackClass.equals(EmptyCallback.class)) {
                            userFieldCallback = userFieldCallbackClass.getDeclaredConstructor().newInstance();
                        }

                        // Get effective from and to values
                        Object fromValue = fromEntity != null ? fGetter.invoke(fromEntity) : null;
                        Object toValue = toEntity != null ? fGetter.invoke(toEntity) : null;

                        ProtectionLevel propertyProtectionLevel = wegasProperty.protectionLevel();
                        if (propertyProtectionLevel == ProtectionLevel.CASCADED) {
                            propertyProtectionLevel = this.protectionLevel;
                        }

                        // Which case ?
                        switch (fieldProperties.getType()) {
                            case PROPERTY:

                                // primitive or primitive related property (eg. Boolean, List<Double>, Map<String, String>, etc)
                                patches.add(new WegasPrimitivePatch(fieldName, wegasProperty.order(),
                                        userFieldCallback, to,
                                        fGetter, fSetter, fromValue, toValue,
                                        wegasProperty.ignoreNull(), wegasProperty.sameEntityOnly(), wegasProperty.initOnly(), propertyProtectionLevel));
                                break;
                            case CHILD:
                                // the property is an abstract entity -> register patch
                                patches.add(new WegasEntityPatch(fieldName, wegasProperty.order(),
                                        userFieldCallback,
                                        fGetter, fSetter,
                                        (Mergeable) fromValue, (Mergeable) toValue,
                                        recursive, wegasProperty.ignoreNull(), wegasProperty.sameEntityOnly(), wegasProperty.initOnly(), propertyProtectionLevel));

                                break;
                            case CHILDREN:
                                // current property is a list or a map of abstract entities
                                patches.add(new WegasChildrenPatch(fieldName, wegasProperty.order(),
                                        userFieldCallback, to,
                                        fGetter, fSetter,
                                        fromValue, toValue,
                                        recursive, wegasProperty.ignoreNull(), wegasProperty.sameEntityOnly(), wegasProperty.initOnly(), propertyProtectionLevel));
                                break;
                        }
                    }
                }
                Collections.sort(patches, new PatchOrderComparator());
            }
        } catch (IllegalAccessException | IllegalArgumentException | InstantiationException | NoSuchMethodException | SecurityException | InvocationTargetException ex) {
            Throwable cause = ex.getCause();
            if (cause instanceof WegasRuntimeException) {
                throw (WegasRuntimeException) cause;
            } else {
                throw new RuntimeException(cause != null ? cause : ex);
            }
        }
    }

    @Override
    public LifecycleCollector apply(GameModel targetGameModel, Deque<Mergeable> ancestors, Object targetObject, WegasCallback callback, PatchMode parentMode,
            Visibility inheritedVisibility, LifecycleCollector collector, Integer numPass, boolean bypassVisibility) {
        /**
         * Two pass patch
         * First pass update and delete
         * Second create/move entities
         */
        boolean rootPatch = false;
        boolean processCollectedData = false;
        Mergeable target = null;
        if (ancestors == null) {
            ancestors = new LinkedList<>();
        }
        Mergeable parent = ancestors.peekFirst();

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
            try {
                if (rootPatch) {
                    numPass++;
                    logger.info("Start pass #{}", numPass);
                    logger.indent();
                }
                try {
                    target = getMergeable(targetObject);

                    if (getter != null) {
                        target = (Mergeable) getter.invoke(parent);
                    }
                    logger.info("{} (from {} -> to {}) on {}", this.getClass().getSimpleName(), fromEntity, toEntity, target);
                    logger.indent();

                    if (!ignoreNull || toEntity != null) {
                        if (!initOnly || target == null) {
                            // prevent protected changes
                            List<WegasCallback> callbacks = this.getCallbacks(callback);

                            Visibility visibility = null;
                            Visibility ownVisibility = null;
                            if (toEntity instanceof ModelScoped) {
                                ownVisibility = ((ModelScoped) toEntity).getVisibility();
                                visibility = ownVisibility;
                            }
                            PatchMode myMode = this.getPatchMode(target, fromEntity, toEntity, parentMode, inheritedVisibility, ownVisibility, bypassVisibility);

                            if (visibility == null) {
                                visibility = inheritedVisibility;
                            }

                            logger.debug("MODE IS: " + myMode);

                            if (myMode != null) {
                                switch (myMode) {
                                    case CREATE:
                                        if (numPass > 1) {
                                            if (!Helper.isProtected(protectionLevel, visibility) || !isProtected(target, ancestors, bypassVisibility)) {
                                                logger.debug(" CREATE CLONE");

                                                if (collector.getDeleted().containsKey(toEntity.getRefId())) {
                                                    // the newEntity to create has just been removed from another list -> MOVE
                                                    logger.debug(" -> MOVE JUST DELETED");

                                                    // Fetch previously deleted entity
                                                    LifecycleCollector.CollectedEntity remove = collector.getDeleted().remove(toEntity.getRefId());

                                                    target = remove.getEntity();

                                                    // adoption process: restored entity children are no longer orphans
                                                    collector.adopt(target);

                                                    for (WegasCallback cb : callbacks) {
                                                        cb.preUpdate(target, this.toEntity, identifier);
                                                    }

                                                    for (WegasCallback cb : callbacks) {
                                                        cb.add(target, null, identifier);
                                                    }

                                                    // Force update
                                                    WegasEntityPatch createPatch = new WegasEntityPatch(null, 0, null, null, null, remove.getPayload(), toEntity, true, false, false, false, this.protectionLevel);
                                                    createPatch.apply(targetGameModel, ancestors, target, null, PatchMode.UPDATE, visibility, collector, null, bypassVisibility);

                                                    for (WegasCallback cb : callbacks) {
                                                        cb.postUpdate(target, this.toEntity, identifier);
                                                    }

                                                    if (setter != null) {
                                                        setter.invoke(parent, target);
                                                    }

                                                } else {

                                                    target = this.getFactory().newInstance(targetGameModel, toEntity);

                                                    WegasEntityPatch clone = new WegasEntityPatch(target, toEntity, true);

                                                    for (WegasCallback cb : callbacks) {
                                                        cb.add(target, null, identifier);
                                                    }

                                                    if (setter != null) {
                                                        setter.invoke(parent, target);
                                                    }

                                                    clone.apply(targetGameModel, ancestors, target, null, PatchMode.UPDATE, visibility, collector, null, bypassVisibility);

                                                    collector.getCreated().put(target.getRefId(), new LifecycleCollector.CollectedEntity(target, toEntity, callbacks, parent, identifier));

                                                }
                                            } else {
                                                logger.debug("REJECT PATCH : PROHIBITED");
                                            }
                                        } else {
                                            logger.debug("SKIP CREATION DURING 1st pass");
                                        }
                                        break;
                                    case DELETE:
                                        if (numPass < 2) {
                                            if (!Helper.isProtected(protectionLevel, visibility) || !isProtected(target, ancestors, bypassVisibility)) {
                                                logger.debug(" DELETE");

                                                if (fromEntity != null && target != null) {

                                                    // DELETE CHILDREN TOO TO COLLECT THEM
                                                    ancestors.addFirst(target);
                                                    for (WegasPatch patch : patches) {
                                                        patch.apply(targetGameModel, ancestors, null, new OrphanCollector(collector, target, patch.getIdentifier()), myMode, visibility, collector, numPass, bypassVisibility);
                                                    }
                                                    ancestors.removeFirst();

                                                    String refId = fromEntity.getRefId();
                                                    // Should include all Mergeable contained within target, so they can be reused by CREATE case
                                                    collector.getDeleted().put(refId, new LifecycleCollector.CollectedEntity(target, fromEntity, callbacks, parent, identifier));

                                                    for (WegasCallback cb : callbacks) {
                                                        cb.remove(target, null, identifier);
                                                    }

                                                    if (setter != null) {
                                                        setter.invoke(parent, (Object) null);
                                                    }
                                                }

                                            } else {
                                                logger.debug("REJECT PATCH : PROHIBITED");
                                            }
                                        }
                                        break;
                                    case SKIP:
                                        logger.debug("SKIP");
                                        break;
                                    case OVERRIDE:
                                    case UPDATE:
                                    default:
                                        if (shouldApplyPatch(target, toEntity)) {
                                            if (numPass > 1) {
                                                for (WegasCallback cb : callbacks) {
                                                    cb.preUpdate(target, this.toEntity, identifier);
                                                }
                                            }

                                            ancestors.addFirst(target);
                                            for (WegasPatch patch : patches) {
                                                patch.apply(targetGameModel, ancestors, null, null, myMode, visibility, collector, numPass, bypassVisibility);
                                            }
                                            ancestors.removeFirst();

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
                } catch (IllegalAccessException | IllegalArgumentException | InstantiationException | InvocationTargetException | SecurityException | NoSuchMethodException ex) {
                    throw new RuntimeException(ex);
                } finally {
                    logger.unindent();
                }
                logger.info("DONE {} (from {} to {}) on {}", this.getClass().getSimpleName(), fromEntity, toEntity, target);
            } finally {
                if (rootPatch) {
                    logger.unindent();
                }
            }
        } while (rootPatch && numPass < 2);

        if (processCollectedData) {
            // Finalize patch
            //GameModelFacade gmf = GameModelFacade.lookup();
            logger.info("Collect: {}", collector);

            Map<String, LifecycleCollector.CollectedEntity> deleted = collector.getDeleted();
            Map<Mergeable, Map<Object, LifecycleCollector.OrphanContainer>> orphans = collector.getCollectedOrphans();

            /**
             * Move orphans to root level.
             * <p>
             * To keep orphan in the Entitymanager context
             * It prevents entityManager flush to remove those orphans
             */
            for (Entry<Mergeable, Map<Object, OrphanContainer>> entry : orphans.entrySet()) {
                Mergeable orphanParent = entry.getKey();
                for (Entry<Object, OrphanContainer> entry2 : entry.getValue().entrySet()) {
                    Object fieldId = entry2.getKey();
                    OrphanContainer value = entry2.getValue();
                    if (value.areOrphansInstanceOf(VariableDescriptor.class)) {
                        logger.info("  RESCUE ORPHAN PHASE I: {}.{} := {}", orphanParent, fieldId, value);
                        Object theOrphans = value.getOrphans();

                        if (theOrphans instanceof List) {
                            for (VariableDescriptor orphan : (List<VariableDescriptor>) theOrphans) {
                                this.getVariableDescriptorFacade().move(orphan.getId(), 0);
                            }
                        } else if (theOrphans instanceof Map) {
                            for (VariableDescriptor orphan : ((Map<Object, VariableDescriptor>) theOrphans).values()) {
                                this.getVariableDescriptorFacade().move(orphan.getId(), 0);
                            }
                        }
                    }
                }
            }

            /**
             * Delete callbacks
             */
            for (Entry<String, LifecycleCollector.CollectedEntity> entry : deleted.entrySet()) {
                LifecycleCollector.CollectedEntity collectedEntity = entry.getValue();
                Mergeable entity = collectedEntity.getEntity();

                logger.info("DESTROY {}", entity);
                List<WegasCallback> callbacks = collectedEntity.getCallbacks();
                if (callbacks != null) {
                    for (WegasCallback cb : callbacks) {
                        cb.destroy(entity, identifier);
                    }
                }

                if (entity instanceof AbstractEntity) {
                    this.getVariableDescriptorFacade().removeAbstractEntity((AbstractEntity) entity);
                }
            }

            if (this.vdf != null) {
                // what purpose ???
                this.vdf.flush();
            }
            for (Entry<Mergeable, Map<Object, OrphanContainer>> entry : orphans.entrySet()) {
                Mergeable orphanParent = entry.getKey();
                for (Entry<Object, OrphanContainer> entry2 : entry.getValue().entrySet()) {
                    Object fieldId = entry2.getKey();
                    OrphanContainer value = entry2.getValue();
                    if (value.areOrphansInstanceOf(VariableDescriptor.class)) {
                        logger.info("  RESCUE ORPHAN PHASE II: {}.{} := {}", orphanParent, fieldId, value);
                        if (orphanParent instanceof VariableDescriptor) {
                            VariableDescriptor p = (VariableDescriptor) orphanParent;
                            if (deleted.containsKey(p.getRefId())) {
                                // should restore p
                                p.getName();
                                DescriptorListI grandparent = p.getParent();
                                try {

                                    if (vdf == null) {
                                        vdf = VariableDescriptorFacade.lookup();
                                    }

                                    /*
                                     * restore default instance to clone
                                     */
                                    for (CollectedEntity candidate : deleted.values()) {
                                        if (candidate.getEntity() instanceof VariableInstance) {
                                            VariableInstance vi = (VariableInstance) candidate.getEntity();
                                            if (vi.getDefaultDescriptor() != null && vi.getDefaultDescriptor() == p) {
                                                p.setDefaultInstance(vi);
                                                break;
                                            }
                                        }
                                    }

                                    /*
                                     * restore label to clone
                                     */
                                    for (CollectedEntity candidate : deleted.values()) {
                                        if (candidate.getEntity() instanceof TranslatableContent
                                                && candidate.getIdentifier().equals("label")
                                                && candidate.getParent().equals(p)) {
                                            TranslatableContent label = (TranslatableContent) candidate.getEntity();

                                            p.setLabel(label);
                                            break;
                                        }
                                    }

                                    /*
                                     * and restore its translations
                                     */
                                    for (CollectedEntity candidate : deleted.values()) {
                                        if (candidate.getEntity() instanceof Translation
                                                && candidate.getParent().equals(p.getLabel())) {
                                            p.getLabel().getRawTranslations().add((Translation) candidate.getEntity());
                                            break;
                                        }
                                    }

                                    VariableDescriptor substituteParent = (VariableDescriptor) p.shallowClone();

                                    // Privatise substitue parent
                                    MergeHelper.resetRefIds(substituteParent, null, true);
                                    // and make sure it and all its children are private
                                    MergeHelper.resetVisibility(substituteParent, Visibility.PRIVATE);

                                    p.setDefaultInstance(null);
                                    p.setLabel(null);

                                    if (grandparent instanceof GameModel) {
                                        // root level substitute
                                        vdf.create(grandparent.getId(), substituteParent);
                                    } else {
                                        // depper level substitute
                                        if (vdf.find(grandparent.getId()) != null) {
                                            vdf.create(grandparent.getId(), substituteParent);
                                        } else {
                                            vdf.create(grandparent.getGameModel().getId(), substituteParent);
                                        }

                                    }
                                    Object theOrphans = value.getOrphans();

                                    if (theOrphans instanceof List) {
                                        for (VariableDescriptor orphan : (List<VariableDescriptor>) theOrphans) {
                                            vdf.move(orphan.getId(), substituteParent.getId(), 0);
                                        }
                                    } else if (theOrphans instanceof Map) {
                                        for (VariableDescriptor orphan : ((Map<Object, VariableDescriptor>) theOrphans).values()) {
                                            vdf.move(orphan.getId(), substituteParent.getId(), 0);
                                        }
                                    }

                                    WegasEntityFields entityIterator = WegasEntitiesHelper.getEntityIterator(substituteParent.getClass());
                                    WegasFieldProperties field = entityIterator.getField(fieldId.toString());
                                    field.getPropertyDescriptor().getWriteMethod().invoke(substituteParent, theOrphans);
                                } catch (CloneNotSupportedException | SecurityException | IllegalArgumentException | IllegalAccessException | InvocationTargetException ex) {
                                    logger.error("EPIC FAIL");
                                }
                            }
                        }
                    }
                }
            }

            /**
             * Create callback
             */
            for (Entry<String, LifecycleCollector.CollectedEntity> entry : collector.getCreated().entrySet()) {
                LifecycleCollector.CollectedEntity collectedEntity = entry.getValue();
                Mergeable entity = collectedEntity.getEntity();

                List<WegasCallback> callbacks = collectedEntity.getCallbacks();
                if (callbacks != null) {
                    for (WegasCallback cb : callbacks) {
                        cb.persist(entity, identifier);
                    }
                }

                /*
                if (entity instanceof AbstractEntity) {
                    AbstractEntity ae = (AbstractEntity) entity;
                    if (ae.getId() == null) {
                        if (vdf == null) {
                            vdf = VariableDescriptorFacade.lookup();
                        }
                        vdf.persistAbstractEntity(ae);
                    }
                }
                 */
            }

            logger.info("PostCollect: {}", collector);
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
        ident++;
        newLine(sb, ident);
        sb.append("ToEntity ").append(toEntity);
        if (entityCallbacks.size() > 0) {
            newLine(sb, ident);
            sb.append("EntityCallback:");
            for (WegasCallback wc : entityCallbacks) {
                newLine(sb, ident);
                sb.append(" * ").append(wc);
            }
        }
        for (WegasPatch patch : patches) {
            sb.append(patch.print(ident));
        }
        return sb;
    }

    private static class OrphanCollector implements WegasCallback {

        private final LifecycleCollector collector;
        private final Mergeable target;
        private final Object identifier;

        public OrphanCollector(LifecycleCollector collector, Mergeable target, Object identifier) {
            this.collector = collector;
            this.target = target;
            this.identifier = identifier;
        }

        @Override
        public void registerOrphans(Object orphans) {
            collector.registerOrphans(target, identifier, orphans);
        }
    }
}
