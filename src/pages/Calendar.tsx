import { useMemo, useState, type FormEvent } from 'react';
import { useAppData } from '../hooks/useAppData';
import Modal from '../components/Modal';
import { addDays, toISODate, todayISO, formatDateFr } from '../utils/date';
import { ACTIVITY_LABELS, ACTIVITY_COLORS } from '../utils/activityLabels';
import type { ScheduledSession, TypeActivite } from '../types';

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const START_HOUR = 6;
const END_HOUR = 23;
const SLOT_HEIGHT = 48; // px par heure

function mondayOf(isoDate: string): string {
  const date = new Date(isoDate + 'T00:00:00');
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diffToMonday);
  return toISODate(date);
}

function weekDays(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

interface FormState {
  date: string;
  heureDebut: string;
  heureFin: string;
  typeActivite: TypeActivite;
  titre: string;
  notes: string;
}

function emptyForm(date: string): FormState {
  return {
    date,
    heureDebut: '18:00',
    heureFin: '19:00',
    typeActivite: 'musculation',
    titre: '',
    notes: '',
  };
}

export default function Calendar() {
  const { scheduledSessions, addScheduledSession, updateScheduledSession, deleteScheduledSession } =
    useAppData();
  const [weekStart, setWeekStart] = useState(() => mondayOf(todayISO()));
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm(todayISO()));
  const [isMobileListView, setIsMobileListView] = useState(false);

  const days = useMemo(() => weekDays(weekStart), [weekStart]);
  const hours = useMemo(
    () => Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i),
    []
  );

  function sessionsForDay(date: string): ScheduledSession[] {
    return scheduledSessions
      .filter((s) => s.date === date)
      .sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));
  }

  function openCreateModal(date: string, hour?: number) {
    setEditingId(null);
    const heureDebut = hour !== undefined ? `${hour.toString().padStart(2, '0')}:00` : '18:00';
    const heureFin = hour !== undefined ? `${(hour + 1).toString().padStart(2, '0')}:00` : '19:00';
    setForm({ ...emptyForm(date), heureDebut, heureFin });
    setModalOpen(true);
  }

  function openEditModal(session: ScheduledSession) {
    setEditingId(session.id);
    setForm({
      date: session.date,
      heureDebut: session.heureDebut,
      heureFin: session.heureFin,
      typeActivite: session.typeActivite,
      titre: session.titre ?? '',
      notes: session.notes ?? '',
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (timeToMinutes(form.heureFin) <= timeToMinutes(form.heureDebut)) {
      alert("L'heure de fin doit être après l'heure de début.");
      return;
    }
    const payload: Omit<ScheduledSession, 'id'> = {
      date: form.date,
      heureDebut: form.heureDebut,
      heureFin: form.heureFin,
      typeActivite: form.typeActivite,
      titre: form.titre.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };
    if (editingId) {
      updateScheduledSession(editingId, payload);
    } else {
      addScheduledSession(payload);
    }
    closeModal();
  }

  function handleDelete() {
    if (editingId) {
      deleteScheduledSession(editingId);
      closeModal();
    }
  }

  function goToPreviousWeek() {
    setWeekStart((prev) => addDays(prev, -7));
  }

  function goToNextWeek() {
    setWeekStart((prev) => addDays(prev, 7));
  }

  function goToToday() {
    setWeekStart(mondayOf(todayISO()));
  }

  return (
    <div>
      <div className="page-header">
        <h1>Calendrier</h1>
        <p className="text-muted">Planifiez vos séances et visualisez votre semaine.</p>
      </div>

      <div className="calendar-toolbar">
        <div className="calendar-toolbar__nav">
          <button type="button" className="btn btn-outline btn-sm" onClick={goToPreviousWeek}>
            ◀ Précédente
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={goToToday}>
            Aujourd'hui
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={goToNextWeek}>
            Suivante ▶
          </button>
        </div>
        <div className="calendar-toolbar__actions">
          <button
            type="button"
            className="btn btn-outline btn-sm calendar-view-toggle"
            onClick={() => setIsMobileListView((v) => !v)}
          >
            {isMobileListView ? 'Vue grille' : 'Vue liste'}
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => openCreateModal(todayISO())}>
            + Ajouter une séance
          </button>
        </div>
      </div>

      <p className="text-muted calendar-range">
        Semaine du {formatDateFr(days[0])} au {formatDateFr(days[6])}
      </p>

      {isMobileListView ? (
        <div className="calendar-list">
          {days.map((day) => (
            <div className="card calendar-list__day" key={day}>
              <div className="calendar-list__day-header">
                <strong>{DAY_LABELS[new Date(day + 'T00:00:00').getDay() === 0 ? 6 : new Date(day + 'T00:00:00').getDay() - 1]}</strong>
                <span className="text-muted">{formatDateFr(day)}</span>
                <button type="button" className="btn-icon" onClick={() => openCreateModal(day)} aria-label="Ajouter">
                  ＋
                </button>
              </div>
              {sessionsForDay(day).length === 0 && <p className="text-muted">Aucune séance planifiée.</p>}
              <ul>
                {sessionsForDay(day).map((session) => (
                  <li className="list-item" key={session.id} onClick={() => openEditModal(session)} style={{ cursor: 'pointer' }}>
                    <div className="list-item__main">
                      <span className="list-item__title">
                        <span
                          className="calendar-dot"
                          style={{ backgroundColor: ACTIVITY_COLORS[session.typeActivite] }}
                        />
                        {session.titre || ACTIVITY_LABELS[session.typeActivite]}
                      </span>
                      <span className="list-item__subtitle">
                        {session.heureDebut} - {session.heureFin} · {ACTIVITY_LABELS[session.typeActivite]}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="calendar-grid-wrapper">
          <div className="calendar-grid" style={{ ['--slot-height' as string]: `${SLOT_HEIGHT}px` }}>
            <div className="calendar-grid__corner" />
            {days.map((day) => (
              <div className="calendar-grid__day-header" key={day}>
                <span>{DAY_LABELS[new Date(day + 'T00:00:00').getDay() === 0 ? 6 : new Date(day + 'T00:00:00').getDay() - 1]}</span>
                <span className={`calendar-grid__day-date ${day === todayISO() ? 'is-today' : ''}`}>
                  {new Date(day + 'T00:00:00').getDate()}
                </span>
              </div>
            ))}

            <div className="calendar-grid__hours">
              {hours.map((hour) => (
                <div className="calendar-grid__hour-label" key={hour} style={{ height: SLOT_HEIGHT }}>
                  {hour}:00
                </div>
              ))}
            </div>

            {days.map((day) => (
              <div
                className="calendar-grid__day-column"
                key={day}
                style={{ height: SLOT_HEIGHT * hours.length }}
              >
                {hours.map((hour) => (
                  <div
                    className="calendar-grid__slot"
                    key={hour}
                    style={{ height: SLOT_HEIGHT }}
                    onClick={() => openCreateModal(day, hour)}
                  />
                ))}
                {sessionsForDay(day).map((session) => {
                  const startMin = timeToMinutes(session.heureDebut) - START_HOUR * 60;
                  const endMin = timeToMinutes(session.heureFin) - START_HOUR * 60;
                  const top = (startMin / 60) * SLOT_HEIGHT;
                  const height = Math.max(((endMin - startMin) / 60) * SLOT_HEIGHT, 18);
                  return (
                    <div
                      className="calendar-event"
                      key={session.id}
                      style={{
                        top,
                        height,
                        backgroundColor: ACTIVITY_COLORS[session.typeActivite],
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(session);
                      }}
                      title={`${session.titre || ACTIVITY_LABELS[session.typeActivite]} (${session.heureDebut} - ${session.heureFin})`}
                    >
                      <span className="calendar-event__title">
                        {session.titre || ACTIVITY_LABELS[session.typeActivite]}
                      </span>
                      <span className="calendar-event__time">
                        {session.heureDebut} - {session.heureFin}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {modalOpen && (
        <Modal title={editingId ? 'Modifier la séance' : 'Ajouter une séance'} onClose={closeModal}>
          <form onSubmit={handleSubmit}>
            <div className="grid grid--2">
              <div className="form-group">
                <label className="form-label" htmlFor="calDate">Date</label>
                <input
                  id="calDate"
                  className="form-input"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="calType">Type d'activité</label>
                <select
                  id="calType"
                  className="form-select"
                  value={form.typeActivite}
                  onChange={(e) => setForm((p) => ({ ...p, typeActivite: e.target.value as TypeActivite }))}
                >
                  {Object.entries(ACTIVITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="calStart">Heure de début</label>
                <input
                  id="calStart"
                  className="form-input"
                  type="time"
                  value={form.heureDebut}
                  onChange={(e) => setForm((p) => ({ ...p, heureDebut: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="calEnd">Heure de fin</label>
                <input
                  id="calEnd"
                  className="form-input"
                  type="time"
                  value={form.heureFin}
                  onChange={(e) => setForm((p) => ({ ...p, heureFin: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="calTitre">Titre (optionnel)</label>
              <input
                id="calTitre"
                className="form-input"
                type="text"
                value={form.titre}
                onChange={(e) => setForm((p) => ({ ...p, titre: e.target.value }))}
                placeholder={ACTIVITY_LABELS[form.typeActivite]}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="calNotes">Notes (optionnel)</label>
              <textarea
                id="calNotes"
                className="form-textarea"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button type="submit" className="btn btn-primary">{editingId ? 'Mettre à jour' : 'Ajouter'}</button>
              {editingId && (
                <button type="button" className="btn btn-danger" onClick={handleDelete}>
                  Supprimer
                </button>
              )}
              <button type="button" className="btn btn-outline" onClick={closeModal}>Annuler</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
