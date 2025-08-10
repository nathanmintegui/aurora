import { get_with_retry } from '$lib/httpClient';
import { mock_request } from '$lib/httpClient.local';

type CandidateAssessmentType = {
	id: string;
	name: string;
	email: string;
	specialization: string;
	perfomance: number;
};

export async function get_assessments_by_id(
	id: string,
	_pageSize: number = 10,
	_pageNumber: number = 1
): Promise<Array<CandidateAssessmentType>> {
	if (process.env.NODE_ENV === 'development') {
		return await mock_request<Array<CandidateAssessmentType>>(
			[
				{
					id: '550e8400-e29b-41d4-a716-446655440000',
					name: 'Maria',
					email: 'matia@gmail.com',
					specialization: 'FullStack',
					perfomance: 65.48
				},
				{
					id: 'f0525176-b3f1-445b-8325-71a6c43b3eba',
					name: 'João',
					email: 'joao@gmail.com',
					specialization: 'Dados',
					perfomance: 49.1
				},
				{
					id: '49a05bf4-f5e1-4fc7-a388-8590a9470889',
					name: 'Carlos',
					email: 'carlos@gmail.com',
					specialization: 'QA',
					perfomance: 87.88
				}
			],
			{ status: 200 }
		);
	}

	return get_with_retry(`/some-uri/${id}`);
}
