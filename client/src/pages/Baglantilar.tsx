import { Redirect } from "wouter";

/** Ad connections are managed in the main panel; legacy route redirects. */
export default function Baglantilar() {
  return <Redirect to="/panel" />;
}
