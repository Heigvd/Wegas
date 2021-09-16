import { cx } from '@emotion/css';
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
      fullWidth: true,
    }),
    to: schemaProps.string({
      label: 'To',
      readOnly: true,
      fullWidth: true,
    }),
    subject: schemaProps.string({
      label: 'Subject',
      fullWidth: true,
    }),
    body: schemaProps.html({
      label: 'Body',
      noResize: true,
    }),
  },
};

function copyToClipboard(value: string) {
  return navigator.clipboard.writeText(value).then(
    function () {
      return true;
    },
    function () {
      return false;
    },
  );
}

interface Email {
  from: string | undefined;
  to: string | undefined;
  subject: string | undefined;
  body: string | undefined;
}

interface MailModalContentProps {
  team: STeam | STeam[] | undefined;
  onExit: () => void;
}

export function MailModalContent({ team, onExit }: MailModalContentProps) {
  const [emails, setEmails] = React.useState<Email>({
    from: undefined,
    to: undefined,
    subject: undefined,
    body: undefined,
  });
  const [copied, setCopied] = React.useState(false);
  const mounted = React.useRef(false);

  const copyEmails = React.useCallback(() => {
    if (emails.to != null) {
      copyToClipboard(emails.to).then(succes => {
        if (succes && mounted.current) {
          setCopied(true);
          setTimeout(() => {
            if (mounted.current) {
              setCopied(false);
            }
          }, 5000);
        }
      });
    }
  }, [emails.to]);

  React.useEffect(() => {
    mounted.current = true;

    UserAPI.getUserInfo().then(res => {
      const from = res.accounts[0].email;
      TeamAPI.getEmails(
        Game.selectCurrent().id!,
        Array.isArray(team) ? undefined : team?.getId(),
      ).then(res => {
        if (mounted.current) {
          setEmails(o => ({ ...o, from, to: res.join(';') }));
        }
      });
    });

    return () => {
      mounted.current = false;
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
      <h2>Send e-mail</h2>
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
          icon="envelope"
          disabled={disabled}
          tooltip={
            disabled ? 'Subject or body of the message is empty' : 'Send e-mail'
          }
          onClick={() => {
            UserAPI.sendMail(
              emails.from || '',
              Array.isArray(team)
                ? team.reduce(
                    (o, t) => [...o, ...t.getPlayers().map(p => p.getEntity())],
                    [],
                  )
                : team?.getPlayers().map(p => p.getEntity()) ||
                    CurrentGame.teams
                      .filter(t => t['@class'] === 'Team')
                      .reduce((o, t) => [...o, ...t.players], []),
              emails.subject || '',
              emails.body || '',
            ).then(onExit);
          }}
        />
        <Button
          label={
            copied
              ? 'E-mail addresses copied in clipboard'
              : 'Copy e-mail addresses to clipboard'
          }
          icon={copied ? 'check' : 'copy'}
          disabled={emails.to == null}
          tooltip={
            emails.to == null
              ? 'No e-mail addresses to copy'
              : 'Copy e-mail addresses to clipboard'
          }
          onClick={copyEmails}
        />
      </div>
    </div>
  );
}
