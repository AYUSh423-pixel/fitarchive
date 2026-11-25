'use client';

import React, { useEffect, useState } from 'react';
import { Award, Calendar, Check, Dumbbell, Flame, Moon, Plus } from 'lucide-react';
import type { Exercise, WorkoutLog, WorkoutRoutineDay } from '@/types/nutrifit';

const DAY_NAMES = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WorkoutsPage() {
  const [routine, setRoutine] = useState<WorkoutRoutineDay[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [prs, setPrs] = useState<Record<string, { weightKg: number; reps: number; date: string }>>({});
  const [tab, setTab] = useState<'routine' | 'log' | 'library' | 'prs'>('routine');
  const [toast, setToast] = useState('');

  // Log workout form
  const [title, setTitle] = useState('Upper Body Push');
  const [durationMin, setDurationMin] = useState(50);
  const [isRestDay, setIsRestDay] = useState(false);
  const [cardioType, setCardioType] = useState('Incline Treadmill Walk');
  const [cardioMinutes, setCardioMinutes] = useState(15);
  const [recoveryNotes, setRecoveryNotes] = useState('');
  const [loggedExercises, setLoggedExercises] = useState([
    { exerciseName: 'Incline Dumbbell Press', sets: 3, reps: 10, weightKg: 20, restSec: 90 },
    { exerciseName: 'Overhead Dumbbell Shoulder Press', sets: 3, reps: 10, weightKg: 14, restSec: 75 },
  ]);

  const loadData = async () => {
    const res = await fetch('/api/workouts', { cache: 'no-store' });
    if (res.ok) {
      const d = await res.json();
      setRoutine(d.routine || []);
      setExercises(d.exercises || []);
      setLogs(d.logs || []);
      setPrs(d.personalRecords || {});
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLoadRoutineDay = (day: WorkoutRoutineDay) => {
    setTitle(day.title);
    setIsRestDay(day.isRestDay);
    setLoggedExercises(
      day.plannedExercises.map((pe) => ({
        exerciseName: pe.exerciseName,
        sets: pe.sets,
        reps: parseInt(pe.reps, 10) || 10,
        weightKg: 15,
        restSec: pe.restSec,
      }))
    );
    setTab('log');
  };

  const handleSaveWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/workouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        durationMin,
        isRestDay,
        exercises: isRestDay ? [] : loggedExercises,
        cardioType,
        cardioMinutes,
        recoveryNotes,
      }),
    });
    if (res.ok) {
      setToast(isRestDay ? 'Logged recovery day!' : 'Workout & Personal Records updated!');
      loadData();
      setTab('routine');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Sub-navigation Pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {(
          [
            { id: 'routine', label: '4–5 Day Routine' },
            { id: 'log', label: '+ Log Session' },
            { id: 'prs', label: 'Personal Records' },
            { id: 'library', label: 'Exercise Library' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer ${
              tab === t.id ? 'bg-[#1B1B1E] text-white' : 'bg-white text-[#554337] border border-[#E4E0D8]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {toast && (
        <div className="p-3 rounded-2xl bg-[#DCFCE7] text-[#14532D] text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" /> {toast}
        </div>
      )}

      {tab === 'routine' && (
        <div className="space-y-4">
          <div className="tactile-card-white p-5">
            <h2 className="font-display text-lg font-bold">Weekly Training Split (4–5 Days + Recovery)</h2>
            <p className="text-xs text-[#554337] mt-0.5">
              Tap &ldquo;Start Session&rdquo; on any day to log sets, reps, weight lifted &amp; cardio.
            </p>
          </div>

          <div className="space-y-2.5">
            {routine.map((day) => (
              <div key={day.id} className="tactile-card-white p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-display font-bold text-xs ${
                      day.isRestDay ? 'bg-[#F3E8FF] text-[#581C87]' : 'bg-[#FFEDD5] text-[#944A00]'
                    }`}
                  >
                    {DAY_NAMES[day.dayOfWeek]}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-[#1B1B1E]">{day.title}</h3>
                    <p className="text-xs text-[#554337]">
                      {day.focus} • {day.isRestDay ? 'Recovery' : `${day.plannedExercises.length} exercises`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleLoadRoutineDay(day)}
                  className="px-3.5 py-2 rounded-full bg-[#FB923C] text-white text-xs font-semibold shrink-0 cursor-pointer"
                >
                  {day.isRestDay ? 'Log Rest' : 'Start Session'}
                </button>
              </div>
            ))}
          </div>

          {/* Weekly History */}
          <div className="space-y-2.5 pt-2">
            <h3 className="font-display font-bold text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#944A00]" /> Recent Workout History ({logs.length})
            </h3>
            {logs.length === 0 ? (
              <div className="tactile-card p-5 text-xs text-[#554337]">
                No workouts logged yet. Tap &ldquo;Start Session&rdquo; above to log your first gym workout!
              </div>
            ) : (
              logs.map((l) => (
                <div key={l.id} className="tactile-card-white p-4 flex justify-between items-center">
                  <div>
                    <p className="font-display font-bold text-sm">{l.title}</p>
                    <p className="text-xs text-[#554337]">
                      {l.workoutDate} • {l.durationMin} min •{' '}
                      {l.isRestDay ? 'Rest & Recovery' : `${l.exercises.length} exercises`}
                      {l.cardioMinutes ? ` • ${l.cardioMinutes}m cardio` : ''}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#14532D] text-[11px] font-bold">
                    Completed
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'log' && (
        <form onSubmit={handleSaveWorkout} className="tactile-card-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Log Gym or Recovery Session</h2>
            <button
              type="button"
              onClick={() => setIsRestDay((v) => !v)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 cursor-pointer ${
                isRestDay ? 'bg-[#F3E8FF] text-[#581C87]' : 'bg-[#F5F3F6] text-[#554337]'
              }`}
            >
              <Moon className="w-3.5 h-3.5" /> {isRestDay ? 'Rest Day Mode' : 'Gym Day Mode'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Session Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="tactile-input w-full px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Duration (min)</label>
              <input type="number" value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value))} className="tactile-input w-full px-3 py-2 text-sm" />
            </div>
          </div>

          {!isRestDay && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#554337]">Exercises (Sets / Reps / Weight kg)</label>
                <button
                  type="button"
                  onClick={() =>
                    setLoggedExercises((prev) => [
                      ...prev,
                      { exerciseName: exercises[0]?.name || 'Dumbbell Curl', sets: 3, reps: 10, weightKg: 10, restSec: 60 },
                    ])
                  }
                  className="text-xs font-bold text-[#944A00] flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Exercise
                </button>
              </div>
              {loggedExercises.map((ex, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-[#F5F3F6] grid grid-cols-12 gap-2 items-center">
                  <select
                    value={ex.exerciseName}
                    onChange={(e) =>
                      setLoggedExercises((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, exerciseName: e.target.value } : x))
                      )
                    }
                    className="col-span-12 sm:col-span-5 tactile-input px-2.5 py-1.5 text-xs font-semibold"
                  >
                    {exercises.map((opt) => (
                      <option key={opt.id} value={opt.name}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={ex.sets}
                    onChange={(e) =>
                      setLoggedExercises((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, sets: Number(e.target.value) } : x))
                      )
                    }
                    placeholder="Sets"
                    className="col-span-4 sm:col-span-2 tactile-input px-2 py-1.5 text-xs text-center"
                  />
                  <input
                    type="number"
                    value={ex.reps}
                    onChange={(e) =>
                      setLoggedExercises((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, reps: Number(e.target.value) } : x))
                      )
                    }
                    placeholder="Reps"
                    className="col-span-4 sm:col-span-2 tactile-input px-2 py-1.5 text-xs text-center"
                  />
                  <input
                    type="number"
                    value={ex.weightKg}
                    onChange={(e) =>
                      setLoggedExercises((prev) =>
                        prev.map((x, i) => (i === idx ? { ...x, weightKg: Number(e.target.value) } : x))
                      )
                    }
                    placeholder="kg"
                    className="col-span-4 sm:col-span-3 tactile-input px-2 py-1.5 text-xs text-center"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold block mb-1">Cardio Type</label>
              <input value={cardioType} onChange={(e) => setCardioType(e.target.value)} className="tactile-input w-full px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Cardio Minutes</label>
              <input type="number" value={cardioMinutes} onChange={(e) => setCardioMinutes(Number(e.target.value))} className="tactile-input w-full px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1">Recovery / Energy Notes</label>
            <input
              value={recoveryNotes}
              onChange={(e) => setRecoveryNotes(e.target.value)}
              placeholder="e.g. Felt strong on incline press, good sleep"
              className="tactile-input w-full px-3 py-2 text-sm"
            />
          </div>

          <button type="submit" className="w-full py-3 rounded-full bg-[#FB923C] text-white font-semibold text-sm cursor-pointer">
            Save Workout Session
          </button>
        </form>
      )}

      {tab === 'prs' && (
        <div className="tactile-card-white p-5 space-y-3">
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <Award className="w-5 h-5 text-[#944A00]" /> Personal Records (Strength Progression)
          </h2>
          {Object.keys(prs).length === 0 ? (
            <p className="text-xs text-[#554337]">Log your first gym session to start tracking Personal Records!</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(prs).map(([name, pr]) => (
                <div key={name} className="p-3 rounded-2xl bg-[#F5F3F6] flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-sm">{name}</p>
                    <p className="text-xs text-[#554337]">{pr.date}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#FFEDD5] text-[#944A00] text-xs font-bold">
                    {pr.weightKg} kg × {pr.reps} reps
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'library' && (
        <div className="space-y-2.5">
          {exercises.map((ex) => (
            <div key={ex.id} className="tactile-card-white p-4 space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-sm flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-[#944A00]" /> {ex.name}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-[#F5F3F6] text-[11px] font-bold text-[#554337]">
                  {ex.muscleGroup}
                </span>
              </div>
              <p className="text-xs text-[#554337]">{ex.instructions}</p>
              <p className="text-[11px] text-[#887365]">Equipment: {ex.equipment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
