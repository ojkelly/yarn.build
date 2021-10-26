import { handler } from "./api";

// When run, this file executes the handler and outputs the result.
handler()
  .then((res) => {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(res));
  })
  .catch((e) => {
    console.error(e);
  });
