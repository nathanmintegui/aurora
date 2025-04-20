import http from 'k6/http';
import { sleep, check } from 'k6';

export let options = {
    stages: [
        { duration: '30s', target: 150 },   // Ramp-up to 10 users
        { duration: '1m', target: 300 },    // Hold at 10 users
        { duration: '30s', target: 0 },    // Ramp-down to 0
    ],
};

export default function() {
    const url = 'http://localhost:5002/questions/5353aedc-c178-4677-a9dd-53cb2644a078/submit';

    const payload = JSON.stringify({
        code:
            `function twoSum(nums, target) {
                    const map = new Map();
                    for (let i = 0; i < nums.length; i++) {
                        const complement = target - nums[i];
                        if (map.has(complement)) {
                            return [map.get(complement), i];
                        }
                        map.set(nums[i], i);
                    }
                    return [];
                }

             module.exports = twoSum;`,
        lang: '1',
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const res = http.post(url, payload, params);

    check(res, {
        'status is 202': (r) => r.status === 202,
        'response time < 500ms': (r) => r.timings.duration < 500,
    });

    sleep(1); // Optional: wait 1 second between requests
}

