/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.merge.utils;

import ch.albasim.wegas.annotations.ProtectionLevel;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.persistence.NamedEntity;
import com.wegas.core.persistence.variable.ModelScoped;
import com.wegas.core.persistence.variable.ModelScoped.Visibility;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.event.Level;

/**
 *
 * @author maxence
 */
public class MergeHelper {

    private static final Logger logger = LoggerFactory.getLogger(MergeHelper.class);

    private MergeHelper() {
        // empty private constructor to prevent class initialisation
    }

    public interface MergeableVisitor {

        /**
         * Is target protected ? to be protected, the target must belongs to a protectedGameModel
         * (i.e. a scenario which depends on a model) and must stand in a protected scope according
         * to the current protection level and its inherited visibility.
         *
         * @param target          current mergeable object
         * @param protectionLevel current protection level
         *
         * @return true if the current target is read-only.
         */
        default boolean isProtected(Mergeable target, ProtectionLevel protectionLevel) {
            return target.belongsToProtectedGameModel()
                && Helper.isProtected(protectionLevel, target.getClosestVisibility());
        }

        /**
         * visit a mergeable object.
         *
         * @param target          the mergeable target to visit
         * @param protectionLevel current protection level
         * @param level           deepness
         * @param field           field description
         * @param ancestors       list of all mergeables passed through to get to this place
         * @param references      others mergeables visited in parallel
         *
         * @return return false to stop visiting this branch, true to continue
         */
        boolean visit(Mergeable target, ProtectionLevel protectionLevel, int level,
            WegasFieldProperties field, Deque<Mergeable> ancestors, Mergeable... references);

        /**
         * Visit a property.
         *
         * @param target          the property to visit
         * @param protectionLevel current protection level
         * @param level           deepness
         * @param field           field description
         * @param ancestors       list of all mergeables passed through to get to this place
         * @param key             when the property is part of an array or a map, indicated the
         *                        index (for arrays) or the entry key (for maps), null for any other
         *                        cases
         * @param references      others properties visited in parallel
         */
        default void visitProperty(Object target, ProtectionLevel protectionLevel, int level,
            WegasFieldProperties field, Deque<Mergeable> ancestors, Object key, Object... references) {
            // default behaviour is noop
        }
    }

    /**
     * Start the visit of the given mergeable target.
     *
     * @param target         object to visit
     * @param forceRecursion should visit non includedByDefault properties ?
     * @param visitor        the visitor
     * @param references     try to visit those ones in parallel
     */
    public static void visitMergeable(Mergeable target, Boolean forceRecursion,
        MergeableVisitor visitor, Mergeable... references
    ) {
        visitMergeable(target, ProtectionLevel.PROTECTED,
            forceRecursion, visitor, 0, null, null, references);
    }

    /**
     * Internal visit method.
     *
     * @param target          the mergeable to visit
     * @param references      try to visit those ones in parallel
     * @param protectionLevel current protection level
     * @param forceRecursion  do not follow includeByDefault=false properties unless forceRecursion
     *                        is true
     * @param visitor         the visitor itself
     * @param level           deepness
     * @param f               WegasFieldProperties about current target
     * @param ancestors       list of all mergeables passed through to get to this place
     */
    private static void visitMergeable(Mergeable target, ProtectionLevel protectionLevel,
        Boolean forceRecursion, MergeableVisitor visitor, int level, WegasFieldProperties f,
        Deque<Mergeable> ancestors, Mergeable... references
    ) {

        if (target != null) {

            if (ancestors == null) {
                ancestors = new LinkedList<>();
            }
            boolean shouldContinue = visitor
                .visit(target, protectionLevel, level, f, ancestors, references);

            if (shouldContinue) {
                ancestors.addFirst(target);

                WegasEntityFields entityIterator = WegasEntitiesHelper.getEntityIterator(target
                    .getClass());

                for (WegasFieldProperties field : entityIterator.getFields()) {
                    try {
                        ProtectionLevel fieldProtectionLevel = field.getAnnotation()
                            .protectionLevel();
                        if (fieldProtectionLevel.equals(ProtectionLevel.CASCADED)) {
                            fieldProtectionLevel = protectionLevel;
                        }
                        if (field.getAnnotation().includeByDefault() || forceRecursion) {
                            Method readMethod = field.getPropertyDescriptor().getReadMethod();
                            Object[] referencesChildren = null;
                            switch (field.getType()) {
                                case CHILD:
                                    Mergeable targetChild = (Mergeable) readMethod.invoke(target);

                                    if (references != null) {
                                        referencesChildren = new Mergeable[references.length];
                                        for (int i = 0; i < references.length; i++) {
                                            if (references[i] != null) {
                                                referencesChildren[i] = (Mergeable) readMethod
                                                    .invoke(references[i]);
                                            } else {
                                                referencesChildren[i] = null;
                                            }
                                        }
                                    }

                                    MergeHelper
                                        .visitMergeable(targetChild,
                                            fieldProtectionLevel, forceRecursion,
                                            visitor, level + 1, field,
                                            ancestors, (Mergeable[]) referencesChildren);
                                    break;
                                case CHILDREN:
                                    Object children = readMethod.invoke(target);

                                    if (references != null) {
                                        referencesChildren = new Object[references.length];
                                        for (int i = 0; i < references.length; i++) {
                                            if (references[i] != null) {
                                                referencesChildren[i] = readMethod
                                                    .invoke(references[i]);
                                            } else {
                                                referencesChildren[i] = null;
                                            }
                                        }
                                    } else {
                                        references = new Mergeable[0];
                                        referencesChildren = new Object[0];
                                    }

                                    if (children instanceof List) {
                                        List childrenList = (List) children;

                                        if (!childrenList.isEmpty()) {

                                            for (Integer childIndex = 0; childIndex < childrenList
                                                .size(); childIndex++) {

                                                // for each child
                                                Object get = childrenList.get(childIndex);

                                                Mergeable[] refList = new Mergeable[referencesChildren.length];

                                                if (get instanceof Mergeable) {
                                                    for (int refIndex = 0; refIndex < referencesChildren.length; refIndex++) {
                                                        Mergeable refGet = null;

                                                        List refChildren = new ArrayList<>();
                                                        if (referencesChildren[refIndex] instanceof List) {
                                                            refChildren
                                                                .addAll((List) referencesChildren[refIndex]);
                                                        }

                                                        // first try to fetch item with same refId
                                                        for (Object other : refChildren) {
                                                            if (other instanceof Mergeable && ((Mergeable) other)
                                                                .getRefId().equals(((Mergeable) get)
                                                                    .getRefId())) {
                                                                refGet = (Mergeable) other;
                                                                break;
                                                            }
                                                        }
                                                        if (refGet == null && get instanceof NamedEntity) {
                                                            // no reference with same refId, try to fetch by name
                                                            for (Object other : refChildren) {
                                                                if (other instanceof NamedEntity && ((NamedEntity) other)
                                                                    .getName()
                                                                    .equals(((NamedEntity) get)
                                                                        .getName())) {
                                                                    refGet = (Mergeable) other;
                                                                    break;
                                                                }
                                                            }
                                                        }
                                                        if (refGet != null) {
                                                            // make sure to fetch refGet only once
                                                            refChildren.remove(refGet);
                                                        }
                                                        refList[refIndex] = refGet;

                                                    }
                                                    MergeHelper
                                                        .visitMergeable(
                                                            (Mergeable) get,
                                                            fieldProtectionLevel,
                                                            forceRecursion,
                                                            visitor,
                                                            level + 1,
                                                            field,
                                                            ancestors,
                                                            refList
                                                        );
                                                } else {
                                                    visitor
                                                        .visitProperty(
                                                            get,
                                                            protectionLevel,
                                                            level,
                                                            field,
                                                            ancestors,
                                                            childIndex
                                                        );
                                                }
                                            }
                                        }
                                    } else if (children instanceof Set) {
                                        Set childrenSet = (Set) children;

                                        if (!childrenSet.isEmpty()) {
                                            for (Object get : childrenSet) {

                                                Mergeable[] refSet = new Mergeable[referencesChildren.length];
                                                if (get instanceof Mergeable) {
                                                    for (int refIndex = 0; refIndex < referencesChildren.length; refIndex++) {
                                                        Mergeable refGet = null;

                                                        Set refChildren = new HashSet<>();
                                                        if (referencesChildren[refIndex] instanceof Set) {
                                                            refChildren
                                                                .addAll((Set) referencesChildren[refIndex]);
                                                        }
                                                        // first try to fetch item with same refId
                                                        for (Object other : refChildren) {
                                                            if (other instanceof Mergeable && ((Mergeable) other)
                                                                .getRefId().equals(((Mergeable) get)
                                                                    .getRefId())) {
                                                                refGet = (Mergeable) other;
                                                                break;
                                                            }
                                                        }
                                                        if (refGet == null && get instanceof NamedEntity) {
                                                            // no reference with same refId, try to fetch by name
                                                            for (Object other : refChildren) {
                                                                if (other instanceof NamedEntity && ((NamedEntity) other)
                                                                    .getName()
                                                                    .equals(((NamedEntity) get)
                                                                        .getName())) {
                                                                    refGet = (Mergeable) other;
                                                                    break;
                                                                }
                                                            }
                                                        }
                                                        if (refGet != null) {
                                                            // make sure to fetch refGet only once
                                                            refChildren.remove(refGet);
                                                        }

                                                        refSet[refIndex] = refGet;
                                                    }

                                                    MergeHelper
                                                        .visitMergeable(
                                                            (Mergeable) get,
                                                            fieldProtectionLevel,
                                                            forceRecursion,
                                                            visitor,
                                                            level + 1,
                                                            field,
                                                            ancestors,
                                                            refSet
                                                        );
                                                } else {
                                                    visitor
                                                        .visitProperty(
                                                            get,
                                                            protectionLevel,
                                                            level,
                                                            field,
                                                            ancestors,
                                                            null
                                                        );
                                                }
                                            }
                                        }
                                    } else if (children instanceof Map) {
                                        Map<Object, Object> childrenMap = (Map) children;

                                        for (Entry<Object, Object> entry : childrenMap.entrySet()) {
                                            Object child = entry.getValue();
                                            Object ref = null;

                                            if (child instanceof Mergeable) {
                                                Mergeable[] mRefs = new Mergeable[references.length];
                                                for (int refIndex = 0; refIndex < references.length; refIndex++) {

                                                    Map<Object, Object> refMap = (Map) referencesChildren[refIndex];
                                                    if (refMap != null) {
                                                        ref = refMap.get(entry.getKey());
                                                    }

                                                    if (ref instanceof Mergeable) {
                                                        mRefs[refIndex] = (Mergeable) ref;
                                                    } else {
                                                        mRefs[refIndex] = null;
                                                    }
                                                }

                                                MergeHelper
                                                    .visitMergeable(
                                                        (Mergeable) child,
                                                        fieldProtectionLevel,
                                                        forceRecursion,
                                                        visitor,
                                                        level + 1,
                                                        field,
                                                        ancestors,
                                                        mRefs
                                                    );
                                            } else {
                                                Object[] refs = new Object[references.length];
                                                for (int refIndex = 0; refIndex < references.length; refIndex++) {

                                                    Map<Object, Object> refMap = (Map) referencesChildren[refIndex];
                                                    if (refMap != null) {
                                                        refs[refIndex] = refMap.get(entry.getKey());
                                                    } else {
                                                        refs[refIndex] = null;
                                                    }

                                                }

                                                visitor
                                                    .visitProperty(
                                                        child,
                                                        protectionLevel,
                                                        level,
                                                        field,
                                                        ancestors,
                                                        entry.getKey(),
                                                        refs
                                                    );
                                            }
                                        }
                                    }
                                    break;
                                case PROPERTY:
                                    Object targetProperty = readMethod.invoke(target);
                                    Object[] referencesProperties;
                                    if (references == null) {
                                        references = new Mergeable[0];
                                    }
                                    referencesProperties = new Object[references.length];

                                    for (int i = 0; i < references.length; i++) {
                                        if (references[i] != null) {
                                            referencesProperties[i] = readMethod
                                                .invoke(references[i]);
                                        } else {
                                            referencesProperties[i] = null;
                                        }
                                    }

                                    visitor
                                        .visitProperty(
                                            targetProperty,
                                            protectionLevel,
                                            level,
                                            field,
                                            ancestors,
                                            null,
                                            referencesProperties
                                        );
                                    break;
                            }
                        }
                    } catch (Exception ex) {
                        Helper.printWegasStackTrace(logger, Level.ERROR, ex.toString(), ex);
                        throw new WegasErrorMessage("error", "Invocation Failure: should never happen: " + ex);
                    }
                }

                ancestors.removeFirst();
            }
        }
    }

    /**
     * Track all instances of {@link ModelScoped} and reset their visibility.
     */
    private static class VisibilityResetter implements MergeableVisitor {

        private final Visibility visibility;

        /**
         * Create a visibilityResetter which will reset to the given visibility
         *
         * @param visibility
         */
        public VisibilityResetter(Visibility visibility) {
            this.visibility = visibility;
        }

        /**
         * ${@inheritDoc }
         */
        @Override
        public boolean visit(Mergeable target, ProtectionLevel protectionLevel, int level, WegasFieldProperties field, Deque<Mergeable> ancestors, Mergeable[] references) {
            if (target instanceof ModelScoped) {
                ((ModelScoped) target).setVisibility(this.visibility);
            }
            return true;
        }
    }

    /**
     * reset recursively target visibility to the given one.
     *
     * @param target
     * @param visibility
     */
    public static void resetVisibility(Mergeable target, Visibility visibility) {
        MergeHelper.visitMergeable(target, Boolean.TRUE, new VisibilityResetter(visibility));
    }

    private static class RefidResetter implements MergeableVisitor {

        private final Boolean clear;

        private RefidResetter(Boolean clear) {
            this.clear = clear;
        }

        @Override
        public boolean visit(Mergeable target, ProtectionLevel protectionLevel, int level, WegasFieldProperties field, Deque<Mergeable> ancestors, Mergeable[] references) {

            if (target instanceof AbstractEntity) {
                AbstractEntity entity = (AbstractEntity) target;
                if (references != null && references.length > 0 && references[0] != null) {
                    entity.forceRefId(references[0].getRefId());
                    logger.trace("Forrce RefId : {}", entity);
                } else {
                    if (clear) {
                        entity.forceRefId(null);
                        entity.assertRefId();
                    }
                }
            }

            return true;
        }
    }

    /**
     *
     * @param target
     * @param reference
     * @param clear     if true, clear refIds when there is no reference
     */
    public static void resetRefIds(AbstractEntity target, AbstractEntity reference, Boolean clear) {
        MergeHelper.visitMergeable(target, true, new RefidResetter(clear), reference);
    }

    private static class NameResetter implements MergeableVisitor {

        @Override
        public boolean visit(Mergeable target, ProtectionLevel protectionLevel, int level, WegasFieldProperties field, Deque<Mergeable> ancestors, Mergeable... references) {
            if (target instanceof NamedEntity) {
                ((NamedEntity) target).setName(target.getClass().getSimpleName());
            }
            return true;
        }
    }

    public static void resetNames(Mergeable target) {
        MergeHelper.visitMergeable(target, Boolean.TRUE, new NameResetter());
    }
}
