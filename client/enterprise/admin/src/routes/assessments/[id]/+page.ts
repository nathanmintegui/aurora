import { get_assessments_by_id } from './assessment.service';

export async function load({ params }: Record<string, any>) {
	return {
		candidates: await get_assessments_by_id(params.id),
		assessment: {
			id: params.id,
			name: 'Prova Técnica 2025/2',
			qualifying_criteria: 60
		}
	};
}
