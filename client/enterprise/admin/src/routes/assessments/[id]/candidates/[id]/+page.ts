import { get_candidate_perfomance } from './candidates.service';
import type { PageLoad } from './$types';

export async function load({ params }: Parameters<PageLoad>[0]): Promise<ReturnType<PageLoad>> {
	const { personal_info, assessment_info } = await get_candidate_perfomance(params.id);

	return { personal_info, assessment_info };
}
