import { getScriptableInstance } from '../../methods/VariableDescriptorMethods';
import { SPeerReviewDescriptor, SPeerReviewInstance, SPlayer } from 'wegas-ts-api';

export class SPeerReviewDescriptorImpl extends SPeerReviewDescriptor {
	public setState(_p: Readonly<SPlayer>, _stateName: string): void {
		throw Error('This is readonly');
	}

	public getState(p: Readonly<SPlayer>): string {
		return this.getInstance(p).getReviewState();
	}

	public getInstance(player: Readonly<SPlayer>): Readonly<SPeerReviewInstance> {
		return getScriptableInstance<SPeerReviewInstance>(this, player);
	}
}