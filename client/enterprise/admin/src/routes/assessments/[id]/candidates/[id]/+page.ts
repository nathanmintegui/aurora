import { get_candidate_perfomance } from './candidates.service';

export async function load({ params }: Record<string, any>) {
	const { personal_info, assessment_info } = await get_candidate_perfomance(params.id);

	return { personal_info, assessment_info };
}
