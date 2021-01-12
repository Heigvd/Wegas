/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb.statemachine;

import com.wegas.core.persistence.variable.statemachine.StateMachineInstance;
import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;

/**
 *
 * @author cyril
 */
/**
 * Used to store Events during run. Prevent passing multiple event transitions
 * with same event if less events where thrown. StateMachineInstance dependant.
 */
public class StateMachineEventCounter {

    private final Map<StateMachineInstance, Map<String, Integer>> smEvents;
    private final Map<String, Integer> currentEventsCounter;

    public StateMachineEventCounter() {
        this.smEvents = new HashMap<>();
        this.currentEventsCounter = new HashMap<>();
    }

    public int count(StateMachineInstance instance, String event) {
        if (!smEvents.containsKey(instance)) {
            smEvents.put(instance, new HashMap<>());
        }
        if (smEvents.get(instance).containsKey(event)) {
            return smEvents.get(instance).get(event);
        } else {
            return 0;
        }
    }

    public void increase(StateMachineInstance instance, String event) {
        if (!smEvents.containsKey(instance)) {
            smEvents.put(instance, new HashMap<>());
        }
        smEvents.get(instance).put(event, this.count(instance, event) + 1);
    }

    public void clear() {
        clearCurrents();
        this.smEvents.clear();
    }

    public void clearCurrents() {
        this.currentEventsCounter.clear();
    }

    public void acceptCurrent(StateMachineInstance instance) {
        for (Entry<String, Integer> entry : currentEventsCounter.entrySet()) {
            Integer count = entry.getValue();
            while (count > 0) {
                count--;
                this.increase(instance, entry.getKey());
            }
        }
        this.clearCurrents();
    }

    public void registerEvent(String eventName) {
        Integer count = this.currentEventsCounter.get(eventName);
        if (count == null) {
            count = 0;
        }
        count++;
        this.currentEventsCounter.put(eventName, count);
    }

    public int countCurrent(String eventName) {
        Integer get = this.currentEventsCounter.get(eventName);
        if (get != null) {
            return get;
        } else {
            return 0;
        }
    }
}
