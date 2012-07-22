/*
 * Wegas.
 *
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.persistence;

import java.util.*;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class ListUtils {

    /**
     * Convert a list of object to a map. The key is based on a unique
     * identifier.<br/> Example:
     * <pre>{@code
     *   ListUtils.ListKeyToMap<Long, Transition> converter = new ListUtils.ListKeyToMap<Long, Transition>() {
     *       public Long getKey(Transition item) {
     *           return item.getId(); //Assume an Id exists
     *       }
     *   }; Map<Long, Transition> transitionMap =
     * ListUtils.listAsMap(transitionList, converter); }</pre>
     *
     * @param <K> The key class
     * @param <V> The value class
     * @param list The List to convert
     * @param key ListKeyToMap object
     * @return Map
     */
    public static <K, V> Map<K, V> listAsMap(Collection<V> list, ListKeyToMap<K, V> key) {
        Map<K, V> map = new HashMap<>();
        for (V item : list) {
            map.put(key.getKey(item), item);
        }
        return map;
    }

    /**
     * Simple interface to retrieve a key from an object.
     *
     * @param <K> the key class
     * @param <V> the object class
     */
    public static interface ListKeyToMap<K, V> {

        /**
         * retrieve a key from an object
         *
         * @param item
         * @return the key
         */
        public K getKey(V item);
    }

    /**
     * This function takes two lists and merge them.<br/> Assumptions:<br/>
     * - An element from the new list is new if it has no
     * <code>ID</code><br/>
     * - 2 Abstract entities with the same
     * <code>ID</code> have to be merged<br/>
     * - An element from the old list has
     * to be removed if its
     * <code>ID</code> is missing in the new list
     *
     * @param <E> extends {@see AbstractEntity} the element type
     * @param oldList The list containing old elements
     * @param newList The list containing new elements
     * @return A merged list
     */
    public static <E extends AbstractEntity> List<E> mergeLists(List<E> oldList, List<E> newList) {
        List<E> newElements = new ArrayList<>();
        for (Iterator<E> it = newList.iterator(); it.hasNext();) {                 //remove AbstractEntities without id and store them
            E element = it.next();
            if (element.getId() == null) {
                newElements.add(element);
                it.remove();
            }
        }
        ListUtils.ListKeyToMap<Long, E> converter = new ListUtils.ListKeyToMap<Long, E>() {

            @Override
            public Long getKey(E item) {
                return item.getId();
            }
        };
        Map<Long, E> elementMap = ListUtils.listAsMap(newList, converter);      //Create a map with newList based on Ids
        for (Iterator<E> it = oldList.iterator(); it.hasNext();) {
            E element = it.next();
            if (elementMap.containsKey(element.getId())) {                      //old element still exists
                element.merge(elementMap.get(element.getId()));                 //Then merge them
            } else {
                it.remove();                                                    //else remove that old element
            }
        }
        oldList.addAll(newElements);                                            //Add all new elements
        return oldList;
    }
}
