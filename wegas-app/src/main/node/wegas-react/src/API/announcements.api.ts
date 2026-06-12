/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
import { rest } from './rest';
import { IAnnouncementWithId } from 'wegas-ts-api';

const ANNOUNCEMENTS_BASE = 'Announcement/';

export const AnnouncementsAPI = {
    getActiveAnnouncements(): Promise<IAnnouncementWithId[]> {
        return rest(ANNOUNCEMENTS_BASE + 'active').then((res: Response) => {
            return res.json();
        });
    },
};
