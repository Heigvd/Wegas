/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb.js;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author maxence
 */
public class JavaObjectInvocationHandler implements InvocationHandler {

    private static final Logger logger = LoggerFactory.getLogger(JavaObjectInvocationHandler.class);

    private Object wrapped;

    public JavaObjectInvocationHandler(Object wrapped) {
        this.wrapped = wrapped;
    }

    public static <T> T wrap(T towrap, Class<T> klass) {
        return (T) (Proxy.newProxyInstance(klass.getClassLoader(), new Class[]{klass}, new JavaObjectInvocationHandler(towrap)));
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        logger.info("INVOKE: {}", method.getName());
        if (method.getAnnotation(Deprecated.class) != null) {
            logger.error("DEPRECATED CALL: {}", method.getName());
        }
        return method.invoke(wrapped, args);
    }

}
