import { rest } from './rest';
import { IAaiAccount, IPlayer, IRole } from 'wegas-ts-api';
import { IJpaAccount } from 'wegas-ts-api/typings/WegasEntities';

const USER_BASE = 'User/';

export const UserAPI = {
  /**
   * List all messages from an inbox
   * @param inboxId the id of the inbox
   */
  getUserInfo(
    userId: number = CurrentUser.id!,
  ): Promise<
    IUser & { accounts: (IJpaAccount | IAaiAccount)[] } & { roles: IRole[] }
  > {
    return rest(USER_BASE + userId).then((res: Response) => {
      return res.json();
    });
  },
  sendMail(from: string, to: IPlayer[], subject: string, body: string) {
    const email = {
      '@class': 'Email',
      from,
      to,
      subject,
      body,
    };
    return rest(USER_BASE + 'SendMail', {
      method: 'POST',
      body: JSON.stringify(email),
    }).then(res => res.json());
  },
};
