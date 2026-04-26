import type { AdminUser } from "../types";
import { badgeClass, buttonDanger, buttonMuted, buttonPrimary, inputClass, panelClass } from "./ui";
import { cx } from "./utils";

type CardsPanelProps = {
  admin: AdminUser | null;
  authChecking: boolean;
  cardSubmitting: boolean;
  cards: string[];
  editingCardNum: string | null;
  editingValue: string;
  newCardNum: string;
  onAddCard: () => void;
  onDeleteCard: (cardNum: string) => void;
  onEditCard: (cardNum: string) => void;
  onNewCardNumChange: (value: string) => void;
  onSaveEdit: (cardNum: string) => void;
  onCancelEdit: () => void;
  onEditingValueChange: (value: string) => void;
};

export function CardsPanel({
  admin,
  authChecking,
  cardSubmitting,
  cards,
  editingCardNum,
  editingValue,
  newCardNum,
  onAddCard,
  onDeleteCard,
  onEditCard,
  onNewCardNumChange,
  onSaveEdit,
  onCancelEdit,
  onEditingValueChange
}: CardsPanelProps) {
  return (
    <section className={cx(panelClass, "mt-6 animate-fade-up")}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">Allowed RFID Cards</h2>
          <p className="mt-1 text-xs text-slate-400">Manage access cards for the door controller.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <span className={badgeClass}>{cards.length} cards</span>
          {authChecking ? <span className={badgeClass}>Checking admin...</span> : null}
          {admin ? (
            <span className={cx(badgeClass, "border-emerald-400/30 bg-emerald-400/10 text-emerald-100")}>
              Admin: {admin.username}
            </span>
          ) : (
            <span className={cx(badgeClass, "border-amber-300/30 bg-amber-300/10 text-amber-50")}>
              Admin locked
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={newCardNum}
          onChange={(event) => onNewCardNumChange(event.target.value)}
          placeholder="Enter card number"
          className={inputClass}
          disabled={!admin || cardSubmitting}
        />
        <button onClick={onAddCard} disabled={cardSubmitting} className={buttonPrimary}>
          Add Card
        </button>
      </div>
      {!admin && (
        <p className="mt-2 text-xs text-slate-400">
          Login is required to add, edit, or delete cards.
        </p>
      )}

      <div className="mt-5">
        <ul className="space-y-2">
          {cards.length ? (
            cards.map((card) => {
              const isEditing = editingCardNum === card;
              return (
                <li
                  key={card}
                  className="flex flex-col gap-3 rounded-2xl border border-neutral-700/70 bg-neutral-800/70 px-4 py-3 transition hover:bg-neutral-700/70 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-400">Card</div>
                    {isEditing ? (
                      <input
                        value={editingValue}
                        onChange={(event) => onEditingValueChange(event.target.value)}
                        className={cx(inputClass, "mt-2 w-full")}
                        disabled={!admin || cardSubmitting}
                      />
                    ) : (
                      <div className="mt-1 break-all text-sm font-semibold tracking-wide text-slate-100">{card}</div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {isEditing ? (
                      <>
                        <button onClick={() => onSaveEdit(card)} disabled={cardSubmitting} className={buttonPrimary}>
                          Save
                        </button>
                        <button onClick={onCancelEdit} disabled={cardSubmitting} className={buttonMuted}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => onEditCard(card)} disabled={cardSubmitting} className={buttonMuted}>
                          Edit
                        </button>
                        <button onClick={() => onDeleteCard(card)} disabled={cardSubmitting} className={buttonDanger}>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })
          ) : (
            <li className="rounded-2xl border border-neutral-700/70 bg-neutral-800/70 px-4 py-3 text-sm text-slate-300">
              No cards available.
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
