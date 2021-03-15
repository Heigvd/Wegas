import { cx } from 'emotion';
import * as React from 'react';
import { TeamAPI } from '../../../API/teams.api';
import { UserAPI } from '../../../API/user.api';
import { Button } from '../../../Components/Inputs/Buttons/Button';
import { schemaProps } from '../../../Components/PageComponents/tools/schemaProps';
import {
  flex,
  flexColumn,
  flexRow,
  flexDistribute,
} from '../../../css/classes';
import { Game } from '../../../data/selectors';
import JSONForm from 'jsoninput';
import { modalButtonsContainer } from './OverviewModal';

const mailFormSchema = {
  description: 'Mail',
  properties: {
    from: schemaProps.string({
      label: 'From',
      readOnly: true,
    }),
    to: schemaProps.string({
      label: 'To',
      readOnly: true,
    }),
    subject: schemaProps.string({
      label: 'Subject',
    }),
    body: schemaProps.html({
      label: 'Body',
    }),
  },
};

interface Email {
  from: string | undefined;
  to: string | undefined;
  subject: string | undefined;
  body: string | undefined;
}

interface MailModalContentProps {
  team?: STeam;
  onExit: () => void;
}

export function MailModalContent({ team, onExit }: MailModalContentProps) {
  const [emails, setEmails] = React.useState<Email>({
    from: undefined,
    to: undefined,
    subject: undefined,
    body: undefined,
  });

  React.useEffect(() => {
    let mounted = true;

    UserAPI.getUserInfo().then(res => {
      const from = res.accounts[0].email;
      TeamAPI.getEmails(Game.selectCurrent().id!, team?.getId()).then(res => {
        if (mounted) {
          setEmails(o => ({ ...o, from, to: res.join(';') }));
        }
      });
    });

    return () => {
      mounted = false;
    };
  }, [team]);

  const disabled =
    emails.subject == null ||
    emails.subject === '' ||
    emails.body == null ||
    emails.body === '';
  return emails.to?.length === 0 ? (
    <pre>
      All the user of this team or the game choosed to hide their e-mail adress
    </pre>
  ) : (
    <div className={cx(flex, flexColumn)}>
      <JSONForm
        value={emails}
        schema={mailFormSchema}
        onChange={({ subject, body }: Email) =>
          setEmails(o => ({ ...o, subject, body }))
        }
      />
      <div className={cx(flex, flexRow, flexDistribute, modalButtonsContainer)}>
        <Button
          label="Send e-mail"
          icon={'envelope'}
          disabled={disabled}
          tooltip={
            disabled ? 'Subject or body of the message is empty' : 'Send e-mail'
          }
          onClick={() => {
            UserAPI.sendMail(
              emails.from || '',
              team?.getPlayers().map(p => p.getEntity()) ||
                CurrentGame.teams.reduce((o, t) => [...o, ...t.players], []),
              emails.subject || '',
              emails.body || '',
            ).then(onExit);
          }}
        />
        <Button label="Download e-mail addresses" icon="download" />
      </div>
    </div>
  );
}
