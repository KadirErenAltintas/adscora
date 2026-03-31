import { Redirect } from "wouter";

/** Legacy route; main chat experience lives on `/panel`. */
export default function AIChat() {
  return <Redirect to="/panel" />;
}
