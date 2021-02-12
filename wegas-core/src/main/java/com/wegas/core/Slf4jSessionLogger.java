/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core;

import java.util.HashMap;
import java.util.Map;
import org.eclipse.persistence.logging.AbstractSessionLog;
import org.eclipse.persistence.logging.SessionLog;
import org.eclipse.persistence.logging.SessionLogEntry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * https://github.com/PE-INTERNATIONAL/org.eclipse.persistence.logging.slf4j/blob/master/README.md
 * <p>
 * <p>
 * This is a wrapper class for SLF4J. It is used when messages need to be logged through SLF4J.
 * </p>
 * <p>
 * Para usar SLF4j para los logs de EclipseLink configuramos la propiedad
 * <code>eclipselink.logging.logger</code> con el valor
 * <code>org.eclipse.persistence.logging.Slf4jSessionLogger</code>
 * </p>
 * <p>
 * La configuración del nivel de los logs no se realiza en EclipseLink (con la propiedad
 * eclipselink.logging.level), sino en la implementación de SLF4J.
 * <p>
 * Se puede usar el resto de las propiedades de logging de EclipseLink
 * (eclipselink.logging.timestamp, eclipselink.logging.thread, eclipselink.logging.session,
 * eclipselink.logging.connection y eclipselink.logging.parameters) para configurar el formato de
 * salida.
 * <p>
 * Se usan las siguientes categorias de log:
 * <p>
 * <ul>
 * <li>org.eclipse.persistence.logging.default
 * <li>org.eclipse.persistence.logging.sql
 * <li>org.eclipse.persistence.logging.transaction
 * <li>org.eclipse.persistence.logging.event
 * <li>org.eclipse.persistence.logging.connection
 * <li>org.eclipse.persistence.logging.query
 * <li>org.eclipse.persistence.logging.cache
 * <li>org.eclipse.persistence.logging.propagation
 * <li>org.eclipse.persistence.logging.sequencing
 * <li>org.eclipse.persistence.logging.ejb
 * <li>org.eclipse.persistence.logging.ejb_or_metadata
 * <li>org.eclipse.persistence.logging.weaver
 * <li>org.eclipse.persistence.logging.properties
 * <li>org.eclipse.persistence.logging.server
 * </ul>
 * </p>
 * <p>
 * Los niveles de log de EclipseLink y SLF4J son distintos, se realiza la siguiente correspondencia:
 * </p>
 * <ul>
 * <li>ALL,FINER,FINEST -&gt; TRACE
 * <li>FINE -&gt; DEBUG
 * <li>CONFIG,INFO -&gt; INFO
 * <li>WARNING -&gt; WARN
 * <li>SEVERE -&gt; ERROR
 * </ul>
 * </p>
 * <p>
 *
 * @author Miguel Angel Sosvilla Luis.
 *
 */
public class Slf4jSessionLogger extends AbstractSessionLog {

    public static final String ECLIPSELINK_NAMESPACE = "org.eclipse.persistence.logging";

    private static final Map<String, Logger> LOGGERS = new HashMap<>();

    private Map<Integer, LogLevel> mapLevels;

    public Slf4jSessionLogger() {
        super();
        initMapLevels();
    }

    @Override
    public void log(SessionLogEntry entry) {
        if (!shouldLog(entry.getLevel(), entry.getNameSpace())) {
            return;
        }

        Logger logger = getLogger(entry.getNameSpace());
        LogLevel logLevel = getLogLevel(entry.getLevel());

        StringBuilder message = new StringBuilder();

        message.append(getSupplementDetailString(entry))
            .append(formatMessage(entry));

        switch (logLevel) {
            case TRACE:
                logger.trace(message.toString());
                break;
            case DEBUG:
                logger.debug(message.toString());
                break;
            case INFO:
                logger.info(message.toString());
                break;
            case WARN:
                logger.warn(message.toString());
                break;
            case ERROR:
                logger.error(message.toString());
                break;
            default:
                break;
        }
    }

    @Override
    public boolean shouldLog(int level, String category) {
        Logger logger = getLogger(category);

        LogLevel logLevel = getLogLevel(level);

        switch (logLevel) {
            case TRACE:
                return logger.isTraceEnabled();
            case DEBUG:
                return logger.isDebugEnabled();
            case INFO:
                return logger.isInfoEnabled();
            case WARN:
                return logger.isWarnEnabled();
            case ERROR:
                return logger.isErrorEnabled();
            default:
                return false;
        }
    }

    @Override
    public boolean shouldLog(int level) {
        return shouldLog(level, "default");
    }

    /**
     * Return true if SQL logging should log visible bind parameters. If the shouldDisplayData is
     * not set, return false.
     */
    @Override
    public boolean shouldDisplayData() {
        if (this.shouldDisplayData != null) {
            return shouldDisplayData.booleanValue();
        } else {
            return false;
        }
    }

    /**
     * INTERNAL: Return the Logger for the given category
     */
    private Logger getLogger(String category) {
        String loggerName;
        if (category != null) {
            loggerName = ECLIPSELINK_NAMESPACE + "." + category;
        } else {
            loggerName = ECLIPSELINK_NAMESPACE + ".default";
        }
        Logger logger = LOGGERS.get(loggerName);
        if (logger == null) {
            logger = LoggerFactory.getLogger(loggerName);
            LOGGERS.put(loggerName, logger);
        }

        return logger;
    }

    /**
     * Return the corresponding Slf4j Level for a given EclipseLink level.
     */
    private LogLevel getLogLevel(Integer level) {
        LogLevel logLevel = mapLevels.get(level);

        if (logLevel == null) {
            logLevel = LogLevel.OFF;
        }

        return logLevel;
    }

    /**
     * SLF4J log levels.
     *
     * @author Miguel Angel Sosvilla Luis
     *
     */
    enum LogLevel {
        TRACE, DEBUG, INFO, WARN, ERROR, OFF
    }

    /**
     * Relación de los niveles de log de EclipseLink y los de SLF4J
     */
    private void initMapLevels() {
        mapLevels = new HashMap<>();

        mapLevels.put(SessionLog.ALL, LogLevel.TRACE);
        mapLevels.put(SessionLog.FINEST, LogLevel.TRACE);
        mapLevels.put(SessionLog.FINER, LogLevel.TRACE);
        mapLevels.put(SessionLog.FINE, LogLevel.DEBUG);
        mapLevels.put(SessionLog.CONFIG, LogLevel.INFO);
        mapLevels.put(SessionLog.INFO, LogLevel.INFO);
        mapLevels.put(SessionLog.WARNING, LogLevel.WARN);
        mapLevels.put(SessionLog.SEVERE, LogLevel.ERROR);
    }

}
