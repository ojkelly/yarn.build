import {exec} from 'child_process';
import { promisify } from 'util';
import { getPlatform } from './get-platform';

const execute = promisify(exec);

export const getAllChildProccess = async (pid: number | string): Promise<number[]> => {
    const platform = getPlatform();
    const command = (({platform, pid}: {platform: 'unix' | 'windows', pid: string | number}) => {
        switch (platform) {
            case 'unix':
                return `pgrep "-P ${pid}"`;

            case 'windows':
                return `wmic process where (ParentProcessId=${pid}) get ProcessId`;
    
            default:
                throw new Error('Invalid case');
        }
    })({platform, pid});
    let messages: number[] = [];

    try {
        const {stdout} = await execute(command);
        
        messages = stdout.split(`\n`).filter(Boolean).map((value) => parseInt(value, 10)).filter((value) => !isNaN(value));
    } catch(e) {
        // Empty on purpose
    }

    return messages;
};
