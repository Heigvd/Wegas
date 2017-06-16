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

    public interface Updater {

        void addEntity(AbstractEntity entity);

        void removeEntity(AbstractEntity entity);
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
     *   ListUtils.ListKeyToMap<Long, Transition> converter = new ListUtils.ListKeyToMap<Long, Transition>() {
     *       public Long getKey(Transition item) {
     *           return item.getId(); //Assume an Id exists
     *       }
     *   }; Map<Long, Transition> transitionMap =
     * ListUtils.listAsMap(transitionList, converter); }</pre>
     *
     * @param <K>  The key class
     * @param <V>  The value class
     * @param list The List to convert
     * @param key  ListKeyToMap object
     *
     * @return Map
     */
    public static <K, V> Map<K, V> listAsMap(final Collection<V> list, final ListKeyToMap<K, V> key) {
        final Map<K, V> map = new HashMap<>();
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
    public interface ListKeyToMap<K, V> {

        /**
         * retrieve a key from an object
         *
         * @param item
         *
         * @return the key
         */
        K getKey(V item);
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
     * This function takes two lists and merge them. This does not preserve any
     * order.
     * <br/> Assumptions:<br/>
     * - An element from the new list is new if it has no <code>KEY</code> or if
     * it's <code>ID</code> is missing in the old list<br/>
     * - 2 Abstract entities with the same <code>KEY</code> have to be
     * merged<br/>
     * - An element from the old list has to be removed if its <code>KEY</code>
     * is missing in the new list
     *
     * @param <E>      extends (@see AbstractEntity) the element type
     * @param oldList  The list containing old elements
     * @param newList  The list containing new elements
     * @param callback to maintain cache integrity
     * @param converter allow to use a peronalised element identifier (if null, elemenet.id will be used)
     *
     * @return A merged list
     */
    public static <E extends AbstractEntity> List<E> mergeLists(List<E> oldList, List<E> newList, Updater callback, ListKeyToMap<Object, E> converter) {


        /*
         * Shall we use the default converter ? 
         */
        if (converter == null) {
            // Use id as default key
            converter = new ListUtils.ListKeyToMap<Object, E>() {
                @Override
                public Long getKey(E item) {
                    return item.getId();
                }
            };
        }

        List<E> brandNewElements = new ArrayList<>(); // will store not yet persisted elements (ie no key)
        newList = clone(newList); // do NOT modify newList

        // go through newList to move branch new (not-yet-persisted) elements to brandNewElements List
        for (Iterator<E> it = newList.iterator(); it.hasNext();) {
            E element = it.next();
            if (converter.getKey(element) == null) {
                brandNewElements.add(element);
                it.remove();
            }
        }

        /**
         * newElement now contains all brand new element (without a key)
         * newList contains all others (which already have a key)
         */
        /**
         * Go through oldList and find witch elements from new List should be merge (those who exists in both list)
         * and which one should be removed (those who only exists in the old list)
         */
        Map<Object, E> elementsToMerge = ListUtils.listAsMap(newList, converter); // maps elements to process
        for (Iterator<E> it = oldList.iterator(); it.hasNext();) {
            E element = it.next();
            Object key = converter.getKey(element);
            if (elementsToMerge.containsKey(key)) {
                // element exists in both old and new list -> merge 
                element.merge(elementsToMerge.get(key));
                elementsToMerge.remove(key); // remove element from the toProcess list
            } else {
                // element does not exists in the newList: shoudl be removed from the old one
                if (callback != null) {
                    callback.removeEntity(element);
                }
                it.remove();
            }
        }

        /**
         * elements still in elementToMerge are elements coming from another entity, they should be treated as brandNewElement to avoid 
         */
        for (Iterator<E> it = elementsToMerge.values().iterator(); it.hasNext();) {  //Process remaining elements
            // cloning element avoids mixing elements from different entities (remember the so-called occupations multiplication issue)
            brandNewElements.add((E) it.next().clone());
        }

        //Add all new elements by cloning 
        for (E newEntity : brandNewElements) {
            // E clone = (E) newEntity.clone();
            //oldList.add(clone);
            oldList.add(newEntity); //only elements coming from another entity should be clone and it has already been done
            if (callback != null) {
                callback.addEntity(newEntity);
            }
        }
        //oldList.addAll(brandNewElements);
        final List<E> ret = new ArrayList<>();
        ret.addAll(oldList);
        return ret;
    }

    public static <E extends AbstractEntity> List<E> mergeLists(List<E> oldList, List<E> newList, Updater callback) {
        return mergeLists(oldList, newList, callback, null);
    }

    public static <E extends AbstractEntity> List<E> mergeLists(List<E> oldList, List<E> newList, ListKeyToMap<Object, E> converter) {
        return mergeLists(oldList, newList, null, converter);
    }

    public static <E extends AbstractEntity> List<E> mergeLists(List<E> oldList, List<E> newList) {
        return mergeLists(oldList, newList, null, null);
    }

    /**
     * This function takes two lists and replace the content of the first one
     * with the content from the second one.<br/>
     * Merging elements with same <code>id</code> and preserving second list's
     * order.
     *
     * @param <E>     extends (@see AbstractEntity) the element type
     * @param oldList The list containing old elements
     * @param newList The list containing new elements
     *
     * @return A merged list
     * 
     * @deprecated ??? which asset against mergeLists ?
     */
    public static <E extends AbstractEntity> List<E> mergeReplace(List<E> oldList, List<E> newList) {
        final List<E> updatedList = new ArrayList<>();
        ListUtils.ListKeyToMap<Long, E> converter = new ListUtils.ListKeyToMap<Long, E>() {
            @Override
            public Long getKey(E item) {
                return item.getId();
            }
        };
        Map<Long, E> elementMap = ListUtils.listAsMap(oldList, converter);      //Create a map with oldList based on Ids
        //  oldList.clear();
        for (E element : newList) {
            if (elementMap.containsKey(element.getId())) {                      //old element still exists
                elementMap.get(element.getId()).merge(element);                 //Then merge them
                updatedList.add(elementMap.get(element.getId()));
            } else {
                try {
                    E newElement = (E) element.getClass().newInstance();
                    newElement.merge(element);
                    updatedList.add(newElement);
                } catch (InstantiationException | IllegalAccessException ex) {
                }
            }
        }
        return updatedList;
    }
}
