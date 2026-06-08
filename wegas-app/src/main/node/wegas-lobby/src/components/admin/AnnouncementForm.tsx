/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

import { IAnnouncement, IAnnouncementWithId } from 'wegas-ts-api';
import React from 'react';
import Form, { Field } from '../common/Form';

function isValidTimestamp(timestamp: number) {
    if (!Number.isFinite(timestamp) || timestamp <= 0) return false;
    const date = new Date(timestamp);
    return !isNaN(date.getTime());
}

export const announcementFields: Field<IAnnouncement>[] = [
    {
        type: 'textarea',
        label: 'Message',
        key: 'message',
        isMandatory: true,
        errorMessage: 'Need a message',
    },
    {
        type: 'select',
        label: 'Type',
        key: 'messageType',
        defaultValue: 'INFO',
        values: ['INFO', 'WARNING', 'MAINTENANCE', 'INCIDENT'],
        isMandatory: false,
    },
    {
        type: 'date',
        representation: 'timestamp',
        label: 'Display Start Time',
        key: 'displayStartTime',
        isMandatory: true,
        withTime: true,
        errorMessage: 'Invalid display start time',
        isErroneous: a => !isValidTimestamp(a.displayStartTime),
    },
    {
        type: 'date',
        representation: 'timestamp',
        label: 'Display End Time',
        key: 'displayEndTime',
        isMandatory: true,
        withTime: true,
        errorMessage: 'Invalid display end time',
        isErroneous: a => !isValidTimestamp(a.displayEndTime),
    },
    {
        type: 'date',
        representation: 'timestamp',
        label: 'Intervention Start Time',
        key: 'interventionStartTime',
        isMandatory: false,
        withTime: true,
        showIf: a => a.messageType === 'MAINTENANCE',
        errorMessage: 'Invalid intervention start time',
        isErroneous: a => a.interventionStartTime == null || !isValidTimestamp(a.interventionStartTime),
    },
    {
        type: 'date',
        representation: 'timestamp',
        label: 'Intervention End Time',
        key: 'interventionEndTime',
        isMandatory: false,
        withTime: true,
        showIf: a => a.messageType === 'MAINTENANCE',
        errorMessage: 'Invalid intervention end time',
        isErroneous: a => a.interventionEndTime == null || !isValidTimestamp(a.interventionEndTime),
    },
];

export default function AnnouncementForm(
    {announcement, onSubmit, submitLabel}: { announcement: IAnnouncement | IAnnouncementWithId; onSubmit: (v: IAnnouncement | IAnnouncementWithId) => Promise<void>; submitLabel?: string }
): JSX.Element {

    return (
        <Form
            fields={announcementFields}
            value={announcement}
            onSubmit={onSubmit}
            submitLabel={submitLabel}
        />
    );
}
