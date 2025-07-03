import type { PageLoad } from './$types';
import Logger from '$lib/logger';
import type { QuestionResponseType } from '$lib/types';

export async function load({ fetch }: Parameters<PageLoad>[0]) {
    let count = 0;
    const maxTries = 3 as const;
    while (true) {
        try {
            const res = await fetch('http://localhost:5002/questions');
            const questions: Array<QuestionResponseType> = await res.json();
            Logger.assert(questions.length !== 0);
            return { questions };
        } catch (error) {
            Logger.error('fething resource ', error);
            if (++count == maxTries) throw error;
        }
    }
};
