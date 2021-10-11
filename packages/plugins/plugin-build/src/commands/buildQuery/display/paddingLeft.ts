import { DisplayFormatType } from "./displayFormatType";

interface Characters {
    firstCharacters:  string;
    tabString: string;
}
interface PaddingLeftProps {
    padding: number;
    step?: number;
    characters?: Characters;
    format: DisplayFormatType;
}

const DefaultCharacters: Characters = {
    firstCharacters: '➤ ',
    tabString: '│ '
};

const COLOR = 'gray' as const;

export const paddingLeft = ({format, padding, step = 5, characters = DefaultCharacters}: PaddingLeftProps): void => {
    const {firstCharacters, tabString} = characters;
    const tabCharacters = tabString.split('');

    for (let i = 0; i < padding; i++) {
        const chars = Array(step).fill(' ').map((empty, index) => {
            if (index < tabCharacters.length) {
                return tabCharacters[index];
            }

            return empty;
        }).join('');

        process.stdout.write(format(chars, COLOR));
    }
    process.stdout.write(format(firstCharacters, COLOR));
};
