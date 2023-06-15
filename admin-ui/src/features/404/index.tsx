import ErrorMessage from "../messages/Error";

export default function Error404() {
  return (
    <ErrorMessage>
      <h1>Error 404</h1>
      <p>This page doesn&apos;t exist or you don&apos;t have permission to see it.</p>
    </ErrorMessage>
  );
}
