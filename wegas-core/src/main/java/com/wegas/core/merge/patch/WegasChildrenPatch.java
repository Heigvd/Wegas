/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.merge.patch;

import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.merge.utils.LifecycleCollector;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.merge.utils.WegasCallback;
import com.wegas.core.persistence.variable.ModelScoped;
import com.wegas.core.persistence.variable.ModelScoped.Visibility;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

/**
 *
 * @author maxence
 */
public final class WegasChildrenPatch extends WegasPatch {

    private Object from;
    private final AbstractEntity referenceEntity;
    private Object to;

    private List<WegasEntityPatch> patches;

    WegasChildrenPatch(Object identifier, int order,
            WegasCallback userCallback, AbstractEntity referenceEntity,
            Method getter, Method setter,
            Object from, Object to,
            boolean recursive, boolean ignoreNull, boolean sameEntityOnly, boolean initOnly,
            Visibility[] cascade) {

        super(identifier, order, getter, setter, userCallback, ignoreNull, sameEntityOnly, initOnly, recursive, cascade);
        this.patches = new ArrayList<>();
        this.from = from;
        this.to = to;
        this.referenceEntity = referenceEntity;

        Map<Object, AbstractEntity> fromMap = asMap(from);
        Map<Object, AbstractEntity> toMap = asMap(to);

        for (Entry<Object, AbstractEntity> entry : fromMap.entrySet()) {
            Object key = entry.getKey();

            AbstractEntity fromEntity = entry.getValue();
            AbstractEntity toEntity = toMap.get(key);

            // this patch handles delete and update cases
            patches.add(new WegasEntityPatch(key, 0, null, null, null,
                    fromEntity,
                    toEntity, // null -> DELETE ; not null -> UPDATE
                    recursive, false, false, false, cascade));

            if (to != null) {
                // since the patch to update "to" has been created, remove "to" from the map
                toMap.remove(key);
            }
        }

        /* Remaining entities in toMap are new */
        for (Entry<Object, AbstractEntity> entry : toMap.entrySet()) {
            Object key = entry.getKey();
            AbstractEntity toEntity = entry.getValue();
            patches.add(new WegasEntityPatch(key, 0, userCallback, null, null,
                    null, toEntity, // from null to no null  -> CREATE
                    recursive, false, false, false, cascade));
        }
    }

    private Map<Object, AbstractEntity> asMap(Object children) {
        Map<Object, AbstractEntity> theMap = new HashMap<>();
        if (children instanceof List) {
            List<AbstractEntity> list = (List<AbstractEntity>) children;

            for (AbstractEntity ae : list) {
                theMap.put(ae.getRefId(), ae);
            }
        } else if (children instanceof Map) {
            Map<Object, AbstractEntity> map = (Map<Object, AbstractEntity>) children;

            for (Entry<Object, AbstractEntity> entry : map.entrySet()) {
                theMap.put(entry.getKey(), entry.getValue());
            }

        }
        return theMap;
    }

    @Override
    public LifecycleCollector apply(AbstractEntity target, WegasCallback callback, PatchMode parentMode, ModelScoped.Visibility visibility, LifecycleCollector collector, Integer numPass) {
        logger.debug("Apply {} {}", this.getClass().getSimpleName(), identifier);
        logger.indent();
        try {
            if (shouldApplyPatch(target, referenceEntity)) {
                Object children = getter.invoke(target);

                if (!ignoreNull || to != null) {
                    if (!initOnly || children == null) {
                        final List<AbstractEntity> childrenList;

                        final Map<Object, AbstractEntity> childrenMap;

                        if (children instanceof Map) {
                            childrenMap = new HashMap<>();
                            childrenMap.putAll((Map<? extends Object, ? extends AbstractEntity>) children);
                            childrenList = null;
                            children = childrenMap;
                        } else if (children instanceof List) {
                            childrenList = new ArrayList<>();
                            childrenList.addAll((List<? extends AbstractEntity>) children);
                            children = childrenList;

                            childrenMap = null;
                        } else {
                            throw WegasErrorMessage.error("Incompatible type");
                        }

                        final Object finalChildren = children;

                        Map<Object, AbstractEntity> tmpMap = asMap(children);
                        List<WegasCallback> callbacks = this.getCallbacks(callback);

                        WegasCallback registerChild = new WegasCallback() {
                            @Override
                            public void add(AbstractEntity entity, Object container, Object identifier) {
                                if (childrenList != null) {
                                    childrenList.add(entity);
                                } else if (childrenMap != null) {
                                    childrenMap.put(identifier, entity);
                                }

                                for (WegasCallback cb : callbacks) {
                                    cb.add(entity, finalChildren, identifier);
                                }
                            }

                            @Override
                            public void remove(AbstractEntity entity, Object container, Object identifier) {
                                if (childrenList != null) {
                                    childrenList.remove(entity);
                                } else if (childrenMap != null) {
                                    childrenMap.remove(identifier);
                                }

                                for (WegasCallback cb : callbacks) {
                                    cb.remove(entity, finalChildren, identifier);
                                }
                            }
                        };

                        for (WegasCallback cb : callbacks) {
                            cb.preUpdate(target, to, identifier);
                        }

                        for (WegasEntityPatch patch : patches) {
                            Object key = patch.getIdentifier();
                            AbstractEntity child = tmpMap.get(key);

                            patch.apply(child, registerChild, parentMode, visibility, collector, numPass);
                        }

                        if (childrenList != null && numPass > 1) {
                            /*
                             * RESTORE LIST ORDER !
                             */
                            int i, j, delta = 0, newPos;
                            final List<AbstractEntity> toList = new ArrayList<>();

                            tmpMap = asMap(children);
                            for (AbstractEntity entity : (List<AbstractEntity>) to) {
                                if (tmpMap.containsKey(entity.getRefId())) {
                                    toList.add(entity);
                                }
                            }

                            for (i = 0; i < childrenList.size(); i++) {
                                AbstractEntity childA = childrenList.get(i);
                                for (j = i; j < toList.size(); j++) {
                                    AbstractEntity childB = toList.get(j);

                                    if (childA.equals(childB) || (childA.getRefId() != null && childA.getRefId().equals(childB.getRefId()))) {
                                        break;
                                    }
                                }
                                if (j < toList.size()) {
                                    newPos = j + delta;
                                    if (newPos > i) {
                                        AbstractEntity child = childrenList.remove(i);
                                        childrenList.add(newPos, child);
                                        i--;
                                    }
                                } else {
                                    delta++;
                                }
                            }
                        }

                        setter.invoke(target, children);

                        for (WegasCallback cb : callbacks) {
                            cb.postUpdate(target, to, identifier);
                        }
                    } else {
                        logger.debug("REJECT PATCH: INIT ONLY");
                    }
                } else {
                    logger.debug("REJECT PATCH: IGNORE_NULL");
                }

            } else {
                logger.debug("REJECT PATCH: SAME_ENTITY_ONLY FAILED");
            }
        } catch (Exception ex) {
            throw new RuntimeException(ex);
        }
        logger.debug(" DONE {} {}", this.getClass().getSimpleName(), identifier);
        logger.unindent();
        return collector;
    }

    @Override
    protected StringBuilder print(int ident) {
        StringBuilder sb = super.print(ident);
        for (WegasPatch patch : patches) {
            sb.append(patch.print(ident + 1));
        }
        return sb;
    }

}
