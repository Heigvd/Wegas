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
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.merge.utils.WegasCallback;
import com.wegas.core.persistence.variable.ModelScoped;
import com.wegas.core.persistence.variable.ModelScoped.Visibility;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

/**
 * Patch List or Map of AbstrctEntities
 *
 * @author maxence
 */
public final class WegasChildrenPatch extends WegasPatch {

    private Object from;
    private final Mergeable referenceEntity;
    private Boolean primitive = null;
    private Object to;

    private List<WegasPatch> patches;

    WegasChildrenPatch(Object identifier, int order,
            WegasCallback userCallback, Mergeable referenceEntity,
            Method getter, Method setter,
            Object from, Object to,
            boolean recursive, boolean ignoreNull, boolean sameEntityOnly, boolean initOnly,
            Visibility[] cascade) {

        super(identifier, order, getter, setter, userCallback, ignoreNull, sameEntityOnly, initOnly, recursive, cascade);
        this.patches = new ArrayList<>();
        this.from = from;
        this.to = to;
        this.referenceEntity = referenceEntity;

        Map<Object, Object> fromMap = asMap(from);
        Map<Object, Object> toMap = asMap(to);

        /*
         * Go through initial children
         */
        for (Entry<Object, Object> entry : fromMap.entrySet()) {
            Object key = entry.getKey();

            Object fromEntity = entry.getValue();
            Object toEntity = toMap.get(key);

            // this patch handles delete and update cases
            if (primitive) {
                patches.add(new WegasPrimitivePatch(key, 0, null, null, null, null, fromEntity, toEntity, false, false, false, cascade));
            } else {
                patches.add(new WegasEntityPatch(key, 0, null, null, null,
                        (Mergeable) fromEntity,
                        (Mergeable) toEntity, // null -> DELETE ; not null -> UPDATE
                        recursive, false, false, false, cascade));
            }

            if (to != null) {
                // since the patch to update "to" has been created, remove "to" from the map
                toMap.remove(key);
            }
        }

        /* Remaining entities in toMap are new */
        for (Entry<Object, Object> entry : toMap.entrySet()) {
            Object key = entry.getKey();
            Object toEntity = entry.getValue();
            if (primitive) {
                patches.add(new WegasPrimitivePatch(key, 0, null, null, null, null, null, toEntity, false, false, false, cascade));
            } else {
                patches.add(new WegasEntityPatch(key, 0, userCallback, null, null,
                        null, (Mergeable) toEntity, // from null to no null  -> CREATE
                        recursive, false, false, false, cascade));
            }
        }
    }

    /**
     * return a new Map which contains all children
     * If children is a map, return map is a copy of children.
     * If children is a list, returned map contains all children indexed by their refId
     *
     * @param children List or Map which contains children
     *
     * @return a brand new map which contains all children
     */
    private Map<Object, Object> asMap(Object children) {
        Map<Object, Object> theMap = new HashMap<>();
        if (children instanceof List) {
            List<Object> list = (List<Object>) children;

            for (int i = 0; i < list.size(); i++) {
                Object get = list.get(i);
                if (get != null) {
                    if (primitive == null) {
                        primitive = !Mergeable.class.isAssignableFrom(get.getClass());
                    }
                    if (primitive) {
                        theMap.put("" + i + ":" + get, get);
                        // theMap.put(i, get);
                    } else {
                        theMap.put(((Mergeable) get).getRefId(), get);

                    }
                }
            }

        } else if (children instanceof Map) {
            Map<Object, Object> map = (Map<Object, Object>) children;

            for (Entry<Object, Object> entry : map.entrySet()) {
                Object v = entry.getValue();
                if (primitive == null && v != null) {
                    primitive = !Mergeable.class.isAssignableFrom(v.getClass());
                }
                theMap.put(entry.getKey(), v);
            }

        }
        return theMap;
    }

    @Override
    public LifecycleCollector apply(Object target, WegasCallback callback, PatchMode parentMode, ModelScoped.Visibility visibility, LifecycleCollector collector, Integer numPass) {
        Mergeable targetEntity = null;
        if (target instanceof Mergeable) {
            targetEntity = (Mergeable) target;
        }

        logger.debug("Apply {} {}", this.getClass().getSimpleName(), identifier);
        logger.indent();
        try {
            if (shouldApplyPatch(targetEntity, referenceEntity)) {
                Object children = getter.invoke(targetEntity);

                if (!ignoreNull || to != null) {
                    if (!initOnly || children == null) {
                        final List<Object> childrenList;

                        final Map<Object, Object> childrenMap;

                        if (children instanceof Map) {
                            childrenMap = new HashMap<>();
                            childrenMap.putAll((Map<? extends Object, ? extends Object>) children);
                            childrenList = null;
                            children = childrenMap;
                        } else if (children instanceof List) {
                            childrenList = new ArrayList<>();
                            childrenList.addAll((List<? extends Object>) children);
                            children = childrenList;

                            childrenMap = null;
                        } else {
                            throw WegasErrorMessage.error("Incompatible type");
                        }

                        final Object finalChildren = children;

                        Map<Object, Object> tmpMap = asMap(children);
                        List<WegasCallback> callbacks = this.getCallbacks(callback);

                        WegasCallback registerChild = new WegasCallback() {
                            @Override
                            public void add(Object child, Object container, Object identifier) {

                                if (childrenList != null) {
                                    logger.info("Add child {}", child);
                                    if (identifier != null && identifier instanceof Integer) {
                                        childrenList.add((Integer) identifier, child);
                                    } else {
                                        childrenList.add(child);
                                    }
                                } else if (childrenMap != null) {
                                    childrenMap.put(identifier, child);
                                }

                                for (WegasCallback cb : callbacks) {
                                    cb.add(child, finalChildren, identifier);
                                }
                            }

                            @Override
                            public Object remove(Object child, Object container, Object identifier) {
                                Object key = null;
                                if (childrenList != null) {
                                    logger.info("remove child {}", child);
                                    int indexOf = childrenList.indexOf(child);
                                    if (indexOf >= 0) {
                                        key = indexOf;
                                        childrenList.remove(child);
                                    }
                                } else if (childrenMap != null) {
                                    childrenMap.remove(identifier);
                                    key = identifier;
                                }

                                for (WegasCallback cb : callbacks) {
                                    cb.remove(child, finalChildren, identifier);
                                }
                                return key;
                            }
                        };

                        for (WegasCallback cb : callbacks) {
                            cb.preUpdate(targetEntity, to, identifier);
                        }

                        logger.info("Pre Patch: target: {} from: {} to: {}", children, from, to);
                        for (WegasPatch patch : patches) {
                            Object key = patch.getIdentifier();
                            Object child = tmpMap.get(key);

                            patch.apply(child, registerChild, parentMode, visibility, collector, numPass);
                        }

                        logger.info("Post Patch: target: {} from: {} to: {}", children, from, to);

                        if (childrenList != null && numPass > 1 && !childrenList.isEmpty()) {
                            /*
                             * RESTORE LIST ORDER !
                             */
                            logger.info("Restore list order");
                            int i, j, delta = 0, newPos;
                            final List<Object> toList = new ArrayList<>();

                            if (primitive) {
                                tmpMap = new HashMap<>();
                                for (Object child : childrenList) {
                                    Long count = (Long) tmpMap.get(child);
                                    if (count == null) {
                                        count = 0l;
                                    }
                                    count++;
                                    tmpMap.put(child, count);
                                }
                            } else {
                                tmpMap = asMap(children);
                            }
                            for (Object entity : (List<Object>) to) {
                                if (primitive) {
                                    Long count = (Long) tmpMap.get(entity);
                                    if (count != null && count > 0) {
                                        count--;
                                        tmpMap.put(entity, count);
                                        toList.add(entity);
                                    }
                                } else {
                                    if (tmpMap.containsKey(((Mergeable) entity).getRefId())) {
                                        toList.add(entity);
                                    }
                                }
                            }
                            logger.info("sort {} against {}", childrenList, toList);

                            for (i = 0; i < childrenList.size(); i++) {
                                Object childA = childrenList.get(i);
                                for (j = i - delta; j < toList.size(); j++) {
                                    Object childB = toList.get(j);

                                    if ((childA.equals(childB))
                                            || (childA instanceof Mergeable && childB instanceof Mergeable
                                            && (((Mergeable) childA).getRefId() != null && ((Mergeable) childA).getRefId().equals(((Mergeable) childB).getRefId())))) {
                                        break;
                                    }
                                }
                                if (j < toList.size()) {
                                    newPos = j + delta;
                                    if (newPos > i) {
                                        Object child = childrenList.remove(i);
                                        childrenList.add(childrenList.size(), child);
                                        i--;
                                    }
                                } else {
                                    delta++;
                                }
                            }
                        }

                        setter.invoke(targetEntity, children);

                        for (WegasCallback cb : callbacks) {
                            cb.postUpdate(targetEntity, to, identifier);
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
