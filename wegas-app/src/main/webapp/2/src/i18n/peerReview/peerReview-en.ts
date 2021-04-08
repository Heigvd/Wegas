import { PeerReviewTranslations } from './definitions';

export const peerReviewTranslationsEN: PeerReviewTranslations = {
  orchestrator: {
    mainTitle: function (variableName) {
      return `Peer Review Process for "${variableName}"`;
    },
    includeEvicted:
      'Authors who did not submit anything for review shall still receive something to review',
    state: {
      edition: {
        title: 'Edition',
        description: 'The authors are editing what will be reviewed',
        subDescription: 'The process has not begun yet',
      },
      reviewing: {
        title: 'Reviewing',
        description: 'The authors are reviewing their peers',
        subDescription: 'This is the first step of the process',
      },
      commenting: {
        title: 'Commenting',
        description: 'The authors acquaint themselves with peer reviews',
        subDescription: 'They comment on those reviews',
      },
      completed: {
        title: 'Completed',
        description: 'The reviewing process has been completed',
        subDescription:
          "The authors take acquaintance of comments on reviews they've done",
      },
    },
    properties: 'Properties',
    overview: 'Overview',
    reviews: 'Reviews',
    comments: 'Comments',
    charts: 'Charts',
    playerData: function (playerName) {
      return `Data reviewed by peers for player "${playerName}"`;
    },
    teamData: function (teamName) {
      return `Data reviewed by peers for team "${teamName}"`;
    },
    goNextConfirmation:
      'This action cannot be undone.<br />\nDo you want to enter the next step of the reviewing process?',
    stats: {
      mean: 'avg.',
      median: 'med.',
      sd: '&sigma;',
      bounds: 'bounds',
      basedOn: function (available, expected) {
        return `based on ${available}/${expected} values`;
      },
      avgWc: 'Average number of words',
      avgCc: 'Average number of characters',
    },
    notAvailableYet: 'Not available yet',
  },
  global: {
    submit: 'submit',
    confirmation:
      'Once submitted, those data will be final!<br /> Do you really want to submit them ?',
    save: 'save',
  },
  tabview: {
    emptyness_message: 'No review available yet',
    toReviewTitle: 'Review your peers',
    toReview: 'Submission',
    toCommentTitle: 'Reviews of your submission',
    toComment: 'Reviewer',
  },
  editor: {
    given: 'Given: ',
    number: '#',
    ask_your_feedback: 'Edit your feedback',
    your_feedback: 'Your feedback:',
    reviewer_feedback: 'Reviewer feedback',
    ask_reviewer_feedback: '',
    ask_comment: "What do you think about your reviewer's feedback?",
    comment: "Your thoughts about feedback your reviewer's feedback",
    author_comment: 'What this author thinks about your feedback:',
    noValueProvided: 'No evaluation provided',
    didNotProvide: 'did not provide any evaluation',
    didNotProvidePluralized: 'did not provide any evaluation',
    noTeamProvide: 'no team has provided any evaluation',
    noPlayerProvide: 'no player has provided any evaluation',
  },
};
