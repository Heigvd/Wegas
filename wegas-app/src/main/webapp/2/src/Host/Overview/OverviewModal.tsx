import { css, cx } from 'emotion';
import * as React from 'react';
import { TeamAPI } from '../../API/teams.api';
import { UserAPI } from '../../API/user.api';
import { Modal } from '../../Components/Modal';
import { schemaProps } from '../../Components/PageComponents/tools/schemaProps';
import { themeVar } from '../../Components/Style/ThemeVars';
import { flex, flexColumn, flexDistribute, flexRow } from '../../css/classes';
import { Game } from '../../data/selectors';
import '../../Editor/Components/FormView';
import JSONForm from 'jsoninput';
import { Button } from '../../Components/Inputs/Buttons/Button';
import { wlog } from '../../Helper/wegaslog';
import { ActionItem } from './Overview';
import { globals } from '../../Components/Hooks/useScript';

const modalStyle = css({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0,0,0,0.2)',
});

const modalContentStyle = css({
  position: 'relative',
  '&>div': {
    color: themeVar.Common.colors.ActiveColor,
  },
});

const modalButtonsContainer = css({
  marginTop: '10px',
});

export type ModalState = 'Close' | 'Mail' | 'Impacts';

interface OverviewModalProps {
  modalState: ModalState;
  team?: ITeam;
  item?: ActionItem;
  onExit: () => void;
}

export function OverviewModal({
  modalState,
  team,
  item,
  onExit,
}: OverviewModalProps) {
  return (
    <Modal
      onExit={onExit}
      className={modalStyle}
      innerClassName={modalContentStyle}
    >
      {modalState === 'Impacts' ? (
        <ImpactModalContent team={team} onExit={onExit} item={item} />
      ) : (
        <MailModalContent team={team} onExit={onExit} />
      )}
    </Modal>
  );
}

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
  team?: ITeam;
  onExit: () => void;
}

function MailModalContent({ team, onExit }: MailModalContentProps) {
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
      TeamAPI.getEmails(Game.selectCurrent().id!, team?.id).then(res => {
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
              team?.players ||
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

interface ImpactModalContentProps {
  team?: ITeam;
  item?: ActionItem;
  onExit: () => void;
}

function ImpactModalContent({ team, onExit, item }: ImpactModalContentProps) {
  const [impactValues, setImpactValues] = React.useState({});

  const schemaFn = `return (${item?.schema})()`;

  if (item?.schema == null || item?.schema === 'undefined') {
    return <pre>Schema needed for impact</pre>;
  }

  const schema = globals.Function('team', 'payload', schemaFn)(team);

  return (
    <div className={cx(flex, flexColumn)}>
      <JSONForm
        value={impactValues}
        schema={{
          description: 'Impact',
          properties: schema,
        }}
        onChange={setImpactValues}
      />
      <div className={cx(flex, flexRow, flexDistribute, modalButtonsContainer)}>
        <Button
          label="Apply impact"
          onClick={() => {
            wlog('Impact!');
            onExit();
          }}
        />
      </div>
    </div>
  );
}
