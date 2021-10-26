/* eslint-disable */
// @ts-ignore
import type * as lambda from "aws-lambda";
// @ts-ignore
import { muglify } from "@workspace/lib";

export async function handler(): Promise<lambda.APIGatewayProxyResult> {
  try {
    const value = muglify("function foobar() { /* WILL BE STRIPPED OUT */ }");

    return {
      statusCode: 200,
      body: JSON.stringify(value),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify(e),
    };
  }
}

// When run, this file executes the handler and outputs the result.
if (require.main === module) {
  handler()
    .then((res) => {
      console.log(JSON.stringify(res));
    })
    .catch((e) => {
      console.error(e);
    });
}
