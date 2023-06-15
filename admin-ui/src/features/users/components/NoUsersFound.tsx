import Sorry from "../../messages/Sorry";

export default function NoUsersFound() {
  return (
    <Sorry>
      <h2>No Users Found!</h2>
      <p>Please double-check the spellings</p>
    </Sorry>
  );
}
