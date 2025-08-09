import { get_with_retry } from "$lib/httpClient";
import { mock_request } from "$lib/httpClient.local";

type CandidatePerformanceType = {
    personal_info: {
        id: string,
        name: string,
        email: string,
        specialization: string,
        perfomance: number
    },
    assessment_info: {
        results: {
            easy: {
                total: number,
                hits: number
            },
            medium: {
                total: number,
                hits: number
            }
            hard: {
                total: number,
                hits: number
            }
        },
        questions: {}
    }
}

export async function get_candidate_perfomance(candidate_id: string): Promise<CandidatePerformanceType> {
    const VALID_UUID_LENGTH = 36;

    if (candidate_id === undefined || candidate_id === null) {
        throw new Error("Parameter candidate_id is null or undefined.")
    }

    if (candidate_id.length !== VALID_UUID_LENGTH) {
        throw new Error("Parameter candidate_id is not a valid UUID.")
    }

    if (process.env.NODE_ENV === 'development') {
        return await mock_request<CandidatePerformanceType>(
            {
                personal_info: {
                    id: "fee6c8e9 - 78c4- 4f20 - aebc - 2d2af5494107",
                    name: "João da Silva",
                    email: "joao@gmail.com",
                    specialization: "Fullstack",
                    perfomance: 60
                },
                assessment_info: {
                    results: {
                        easy: {
                            total: 7,
                            hits: 4
                        },
                        medium: {
                            total: 2,
                            hits: 1
                        },
                        hard: {
                            total: 1,
                            hits: 1
                        }
                    },
                    questions: {}
                }
            }, { status: 200 }
        )
    }

    return get_with_retry(`/some-uri/${candidate_id}`);
}
