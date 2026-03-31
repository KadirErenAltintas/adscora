import { Redirect } from "wouter";

/** Legacy /dashboard route redirects to the main panel chat UI. */
export default function Dashboard() {
  return <Redirect to="/panel" />;
}
