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
import com.wegas.core.persistence.variable.ModelScoped;
import java.lang.reflect.Method;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author maxence
 */
public class MergeHelper {

    private static final Logger logger = LoggerFactory.getLogger(MergeHelper.class);

    public interface MergeableVisitor {

        public void visit(Mergeable target, Mergeable reference);

    }

    /**
     *
     *
     * @param target
     * @param reference
     * @param forceRecursion do not follow includeByDefault=false properted unless forceRecursion is true
     * @param visitor
     */
    public static void visitMergeable(Mergeable target, Mergeable reference,
            Boolean forceRecursion, MergeableVisitor visitor) {

        if (target != null) {
            visitor.visit(target, reference);

            WegasEntityFields entityIterator = WegasEntitiesHelper.getEntityIterator(target.getClass());

            for (WegasFieldProperties field : entityIterator.getFields()) {
                try {
                    if (field.getAnnotation().includeByDefault() || forceRecursion) {
                        Method readMethod = field.getPropertyDescriptor().getReadMethod();
                        switch (field.getType()) {
                            case CHILD:
                                Mergeable targetChild = (Mergeable) readMethod.invoke(target);
                                Mergeable referenceChild = null;

                                if (reference != null) {
                                    referenceChild = (Mergeable) readMethod.invoke(reference);
                                }

                                MergeHelper.visitMergeable(targetChild, referenceChild, forceRecursion, visitor);
                                break;
                            case CHILDREN:
                                Object children = readMethod.invoke(target);
                                Object referenceChildren = null;

                                if (reference != null) {
                                    referenceChildren = readMethod.invoke(reference);
                                }

                                if (children instanceof List) {
                                    List childrenList = (List) children;
                                    List refList = (List) referenceChildren;

                                    if (!childrenList.isEmpty()) {
                                        for (int i = 0; i < childrenList.size(); i++) {
                                            Object get = childrenList.get(i);
                                            if (get instanceof Mergeable) {
                                                Mergeable refGet = null;
                                                if (refList != null && i < refList.size()) {
                                                    refGet = (Mergeable) refList.get(i);
                                                }
                                                MergeHelper.visitMergeable((Mergeable) get, refGet, forceRecursion, visitor);
                                            } else {
                                                // children are not mergeable: skip all
                                                break;
                                            }
                                        }
                                    }

                                } else if (children instanceof Map) {
                                    Map<Object, Object> childrenMap = (Map) children;
                                    Map<Object, Object> refMap = (Map) referenceChildren;

                                    for (Entry<Object, Object> entry : childrenMap.entrySet()) {
                                        Object child = entry.getValue();
                                        if (child instanceof Mergeable) {
                                            Mergeable ref = null;
                                            if (refMap != null) {
                                                ref = (Mergeable) refMap.get(entry.getKey());
                                            }
                                            MergeHelper.visitMergeable((Mergeable) child, ref, forceRecursion, visitor);
                                        } else {
                                            // children are not mergeable: skip all
                                            break;
                                        }
                                    }
                                }
                                break;
                        }
                    }
                } catch (Exception ex) {
                    logger.error(ex.toString());
                    throw new WegasErrorMessage("error", "Invocation Failure: should never appends");
                }
            }
        }
    }

    private static class VisibilityResetter implements MergeableVisitor {

        private final ModelScoped.Visibility visibility;

        public VisibilityResetter(ModelScoped.Visibility visibility) {
            this.visibility = visibility;
        }

        @Override
        public void visit(Mergeable target, Mergeable reference) {
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
    public static void resetVisibility(Mergeable target, ModelScoped.Visibility visibility) {
        MergeHelper.visitMergeable(target, null, Boolean.TRUE, new VisibilityResetter(visibility));
    }

    private static class RefidResetter implements MergeableVisitor {

        @Override
        public void visit(Mergeable target, Mergeable reference) {

            if (target instanceof AbstractEntity) {
                AbstractEntity entity = (AbstractEntity) target;
                if (reference != null) {
                    entity.forceRefId(reference.getRefId());
                } else {
                    ((AbstractEntity) target).forceRefId(null);
                    entity.forceRefId(null);
                    entity.assertRefId();
                }
            }
        }
    }

    /**
     *
     * @param target
     * @param reference
     */
    public static void resetRefIds(AbstractEntity target, AbstractEntity reference) {
        MergeHelper.visitMergeable(target, reference, Boolean.FALSE, new RefidResetter());
    }
}
