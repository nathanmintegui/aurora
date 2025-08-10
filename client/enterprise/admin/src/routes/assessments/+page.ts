import { get_assessments } from './assessments.service';

export async function load({ params }: Record<string, any>) {
	return {
		assessments: await get_assessments()
	};
}
