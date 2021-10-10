import { Filename } from '@yarnpkg/fslib';
import _glob from 'glob';
import { promisify } from "util";

const glob = promisify(_glob);

interface GetAllFilesProps {
    cwd: string;
}

export const getAllFiles = async (
    {
        cwd
    }: GetAllFilesProps): Promise<Filename[]> => {
       try {
        const files = await glob(`${cwd}/**/*`) as Filename[];   

        return files.map((fileName) => fileName.split(`${cwd}/`)[1] ?? '').filter(Boolean) as Filename[];
       } catch(_e) {
           return [];
       }
};
