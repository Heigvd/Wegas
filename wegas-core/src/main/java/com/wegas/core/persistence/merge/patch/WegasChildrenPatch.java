/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.merge.patch;

import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.merge.utils.WegasCallback;
import java.lang.reflect.Method;
import java.util.ArrayList;
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

    WegasChildrenPatch(Object identifier, int order, PatchMode mode,
            WegasCallback userCallback, AbstractEntity referenceEntity,
            Method getter, Method setter,
            Object from, Object to,
            Boolean recursive, boolean ignoreNull, boolean sameEntityOnly, boolean initOnly) {

        this.mode = mode;
        this.order = order;
        this.identifier = identifier;
        this.patches = new ArrayList<>();

        this.from = from;
        this.to = to;

        this.getter = getter;
        this.setter = setter;

        this.fieldCallback = userCallback;

        this.sameEntityOnly = sameEntityOnly;
        this.initOnly = initOnly;

        this.referenceEntity = referenceEntity;

        if (recursive == null) {
            recursive = false;
        }

        Map<Object, AbstractEntity> fromMap = asMap(from);
        Map<Object, AbstractEntity> toMap = asMap(to);

        for (Entry<Object, AbstractEntity> entry : fromMap.entrySet()) {
            Object key = entry.getKey();

            AbstractEntity fromEntity = entry.getValue();
            AbstractEntity toEntity = toMap.get(key);

            // this patch handles delete and update cases
            patches.add(new WegasEntityPatch(key, 0, mode, null, null, null, fromEntity, toEntity, recursive, false, false));

            if (to != null) {
                // since the patch to update "to" has been created, remove "to" from the map
                toMap.remove(key);
            }
        }

        /* Remaining entities in toMap are new */
        for (Entry<Object, AbstractEntity> entry : toMap.entrySet()) {
            Object key = entry.getKey();
            AbstractEntity toEntity = entry.getValue();
            patches.add(new WegasEntityPatch(key, 0, mode, userCallback, null, null, null, toEntity, recursive, false, false));
        }
    }

    private Map<Object, AbstractEntity> asMap(Object children) {
        Map<Object, AbstractEntity> theMap = new HashMap<>();
        if (children instanceof List) {
            List<AbstractEntity> list = (List<AbstractEntity>) children;

            for (AbstractEntity ae : list) {
                theMap.put(ae.getSafeId(), ae);
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
    public void apply(AbstractEntity target, WegasCallback callback) {
        try {
            if (shouldApplyPatch(target, referenceEntity)) {
                Object children = getter.invoke(target);

                if (!initOnly || children == null) {
                    final List<AbstractEntity> childrenList;

                    final Map<Object, AbstractEntity> childrenMap;

                    if (children instanceof Map) {
                        childrenMap = (Map<Object, AbstractEntity>) children;
                        childrenList = null;
                    } else if (children instanceof List) {
                        childrenList = (List<AbstractEntity>) children;
                        childrenMap = null;
                    } else {
                        throw WegasErrorMessage.error("Incompatible type");
                    }

                    Map<Object, AbstractEntity> tmpMap = asMap(children);
                    List<WegasCallback> callbacks = this.getCallbacks(callback);

                    WegasCallback registerChild = new WegasCallback() {
                        @Override
                        public void postPersist(AbstractEntity entity, Object identifier) {
                            if (childrenList != null) {
                                childrenList.add(entity);
                            } else if (childrenMap != null) {
                                childrenMap.put(identifier, entity);
                            }

                            for (WegasCallback cb : callbacks) {
                                cb.postPersist(entity, identifier);
                            }
                        }

                        @Override
                        public void preDestroy(AbstractEntity entity, Object identifier) {
                            if (childrenList != null) {
                                childrenList.remove(entity);
                            } else if (childrenMap != null) {
                                childrenMap.remove(identifier);
                            }

                            for (WegasCallback cb : callbacks) {
                                cb.preDestroy(entity, identifier);
                            }
                        }
                    };

                    for (WegasCallback cb : callbacks) {
                        cb.preUpdate(target, to, identifier);
                    }

                    for (WegasEntityPatch patch : patches) {
                        Object key = patch.getIdentifier();
                        AbstractEntity child = tmpMap.get(key);

                        patch.apply(child, registerChild);
                    }

                    if (childrenList != null) {
                        /*
                         * RESTORE LIST ORDER !
                         */
                        int i, j, delta = 0, newPos;
                        final List<AbstractEntity> toList = (List<AbstractEntity>) to;

                        for (i = 0; i < childrenList.size(); i++) {
                            AbstractEntity childA = childrenList.get(i);
                            for (j = i; j < toList.size(); j++) {
                                AbstractEntity childB = toList.get(j);
                                if (childA.equals(childB) || childA.getSafeId().equals(childB.getSafeId())){
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
                }
            }
        } catch (Exception ex) {
            throw new RuntimeException(ex);
        }
    }
}
