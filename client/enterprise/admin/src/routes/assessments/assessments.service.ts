import { mock_request } from '$lib/httpClient.local';

type AssessmentType = {
	id: number;
	name: string;
	qualyfing_criteria: number;
};

/**
 * Return list of assessments.
 *
 * @param [page_number=1] page_number
 * @param [page_size=10] page_size
 * */
export async function get_assessments(
	page_number: number = 1,
	page_size: number = 10
): Promise<Array<AssessmentType>> {
	if (process.env.NODE_ENV === 'development') {
		return await mock_request<Array<AssessmentType>>(
			[
				{
					id: 1,
					name: 'Prova Técnica 2025/01',
					qualyfing_criteria: 60
				},
				{
					id: 2,
					name: 'Prova Técnica 2025/02',
					qualyfing_criteria: 60
				}
			],
			{ status: 200 }
		);
	}

	return get_with_retry(`/some-uri/${id}`);
}
