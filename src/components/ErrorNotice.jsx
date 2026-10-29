import useAuthUser from "../hooks/useAuthUser";
import {
  GENERIC,
  NOT_APPROVED,
  describeFirebaseError,
} from "../utils/firebaseError";
import { MONO } from "../fonts";
import { t } from "../i18n";


/**
 * A failed action, said in terms of the fix.
 *
 * `title` names the action when the caller knows it ("Could not upload the
 * file"); without one the cause supplies the heading. Either may stand alone:
 * a validation message has no error, and a caught exception often has no
 * caller-supplied title.
 *
 * The uid is shown for the approval case specifically — it is the one thing an
 * admin needs to unblock this machine, and hunting for it in Settings is the
 * whole friction.
 */
function ErrorNotice({ error, title }) {
  const user = useAuthUser();
  if (!error && !title) return null;

  const kind = error ? describeFirebaseError(error) : null;
  // A caller-supplied title already says what failed, so the generic body
  // would only pad it. The Firebase cases always explain, since "not approved
  // yet" is not something the caller could have known to say.
  const body = kind && !(kind === GENERIC && title) ? t(`errors.${kind}Body`) : null;

  return (
    <div className="flex flex-col gap-2 border border-[rgba(255,180,171,0.35)] bg-[rgba(255,180,171,0.06)] rounded-sm px-3 py-3 text-left">
      <p className="text-danger-fg text-xs font-bold">
        {title || t(`errors.${kind}Title`)}
      </p>

      {body && <p className="text-fg-muted text-xs">{body}</p>}

      {kind === NOT_APPROVED && user && (
        <p
          className="text-fg-muted text-[11px] break-all"
          style={MONO}
          title={user.uid}
        >
          {user.uid}
        </p>
      )}

      {kind === GENERIC && error?.message && (
        <p className="text-fg-muted text-[11px] break-all" style={MONO}>
          {String(error.message)}
        </p>
      )}
    </div>
  );
}

export default ErrorNotice;
