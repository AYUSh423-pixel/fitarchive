'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3, Download, Dumbbell, Flame } from 'lucide-react';
import type { BodyMeasurement, WorkoutLog } from '@/types/nutrifit';

export default function AnalyticsPage() {
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [foodCounts, setFoodCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch('/api/progress', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        setMeasurements(d.measurements || []);
        setWorkoutLogs(d.workoutLogs || []);
        setFoodCounts(d.foodLogsCountByDate || {});
      });
  }, []);

  const consistencyChart = Object.entries(foodCounts)
    .slice(-7)
    .map(([date, count]) => ({
      date: date.slice(5),
      mealsLogged: count,
    }));

  const bodyCompChart = [...measurements]
    .reverse()
    .map((m) => ({
      date: m.measuredDate.slice(5),
      bodyFat: m.bodyFatPct ?? 0,
      muscle: m.skeletalMuscleMassKg ?? 0,
    }));

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="tactile-card-white p-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#944A00]" /> Analytics &amp; Reports
          </h2>
          <p className="text-xs text-[#554337]">
            Real-time trends from your logged meals, workouts &amp; body scans
          </p>
        </div>
        <a
          href="/api/account"
          className="px-4 py-2 rounded-full bg-[#1B1B1E] text-white text-xs font-semibold flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" /> Export Report
        </a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="tactile-card-white p-4">
          <p className="text-[11px] font-bold uppercase text-[#554337] flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-[#FB923C]" /> Days Logged
          </p>
          <p className="font-display text-2xl font-bold mt-1">{Object.keys(foodCounts).length}</p>
        </div>
        <div className="tactile-card-white p-4">
          <p className="text-[11px] font-bold uppercase text-[#554337] flex items-center gap-1">
            <Dumbbell className="w-3.5 h-3.5 text-[#006C4B]" /> Workouts Logged
          </p>
          <p className="font-display text-2xl font-bold mt-1">{workoutLogs.length}</p>
        </div>
        <div className="tactile-card-white p-4 col-span-2 sm:col-span-1">
          <p className="text-[11px] font-bold uppercase text-[#554337]">Body Check-ins</p>
          <p className="font-display text-2xl font-bold mt-1">{measurements.length}</p>
        </div>
      </div>

      <section className="tactile-card-white p-5 space-y-3">
        <h3 className="font-display font-bold text-base">Nutrition Logging Consistency</h3>
        {consistencyChart.length === 0 ? (
          <p className="text-xs text-[#554337] py-6 text-center">
            Log meals in your Food Diary to see your daily logging consistency chart!
          </p>
        ) : (
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={consistencyChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E0D8" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="mealsLogged" name="Items Logged" fill="#FB923C" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="tactile-card-white p-5 space-y-3">
        <h3 className="font-display font-bold text-base">Body Composition (Fat % vs Muscle kg)</h3>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bodyCompChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E0D8" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="bodyFat" name="Body Fat %" fill="#674BB5" radius={[8, 8, 0, 0]} />
              <Bar dataKey="muscle" name="Muscle (kg)" fill="#006C4B" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
