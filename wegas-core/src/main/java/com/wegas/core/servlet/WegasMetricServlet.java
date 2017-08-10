/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.servlet;

import io.prometheus.client.exporter.MetricsServlet;
import javax.servlet.annotation.WebServlet;

@WebServlet(name = "metrics-startup", loadOnStartup = 2, urlPatterns = "/metrics")
public class WegasMetricServlet extends MetricsServlet {
    private static final long serialVersionUID = -6262523517953867043L;

}
