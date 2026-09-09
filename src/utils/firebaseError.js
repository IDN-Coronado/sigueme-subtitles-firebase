/**
 * Why a Firestore call failed, in terms the operator can act on.
 *
 * Every read this app makes needs isOperator() — signed in AND approved in
 * operators/{uid} — so "permission-denied" almost always means the machine is
 * signed in but still waiting on an admin, which is a different problem from
 * being offline and has a different fix.
 */
export const NOT_APPROVED = "notApproved";
export const SIGNED_OUT = "signedOut";
export const GENERIC = "generic";

export function describeFirebaseError(error) {
  const code = error?.code;
  if (code === "permission-denied") return NOT_APPROVED;
  if (code === "unauthenticated") return SIGNED_OUT;
  return GENERIC;
}
