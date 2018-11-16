/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.merge.utils;

import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.persistence.NamedEntity;
import com.wegas.core.persistence.variable.ModelScoped;
import com.wegas.core.persistence.variable.ModelScoped.ProtectionLevel;
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

/**
 *
 * @author maxence
 */
public class MergeHelper {

    private static final Logger logger = LoggerFactory.getLogger(MergeHelper.class);

    public interface MergeableVisitor {

        public void visit(Mergeable target, ProtectionLevel protectionLevel, int level, WegasFieldProperties field, Deque<Mergeable> ancestors, Mergeable... references);

        default public void visitProperty(Object target, ProtectionLevel protectionLevel, int level, WegasFieldProperties field, Deque<Mergeable> ancestors, Object... references) {
        }
    }

    /**
     *
     * @param target         object to visit
     * @param forceRecursion should visit non includedByDefault properties ?
     * @param visitor        the visitor
     * @param references     try to visit those ones in parallel
     */
    public static void visitMergeable(Mergeable target, Boolean forceRecursion, MergeableVisitor visitor, Mergeable... references) {
        visitMergeable(target, ProtectionLevel.PROTECTED, forceRecursion, visitor, 0, null, null, references);
    }

    /**
     *
     *
     * @param target
     * @param reference
     * @param protectionLevel
     * @param forceRecursion  do not follow includeByDefault=false properted unless forceRecursion is true
     * @param visitor
     * @param level
     * @param f
     * @param ancestors
     */
    private static void visitMergeable(Mergeable target, ProtectionLevel protectionLevel, Boolean forceRecursion, MergeableVisitor visitor, int level, WegasFieldProperties f, Deque<Mergeable> ancestors, Mergeable... references) {

        if (target != null) {

            if (ancestors == null) {
                ancestors = new LinkedList<>();
            }
            visitor.visit(target, protectionLevel, level, f, ancestors, references);

            ancestors.addFirst(target);

            WegasEntityFields entityIterator = WegasEntitiesHelper.getEntityIterator(target.getClass());

            for (WegasFieldProperties field : entityIterator.getFields()) {
                try {
                    ProtectionLevel fieldProtectionLevel = field.getAnnotation().protectionLevel();
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
                                            referencesChildren[i] = (Mergeable) readMethod.invoke(references[i]);
                                        } else {
                                            referencesChildren[i] = null;
                                        }
                                    }
                                }

                                MergeHelper.visitMergeable(targetChild, fieldProtectionLevel, forceRecursion, visitor, level + 1, field, ancestors, (Mergeable[]) referencesChildren);
                                break;
                            case CHILDREN:
                                Object children = readMethod.invoke(target);

                                if (references != null) {
                                    referencesChildren = new Object[references.length];
                                    for (int i = 0; i < references.length; i++) {
                                        if (references[i] != null) {
                                            referencesChildren[i] = readMethod.invoke(references[i]);
                                        } else {
                                            referencesChildren[i] = null;
                                        }
                                    }
                                }

                                if (children instanceof List) {
                                    List childrenList = (List) children;

                                    if (!childrenList.isEmpty()) {

                                        for (int childIndex = 0; childIndex < childrenList.size(); childIndex++) {

                                            // for each child
                                            Object get = childrenList.get(childIndex);

                                            Mergeable[] refList = new Mergeable[referencesChildren.length];

                                            if (get instanceof Mergeable) {
                                                for (int refIndex = 0; refIndex < referencesChildren.length; refIndex++) {
                                                    Mergeable refGet = null;

                                                    List refChildren = new ArrayList<>();
                                                    if (referencesChildren[refIndex] instanceof List) {
                                                        refChildren.addAll((List) referencesChildren[refIndex]);
                                                    }

                                                    // first try to fetch item with same refId
                                                    for (Object other : refChildren) {
                                                        if (other instanceof Mergeable && ((Mergeable) other).getRefId().equals(((Mergeable) get).getRefId())) {
                                                            refGet = (Mergeable) other;
                                                            break;
                                                        }
                                                    }
                                                    if (refGet == null && get instanceof NamedEntity) {
                                                        // no reference with same refId, try to fetch by name
                                                        for (Object other : refChildren) {
                                                            if (other instanceof NamedEntity && ((NamedEntity) other).getName().equals(((NamedEntity) get).getName())) {
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
                                                MergeHelper.visitMergeable((Mergeable) get, fieldProtectionLevel, forceRecursion, visitor, level + 1, field, ancestors, refList);
                                            } else {
                                                visitor.visitProperty(get, protectionLevel, level, field, ancestors);
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
                                                        refChildren.addAll((Set) referencesChildren[refIndex]);
                                                    }
                                                    // first try to fetch item with same refId
                                                    for (Object other : refChildren) {
                                                        if (other instanceof Mergeable && ((Mergeable) other).getRefId().equals(((Mergeable) get).getRefId())) {
                                                            refGet = (Mergeable) other;
                                                            break;
                                                        }
                                                    }
                                                    if (refGet == null && get instanceof NamedEntity) {
                                                        // no reference with same refId, try to fetch by name
                                                        for (Object other : refChildren) {
                                                            if (other instanceof NamedEntity && ((NamedEntity) other).getName().equals(((NamedEntity) get).getName())) {
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

                                                MergeHelper.visitMergeable((Mergeable) get, fieldProtectionLevel, forceRecursion, visitor, level + 1, field, ancestors, refSet);
                                            } else {
                                                visitor.visitProperty(get, protectionLevel, level, field, ancestors);
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

                                                if (ref != null && ref instanceof Mergeable) {
                                                    mRefs[refIndex] = (Mergeable) ref;
                                                } else {
                                                    mRefs[refIndex] = null;
                                                }
                                            }

                                            MergeHelper.visitMergeable((Mergeable) child, fieldProtectionLevel, forceRecursion, visitor, level + 1, field, ancestors, mRefs);
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

                                            visitor.visitProperty(child, protectionLevel, level, field, ancestors, refs);
                                        }
                                    }
                                }
                                break;
                            case PROPERTY:
                                Object targetProperty = readMethod.invoke(target);
                                Object[] referencesProperties = new Object[references.length];

                                for (int i = 0; i < references.length; i++) {
                                    if (references[i] != null) {
                                        referencesProperties[i] = readMethod.invoke(references[i]);
                                    } else {
                                        referencesProperties[i] = null;
                                    }
                                }

                                visitor.visitProperty(targetProperty, protectionLevel, level, field, ancestors, referencesProperties);
                                break;
                        }
                    }
                } catch (Exception ex) {
                    logger.error(ex.toString());
                    throw new WegasErrorMessage("error", "Invocation Failure: should never appends: " + ex);
                }
            }

            ancestors.removeFirst();
        }
    }

    private static class VisibilityResetter implements MergeableVisitor {

        private final Visibility visibility;

        public VisibilityResetter(Visibility visibility) {
            this.visibility = visibility;
        }

        @Override
        public void visit(Mergeable target, ProtectionLevel protectionLevel, int level, WegasFieldProperties field, Deque<Mergeable> ancestors, Mergeable[] references) {
            if (target instanceof ModelScoped) {
                ((ModelScoped) target).setVisibility(this.visibility);
            }
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
        public void visit(Mergeable target, ProtectionLevel protectionLevel, int level, WegasFieldProperties field, Deque<Mergeable> ancestors, Mergeable[] references) {

            if (target instanceof AbstractEntity) {
                AbstractEntity entity = (AbstractEntity) target;
                if (references != null && references.length > 0 && references[0] != null) {
                    entity.forceRefId(references[0].getRefId());
                } else {
                    if (clear) {
                        entity.forceRefId(null);
                        entity.assertRefId();
                    }
                }
            }
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
}