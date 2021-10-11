import { Ident } from "@yarnpkg/core";
import { Maybe } from "../../../types";

export const getName = (value: Maybe<Ident>): string => {
    if (value == null) {
        throw new Error("Invalid name");
    }
    if (value.scope) {
        return `@${value.scope}/${value.name}`;
    }

    return value.name;
};
