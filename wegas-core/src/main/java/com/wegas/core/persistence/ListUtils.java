/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import java.util.*;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public class ListUtils {

    /**
     * Callback to update JPA shared cache
     */
    public interface Updater {

        void addEntity(AbstractEntity entity);

        void removeEntity(AbstractEntity entity);
    }

    /**
     * Simple interface to retrieve a key from an object.
     *
     * @param <K> the key class
     * @param <V> the object class
     */
    public interface KeyExtractorI<K, V> {

        /**
         * retrieve a key from an object
         *
         * @param item
         *
         * @return the key
         */
        K getKey(V item);
    }

    /**
     * Default KeyExtractor implementation
     * Extract Id from an abstractEntity
     *
     */
    public static class IdExtractorA implements KeyExtractorI<Object, AbstractEntity> {

        @Override
        public Object getKey(AbstractEntity item) {
            return item.getId();
        }
    }



    /**
     * Clone a list, not its content
     *
     * @param list the list to clone
     * @param <E>  parametrized list type
     *
     * @return a new list with the same content as the original list
     */
    public static <E> List<E> clone(final List<E> list) {
        List<E> newInstance;
        try {
            newInstance = list.getClass().newInstance();
        } catch (InstantiationException | IllegalAccessException e) {
            //fallback to ArrayList
            newInstance = new ArrayList<>();
        }
        newInstance.addAll(list);
        return newInstance;
    }

    /**
     * Clone a list and add N element to it.
     *
     * @param list    List to clone
     * @param element vararg N element to add to the cloned list
     * @param <E>     parametrized list type
     *
     * @return a new list with same content as the original list. element added
     */
    @SafeVarargs
    public static <E> List<E> cloneAdd(final List<E> list, final E... element) {
        final List<E> retList = clone(list);
        Collections.addAll(retList, element);
        return retList;
    }

    /**
     * Convert a list of object to a map. The key is based on a unique
     * identifier.<br/> Example:
     * <pre>{@code
     * ListUtils.KeyExtractorI<Long, Transition> converter = new ListUtils.KeyExtractorI<Long, Transition>() {
     * public Long getKey(Transition item) {
     * return item.getId(); //Assume an Id exists
     * }
     * }; Map<Long, Transition> transitionMap =
     * ListUtils.listAsMap(transitionList, converter); }</pre>
     *
     * @param <K>  The key class
     * @param <V>  The value class
     * @param list The List to convert
     * @param key  KeyExtractorI object
     *
     * @return Map
     */
    public static <K, V> Map<K, V> listAsMap(final Collection<V> list, final KeyExtractorI<K, V> key) {
        final Map<K, V> map = new HashMap<>();
        for (V item : list) {
            map.put(key.getKey(item), item);
        }
        return map;
    }

    public static <K, V, E> Map<K, V> mapEntries(final Collection<E> list, final EntryExtractor<K, V, E> extractor) {
        final Map<K, V> map = new HashMap<>();
        for (E item : list) {
            map.put(extractor.getKey(item), extractor.getValue(item));
        }
        return map;
    }

    public interface EntryExtractor<K, V, E> {

        K getKey(E item);

        V getValue(E item);
    }

    /**
     * This function takes two lists and update the first with the content of the second, preserving the second order.
     * <br/> Assumptions:<br/>
     * - An element from otherList is new if it has no <code>KEY</code> or if
     * it's <code>key</code> is missing in the theList<br/>
     * - 2 Abstract entities with the same <code>KEY</code> have to be
     * merged<br/>
     * - An element from the theList has to be removed if its <code>KEY</code>
     * is missing in the otherList
     * - the otherList and its elemnt remain unchanged
     *
     * @param <E>       extends (@see AbstractEntity) the element type
     * @param theList   The list containing elements ("oldList")
     * @param otherList The list containing new elements (the "newList")
     * @param callback  to maintain cache integrity
     * @param converter allow to use a peronalised element identifier (if null, elemenet.id will be used)
     *
     * @return A brand new up-to-date list, which is a clone of theList
     */
    public static <E extends AbstractEntity> List<E> mergeLists(List<E> theList, List<E> otherList, Updater callback, KeyExtractorI<Object, E> converter) {

        if (converter == null) {
            /**
             * No converter provided: use id as default key
             */
            converter = (KeyExtractorI<Object, E>) new IdExtractorA();
        }

        /* map otherElements by their key */
        Map<Object, E> otherElements = ListUtils.listAsMap(otherList, converter); // maps elements to process

        /**
         * Process theList
         * <p>
         * Extract elements which are to be merged to merged list, remove others
         */
        Map<Object, E> merged = new HashMap<>();
        for (E e : theList) {
            Object key = converter.getKey(e);
            // Only keep element still in otherList
            if (otherElements.containsKey(key)) {
                // element exists in both list
                // merge it and store it in the merged list
                e.merge(otherElements.get(key));
                merged.put(key, e);
            } else {
                // element does not exists anylonger
                if (callback != null) {
                    callback.removeEntity(e);
                }
            }
        }
        /**
         * All elements from theList have been processed
         * Those who will survive have been merged, and stored within the merged list
         * Others have been deleted
         */
        theList.clear(); // make room in theList in order to preserve order

        /**
         * Process otherList.
         * there is two cases:
         * 1. element existed in theList ans has already been merged : put it back in theList
         * 2. element did not exists in theList: clone it and the clone in theList
         */
        for (E e : otherList) {
            Object key = converter.getKey(e);
            if (merged.containsKey(key)) {
                // Element already merged, put it back to theList
                theList.add(merged.get(key));
            } else {
                /**
                 * Either e came from another "world" (e.g. from defaultInstance to scoped-instance)
                 * either it's a new one
                 * <p>
                 * In both case : clone it (cloning element avoids mixing elements
                 * from different entities -- remember the so-called occupations multiplication issue)
                 */
                theList.add((E) e.clone());

                /*
                 * Since a new element is added to the destinationList, the callback has to be called
                 */
                if (callback != null) {
                    callback.addEntity(e);
                }
            }
        }

        /**
         * Using brand new list makes JPA cache manager happier
         */
        final List<E> ret = new ArrayList<>();
        ret.addAll(theList);
        return ret;
    }

    /**
     * @param <E>
     * @param theList   the original list to update
     * @param otherList the list to take new elements from
     * @param updater   callback to update the cache
     *
     * @return
     *
     * @see ListUtils#mergeLists(java.util.List, java.util.List, com.wegas.core.persistence.ListUtils.Updater, com.wegas.core.persistence.ListUtils.ListKeyToMap)
     */
    public static <E extends AbstractEntity> List<E> mergeLists(List<E> theList, List<E> otherList, Updater updater) {
        return mergeLists(theList, otherList, updater, null);
    }

    /**
     *
     * @param <E>
     * @param theList   the original list to update
     * @param otherList the list to take new elements from
     * @param converter allow to identify element with a different key (element's id is the default one)
     *
     * @return
     *
     * @see ListUtils#mergeLists(java.util.List, java.util.List, com.wegas.core.persistence.ListUtils.Updater, com.wegas.core.persistence.ListUtils.ListKeyToMap)
     */
    public static <E extends AbstractEntity> List<E> mergeLists(List<E> theList, List<E> otherList, KeyExtractorI<Object, E> converter) {
        return mergeLists(theList, otherList, null, converter);
    }

    /**
     * @param <E>
     * @param theList   the original list to update
     * @param otherList the list to take new elements from
     *
     * @return
     *
     * @see ListUtils#mergeLists(java.util.List, java.util.List, com.wegas.core.persistence.ListUtils.Updater, com.wegas.core.persistence.ListUtils.ListKeyToMap)
     */
    public static <E extends AbstractEntity> List<E> mergeLists(List<E> theList, List<E> otherList) {
        return mergeLists(theList, otherList, null, null);
    }
}
