import { get_assessments } from './assessments.service';

export async function load() {
	return {
		assessments: await get_assessments()
	};
}
