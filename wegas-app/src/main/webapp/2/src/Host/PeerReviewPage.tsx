import * as React from 'react';
import { IPeerReviewDescriptor } from 'wegas-ts-api';

interface PeerReviewPageProps {
  peerReview: IPeerReviewDescriptor;
}

export default function PeerReviewPage({ peerReview }: PeerReviewPageProps) {
  return <div>{JSON.stringify(peerReview)}</div>;
}
