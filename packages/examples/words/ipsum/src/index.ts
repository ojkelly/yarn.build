console.log(process.env);
if (process.env.THROW) {
  throw new Error("An error occured becuase THROW was set.");
}
export default "ipsum";
