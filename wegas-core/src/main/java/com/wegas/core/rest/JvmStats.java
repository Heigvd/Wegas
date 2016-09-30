package com.wegas.core.rest;

import java.lang.management.*;
import java.util.*;
import javax.ejb.Stateless;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

/**
 * Created by jarle.hulaas@heig-vd.ch on 27.09.2016.
 *
 * No access control is implemented! Requests should be limited to a set of hosts allowed to monitor.
 */

@Stateless
@Path("JvmStats")
@Produces(MediaType.APPLICATION_JSON)
public class JvmStats {

    private static final long serialVersionUID = 1627669174708657566L;

    public static final String
        HEAP_USED_INIT = "HEAP_USED_INIT_BYTES",
        HEAP_USED_MAX = "HEAP_USED_MAX_BYTES",
        HEAP_USED_COMMITTED = "HEAP_USED_COMMITTED_BYTES",
        HEAP_USED = "HEAP_USED_BYTES",
        OLDGEN_USED_INIT = "OLDGEN_USED_INIT_BYTES",
        OLDGEN_USED_MAX = "OLDGEN_USED_MAX_BYTES",
        OLDGEN_USED_COMMITTED = "OLDGEN_USED_COMMITTED_BYTES",
        OLDGEN_USED = "OLDGEN_USED_BYTES",
        OLDGEN_USAGE_THRESHOLD = "OLDGEN_USAGE_THRESHOLD",
        OLDGEN_USAGE_THRESHOLD_EXCEEDED = "OLDGEN_USAGE_THRESHOLD_EXCEEDED",
        OLDGEN_USAGE_THRESHOLD_CNT = "OLDGEN_USAGE_THRESHOLD_CNT",
        NONHEAP_USED_INIT = "NONHEAP_USED_INIT_BYTES",
        NONHEAP_USED_MAX = "NONHEAP_USED_MAX_BYTES",
        NONHEAP_USED_COMMITTED = "NONHEAP_USED_COMMITTED_BYTES",
        NONHEAP_USED = "NONHEAP_USED_BYTES",
        THREAD_CNT = "THREAD_CNT",
        THREAD_DAEMON_CNT = "THREAD_DAEMON_CNT",
        THREAD_PEAK_CNT = "THREAD_PEAK_CNT",
        THREAD_STARTED_CNT = "THREAD_STARTED_CNT",
        LOADED_CLASS_CNT = "LOADED_CLASS_CNT",
        UNLOADED_CLASS_CNT = "UNLOADED_CLASS_CNT",
        TOTAL_LOADED_CLASS_CNT = "TOTAL_LOADED_CLASS_CNT",
        GC = "GC_",
        CNT = "_CNT",
        MILLIS = "_MS",
        STATS_EXEC_TIME_NANO = "STATS_EXEC_TIME_NANO";


    /*
    ** Returns the state of the tenured/old generation of the heap, i.e. the one for which a usage threshold can be set.
    ** Threshold values are returned and the threshold can be set with {@link #setUsageThreshold setUsageThreshold()} to allow simple polling.
    **
    ** @return JSON structure with heterogeneous values.
    */
    @GET
    @Path("oldGenHeap")
    public Map oldGenHeap() {
        long startTime = System.nanoTime();
        Map map = new HashMap<String,Object>();
        MemoryUsage heapUsed = findOldGenPool().getUsage();
        map.put(OLDGEN_USAGE_THRESHOLD, oldGenPool.getUsageThreshold());
        map.put(OLDGEN_USAGE_THRESHOLD_CNT, oldGenPool.getUsageThresholdCount());
        map.put(OLDGEN_USAGE_THRESHOLD_EXCEEDED, oldGenPool.isUsageThresholdExceeded());
        map.put(OLDGEN_USED, heapUsed.getUsed());
        map.put(OLDGEN_USED_COMMITTED, heapUsed.getCommitted());
        map.put(OLDGEN_USED_INIT, heapUsed.getInit());
        map.put(OLDGEN_USED_MAX, heapUsed.getMax());
        map.putAll(gc());
        map.put(STATS_EXEC_TIME_NANO, System.nanoTime() - startTime); // 1 millisecond = 1E6 nanoseconds
        return map;
    }

    /*
    ** Sets the old/tenured generation threshold to allow low-cost web-based polling.
    ** @param threshold the new collection usage threshold value in bytes.
    **        Must be non-negative and less than (or equal to) current max pool size.
    **        The usage threshold crossing checking is disabled if set to zero.
    ** @return resulting JSON structure from method {@link #oldGenHeap oldGenHeap}.
    */
    @GET
    @Path("setUsageThreshold/{threshold : [0-9]*}")
    public Map setUsageThreshold (@PathParam("threshold") Long threshold) {
        findOldGenPool().setUsageThreshold(threshold);
        return oldGenHeap();
    }

    /*
    ** Returns the global state of the heap.
    **
    ** @return JSON structure with heterogeneous values.
    */
    @GET
    @Path("globalHeap")
    public Map globalHeap() {
        Map map = new HashMap<String,Object>();
        MemoryMXBean memory = ManagementFactory.getMemoryMXBean();
        MemoryUsage heapUsed = memory.getHeapMemoryUsage();
        map.put(HEAP_USED_INIT, heapUsed.getInit());
        map.put(HEAP_USED_MAX, heapUsed.getMax());
        map.put(HEAP_USED_COMMITTED, heapUsed.getCommitted());
        map.put(HEAP_USED, heapUsed.getUsed());
        map.putAll(gc());
        return map;
    }

    /*
    ** Returns statistics on garbage collection activity.
    **
    ** @return JSON structure with heterogeneous values.
    */
    @GET
    @Path("gc")
    public Map gc() {
        Map map = new HashMap<String,Object>();
        long gcCount = 0;
        long gcTime = 0;
        for (GarbageCollectorMXBean gbean : ManagementFactory.getGarbageCollectorMXBeans()) {
            //map.put(GC + gbean.getName() + CNT, gbean.getCollectionCount());
            //map.put(GC + gbean.getName() + MILLIS, gbean.getCollectionTime());
            gcCount += gbean.getCollectionCount();
            gcTime += gbean.getCollectionTime();
        }
        map.put("GC_CNT", gcCount);
        map.put("GC_MS", gcTime);
        return map;
    }

    /*
    ** Returns statistics on non-heap memory.
    **
    ** @return JSON structure with heterogeneous values.
    */
    @GET
    @Path("nonHeap")
    public Map nonHeap() {
        Map map = new HashMap<String,Object>();
        MemoryMXBean memory = ManagementFactory.getMemoryMXBean();
        MemoryUsage nonheapUsed = memory.getNonHeapMemoryUsage();
        map.put(NONHEAP_USED_INIT, nonheapUsed.getInit());
        map.put(NONHEAP_USED_MAX, nonheapUsed.getMax());
        map.put(NONHEAP_USED_COMMITTED, nonheapUsed.getCommitted());
        map.put(NONHEAP_USED, nonheapUsed.getUsed());
        return map;
    }

    /*
    ** Returns statistics on threads inside the JVM.
    **
    ** @return JSON structure with heterogeneous values.
    */
    @GET
    @Path("threads")
    public Map threads() {
        ThreadMXBean threads = ManagementFactory.getThreadMXBean();
        Map map = new HashMap<String,Object>();
        map.put(THREAD_CNT, threads.getThreadCount());
        map.put(THREAD_DAEMON_CNT, threads.getDaemonThreadCount());
        map.put(THREAD_PEAK_CNT, threads.getPeakThreadCount());
        map.put(THREAD_STARTED_CNT, threads.getTotalStartedThreadCount());
        return map;
    }

    /*
    ** Returns statistics on class loader activity.
    **
    ** @return JSON structure with heterogeneous values.
    */
    @GET
    @Path("classLoader")
    public Map classLoader() {
        ClassLoadingMXBean classes = ManagementFactory.getClassLoadingMXBean();
        Map map = new HashMap<String,Object>();
        map.put(LOADED_CLASS_CNT, classes.getLoadedClassCount());
        map.put(UNLOADED_CLASS_CNT, classes.getUnloadedClassCount());
        map.put(TOTAL_LOADED_CLASS_CNT, classes.getTotalLoadedClassCount());
        return map;
    }


    /*
    ** In the current JVM, there is only one memory pool where usage thresholds are supported: the old/tenured pool.
    ** The following code identifies that pool and maintains a reference to it.
    */

    private static MemoryPoolMXBean oldGenPool = null;

    private static MemoryPoolMXBean findOldGenPool() {
        if (oldGenPool != null) {
            return oldGenPool;
        } else {
            for (MemoryPoolMXBean pool : ManagementFactory.getMemoryPoolMXBeans()) {
                if (pool.getType() == MemoryType.HEAP && pool.isUsageThresholdSupported()) {
                    oldGenPool = pool;
                    return pool;
                }
            }
            throw new AssertionError("Could not find old space");
        }
    }
}
