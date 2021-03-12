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
import { ActionItem } from './Overview';
import { globals } from '../../Components/Hooks/useScript';
import { asyncRunLoadedScript } from '../../data/Reducer/VariableInstanceReducer';
import { STeam } from 'wegas-ts-api';

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
  team?: STeam;
  item?: ActionItem;
  onExit: () => void;
  refreshOverview: () => void;
}

export function OverviewModal({
  modalState,
  team,
  item,
  onExit,
  refreshOverview,
}: OverviewModalProps) {
  return (
    <Modal
      onExit={onExit}
      className={modalStyle}
      innerClassName={modalContentStyle}
    >
      {modalState === 'Impacts' ? (
        <ImpactModalContent
          team={team}
          onExit={onExit}
          item={item}
          refreshOverview={refreshOverview}
        />
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
  team?: STeam;
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

interface ImpactModalContentProps {
  team?: STeam;
  item?: ActionItem;
  onExit: () => void;
  refreshOverview: () => void;
}

function ImpactModalContent({
  team,
  onExit,
  item,
  refreshOverview,
}: ImpactModalContentProps) {
  const [payload, setImpactValues] = React.useState({});

  if (item?.schema == null || item?.schema === 'undefined') {
    return <pre>Schema needed for impact</pre>;
  }
  const schemaFn = `return (${item?.schema})()`;
  const schema = globals.Function('team', schemaFn)(team);

  const doFn = `(${item?.do})(team,payload)`;

  const player = team?.getPlayers()[0].getEntity();

  return (
    <div className={cx(flex, flexColumn)}>
      <h2>{schema.description}</h2>
      <JSONForm value={payload} schema={schema} onChange={setImpactValues} />
      <div className={cx(flex, flexRow, flexDistribute, modalButtonsContainer)}>
        <Button
          disabled={player == null}
          tooltip={player == null ? 'No player in this team' : 'Apply impact'}
          label="Apply impact"
          onClick={() => {
            asyncRunLoadedScript(
              Game.selectCurrent().id!,
              doFn,
              player,
              undefined,
              {
                team: team?.getEntity(),
                payload,
              },
            ).then(refreshOverview),
              onExit();
          }}
        />
      </div>
    </div>
  );
}
