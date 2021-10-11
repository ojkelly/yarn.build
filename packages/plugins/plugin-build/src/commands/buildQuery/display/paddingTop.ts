interface PaddingTopProps {
  padding: number;
}
export const paddingTop = ({ padding }: PaddingTopProps): void => {
  for (let i = 0; i < padding; i++) {
    process.stdout.write("\n");
  }
};
