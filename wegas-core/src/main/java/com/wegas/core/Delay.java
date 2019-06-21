package com.wegas.core;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Delay uses an other thread to notify self the delay has been hit.
 * Polling this object {@link Delay#poll()} to eventually throw an exception.
 * <pre>{@code
 * try(final Delay delay = new Delay(1000L, myExecutorService)){
 *     // ...
 *     delay.poll();
 *     // ...
 *     delay.poll();
 * }
 * }</pre>
 */
final public class Delay implements AutoCloseable {
    private final AtomicBoolean end = new AtomicBoolean(false);
    private final Future<?> submit;

    public Delay(long delay, ExecutorService executorService) {
        submit = executorService.submit(() -> {
            try {
                Thread.sleep(delay);
                end.set(true);
            } catch (InterruptedException e) {
                end.set(true);
                Thread.currentThread().interrupt();
            }
        });
    }

    /**
     * Check if delay has been hit.
     *
     * @throws DelayExceededException when the delay has been hit.
     */
    public void poll() throws DelayExceededException {
        if (end.get()) {
            throw new DelayExceededException();
        }
    }

    /**
     * Clean up thread.
     * Calling {@link #poll()} after this will make it throw.
     */
    @Override
    public void close() {
        submit.cancel(true);
    }

    public static class DelayExceededException extends RuntimeException {

        private DelayExceededException() {
            super("Timed out");
        }
    }
}
