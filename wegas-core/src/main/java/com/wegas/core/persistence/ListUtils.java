/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import java.lang.reflect.InvocationTargetException;
import java.util.*;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public class ListUtils {

    private ListUtils() {
        // empty private constructor to prevent class initialisation
    }

    /**
     * Callback to update JPA shared cache
     */
    public interface Updater {

        void addEntity(AbstractEntity entity);

        void removeEntity(AbstractEntity entity);
    }

    public static class EmptyUpdater implements Updater {

        @Override
        public void addEntity(AbstractEntity entity) {
            // default behaviour is noop
        }

        @Override
        public void removeEntity(AbstractEntity entity) {
            // default behaviour is noop
        }

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
     * <p>
     */
    public static class IdExtractor implements KeyExtractorI<Object, AbstractEntity> {

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
            newInstance = list.getClass().getDeclaredConstructor().newInstance();
        } catch (InstantiationException | IllegalAccessException | NoSuchMethodException | SecurityException | IllegalArgumentException | InvocationTargetException e) {
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

    /**
     *
     * @param <K> Key type
     * @param <V> value type
     * @param <E> Entity type
     */
    public interface EntryExtractor<K, V, E> {

        K getKey(E item);

        V getValue(E item);
    }
}
