import useAuthUser from "../hooks/useAuthUser";
import {
  GENERIC,
  NOT_APPROVED,
  describeFirebaseError,
} from "../utils/firebaseError";
import { t } from "../i18n";

const MONO = { fontFamily: "JetBrains Mono, monospace" };

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
      <p className="text-[#ffb4ab] text-xs font-bold">
        {title || t(`errors.${kind}Title`)}
      </p>

      {body && <p className="text-[#c6c6cd] text-xs">{body}</p>}

      {kind === NOT_APPROVED && user && (
        <p
          className="text-[#c6c6cd] text-[11px] break-all"
          style={MONO}
          title={user.uid}
        >
          {user.uid}
        </p>
      )}

      {kind === GENERIC && error?.message && (
        <p className="text-[#6b7280] text-[11px] break-all" style={MONO}>
          {String(error.message)}
        </p>
      )}
    </div>
  );
}

export default ErrorNotice;
