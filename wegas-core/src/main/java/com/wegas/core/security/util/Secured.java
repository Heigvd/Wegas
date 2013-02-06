/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.util;

import java.lang.annotation.*;
import javax.interceptor.InterceptorBinding;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Inherited
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@InterceptorBinding
public @interface Secured {
}
