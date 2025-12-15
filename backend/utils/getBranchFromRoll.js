export function getBranchFromRoll(roll_number) {
  const branchCode = roll_number.substring(2, 4).toLowerCase();

  switch (branchCode) {
    case "pw":
      return "SS";
    case "pt":
      return "TCS";
    case "pc":
      return "CS";
    case "pd":
      return "DS";
    default:
      return null; // or throw error if roll_number is invalid
  }
}