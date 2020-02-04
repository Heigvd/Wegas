/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.merge.patch;

import ch.albasim.wegas.annotations.IMergeable;
import ch.albasim.wegas.annotations.ProtectionLevel;
import ch.albasim.wegas.annotations.WegasCallback;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasRuntimeException;
import com.wegas.core.merge.utils.LifecycleCollector;
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.variable.ModelScoped;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;

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
        ProtectionLevel protectionLevel) {

        super(identifier, order, getter, setter, userCallback, ignoreNull, sameEntityOnly, initOnly, recursive, protectionLevel);
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
            if (primitive != null) {
                if (primitive) {
                    patches.add(new WegasPrimitivePatch(key, 0, null, referenceEntity, null, null, fromEntity, toEntity, false, false, false, this.protectionLevel));
                } else {
                    patches.add(new WegasEntityPatch(key, 0, null, null, null,
                        (Mergeable) fromEntity,
                        (Mergeable) toEntity, // null -> DELETE ; not null -> UPDATE
                        recursive, false, false, false, this.protectionLevel));
                }

                if (to != null) {
                    // since the patch to update "to" has been created, remove "to" from the map
                    toMap.remove(key);
                }

            } else {
                // not able yet (java8) to retrieve effective class as generic types does not exists in runtime anymore...
                logger.debug("Unable to guess patch type: ignore {}'s {}", referenceEntity, identifier);
            }
        }

        /* Remaining entities in toMap are new */
        for (Entry<Object, Object> entry : toMap.entrySet()) {
            Object key = entry.getKey();
            Object toEntity = entry.getValue();
            if (primitive != null) {
                if (primitive) {
                    patches.add(new WegasPrimitivePatch(key, 0, null, referenceEntity, null, null, null, toEntity, false, false, false, this.protectionLevel));
                } else {
                    patches.add(new WegasEntityPatch(key, 0, userCallback, null, null,
                        null, (Mergeable) toEntity, // from null to no null  -> CREATE
                        recursive, false, false, false, this.protectionLevel));
                }

            } else {
                // not able yet (java8) to retrieve effective class as generic types does not exists in runtime anymore...
                logger.debug("Unable to guess patch type: ignore {}'s {}", referenceEntity, identifier);
            }
        }

    }

    /**
     * return a new Map which contains all children If children is a map, return map is a copy of
     * children. If children is a list, returned map contains all children indexed by their refId
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
                        Mergeable m = (Mergeable) get;
                        if (Helper.isNullOrEmpty(m.getRefId())) {
                            // no refiId means new object, set it
                            m.setRefId(m.getClass().getSimpleName() + ":#" + i + ":" + Helper.genToken(6));
                        }
                        theMap.put(m.getRefId(), get);
                    }
                }
            }
        } else if (children instanceof Set) {
            for (Object get : (Set<Object>) children) {
                if (get != null) {
                    if (primitive == null) {
                        primitive = !Mergeable.class.isAssignableFrom(get.getClass());
                    }
                    if (primitive) {
                        theMap.put(get, get);
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
    public LifecycleCollector apply(GameModel targetGameModel, Deque<Mergeable> ancestors, Object targetObject, WegasCallback callback, PatchMode parentMode, ModelScoped.Visibility visibility, LifecycleCollector collector, Integer numPass, boolean bypassVisibility) {

        logger.debug("Apply {} {}", this.getClass().getSimpleName(), identifier);
        logger.indent();
        try {
            Mergeable parent = ancestors != null ? ancestors.peek() : null;

            if (shouldApplyPatch(parent, referenceEntity)) {
                Object children = getter.invoke(parent);

                if (!ignoreNull || to != null) {
                    if (!initOnly || children == null) {
                        final List<Object> childrenList;

                        final Map<Object, Object> childrenMap;

                        final Set<Object> childrenSet;

                        if (children instanceof Map) {
                            childrenMap = new HashMap<>();
                            // add extra key identifier like parentRefId->
                            childrenMap.putAll((Map<? extends Object, ? extends Object>) children);
                            childrenList = null;
                            childrenSet = null;
                            children = childrenMap;
                        } else if (children instanceof List) {
                            //childrenList = new ArrayList<>();
                            //childrenList.addAll((List<? extends Object>) children);
                            //children = childrenList;
                            childrenList = (List<Object>) children;
                            childrenSet = null;
                            childrenMap = null;
                        } else if (children instanceof Set) {
                            childrenSet = (Set<Object>) children;
                            childrenMap = null;
                            childrenList = null;
                        } else {
                            throw WegasErrorMessage.error("Incompatible type");
                        }

                        Map<Object, Object> tmpMap = asMap(children);
                        if ((this.primitive != null && !this.primitive) || parentMode != PatchMode.DELETE) { // no need to delete primitive collections
                            List<WegasCallback> callbacks = this.getCallbacks(callback);

                            WegasCallback registerChild = new WegasCallback() {
                                @Override
                                public void add(Object child, IMergeable container, Object identifier) {

                                    if (childrenList != null) {
                                        logger.info("Add child {}", child);
                                        if (identifier != null && identifier instanceof Integer) {
                                            childrenList.add((Integer) identifier, child);
                                        } else {
                                            childrenList.add(child);
                                        }
                                    } else if (childrenMap != null) {
                                        childrenMap.put(identifier, child);
                                    } else if (childrenSet != null) {
                                        childrenSet.add(child);
                                    }

                                    for (WegasCallback cb : callbacks) {
                                        cb.add(child, parent, identifier);
                                    }
                                }

                                @Override
                                public Object remove(Object child, IMergeable container, Object identifier) {
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
                                    } else if (childrenSet != null) {
                                        childrenSet.remove(child);
                                        if (child instanceof Mergeable) {
                                            key = ((Mergeable) child).getRefId();
                                        } else {
                                            key = child;
                                        }
                                    }

                                    for (WegasCallback cb : callbacks) {
                                        cb.remove(child, parent, identifier);
                                    }
                                    return key;
                                }
                            };

                            for (WegasCallback cb : callbacks) {
                                cb.preUpdate(parent, to, identifier);
                            }

                            logger.info("Pre Patch: target: {} from: {} to: {}", children, from, to);
                            for (WegasPatch patch : patches) {
                                Object key = patch.getIdentifier();
                                Object child = tmpMap.get(key);
                                patch.apply(targetGameModel, ancestors, child, registerChild, parentMode, visibility, collector, numPass, bypassVisibility);
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

                                logger.info("sorted: {}", childrenList);
                            }

                            if (parentMode == PatchMode.DELETE
                                && ((childrenList != null && childrenList.size() > 0)
                                || (childrenMap != null && childrenMap.size() > 0)
                                || (childrenSet != null && childrenSet.size() > 0))) {
                                // children
                                logger.info("orphans: {}", children);

                                for (WegasCallback cb : callbacks) {
                                    cb.registerOrphans(children);
                                }
                            }

                            setter.invoke(parent, children);

                            for (WegasCallback cb : callbacks) {
                                cb.postUpdate(parent, to, identifier);
                            }
                        } else {
                            logger.debug("SKIP: no need to delete primitives");
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
        } catch (IllegalAccessException | IllegalArgumentException | InvocationTargetException ex) {
            Throwable cause = ex.getCause();
            if (cause instanceof WegasRuntimeException) {
                throw (WegasRuntimeException) cause;
            } else {
                throw new RuntimeException(cause != null ? cause : ex);
            }
        } finally {
            logger.unindent();
        }
        logger.debug("DONE {} {}", this.getClass().getSimpleName(), identifier);

        return collector;
    }

    @Override
    protected StringBuilder print(int indent) {
        StringBuilder sb = super.print(indent);
        for (WegasPatch patch : patches) {
            sb.append(patch.print(indent + 1));
        }
        return sb;
    }

    @Override
    protected PatchDiff buildDiff() {
        List<PatchDiff> subs = new ArrayList<>();

        for (WegasPatch patch : patches) {
            PatchDiff sub = patch.buildDiff();
            if (sub != null) {
                subs.add(sub);
            }
        }
        if (!subs.isEmpty()) {
            return new WegasEntityPatch.DiffCollection(null, subs);
        } else {
            return null;
        }
    }
}
