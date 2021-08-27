export interface PeerReviewTranslations {
  orchestrator: {
    mainTitle: (variable: string) => string;
    includeEvicted: string;
    state: {
      edition: {
        title: string;
        description: string;
        subDescription: string;
      };
      reviewing: {
        title: string;
        description: string;
        subDescription: string;
      };
      commenting: {
        title: string;
        description: string;
        subDescription: string;
      };
      completed: {
        title: string;
        description: string;
        subDescription: string;
      };
    };
    properties: string;
    overview: string;
    reviews: string;
    comments: string;
    charts: string;
    playerData: (variable: string) => string;
    teamData: (variable: string) => string;
    goNextConfirmation: { info: string; question: string };
    stats: {
      mean: string;
      median: string;
      sd: string;
      bounds: string;
      basedOn: (available: string, expected: string) => string;
      avgWc: string;
      avgCc: string;
    };
    notAvailableYet: string;
  };
  global: {
    submit: string;
    confirmation: { info: string; question: string };
    save: string;
  };
  tabview: {
    emptyness_message: string;
    toReviewTitle: string;
    toReview: string;
    toCommentTitle: string;
    toComment: string;
  };
  editor: {
    given: string;
    given_author: string;
    number: string;
    ask_your_feedback: string;
    your_feedback: string;
    reviewer_feedback: string;
    ask_reviewer_feedback: string;
    ask_comment: string;
    comment: string;
    author_comment: string;
    noValueProvided: string;
    didNotProvide: string;
    didNotProvidePluralized: string;
    noTeamProvide: string;
    noPlayerProvide: string;
  };
}
