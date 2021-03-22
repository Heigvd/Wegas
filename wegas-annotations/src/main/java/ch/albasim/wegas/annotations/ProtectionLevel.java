/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package ch.albasim.wegas.annotations;

/**
 * protection against scenario writes
 */
public enum ProtectionLevel {
    /**
     * Fetch from parent
     */
    CASCADED, /**
     * standard level for everything but default instances INTERNAL and PROTECTED are readonly for scenarist
     */
    PROTECTED, /**
     * open protected world to scenarist
     */
    INTERNAL, /**
     * Only PRIVATE is writable
     */
    INHERITED, /**
     * Always protected
     */
    ALL

}
