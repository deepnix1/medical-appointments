'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AvailabilityRule, AvailabilityException } from '@/types/firestore';
import { createAvailabilityRule, createAvailabilityException } from '@/lib/firestore';

interface WeeklyScheduleProps {
  doctorId: string;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

export function WeeklySchedule({ doctorId }: WeeklyScheduleProps) {
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(1); // Monday
  const [selectedStartTime, setSelectedStartTime] = useState<string>('09:00');
  const [selectedEndTime, setSelectedEndTime] = useState<string>('17:00');

  useEffect(() => {
    // Subscribe to availability rules
    const rulesQuery = query(
      collection(db, 'availability_rules'),
      where('doctor_id', '==', doctorId)
    );

    const unsubscribeRules = onSnapshot(rulesQuery, (snapshot) => {
      const rulesList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AvailabilityRule[];
      setRules(rulesList);
    });

    // Subscribe to availability exceptions
    const exceptionsQuery = query(
      collection(db, 'availability_exceptions'),
      where('doctor_id', '==', doctorId)
    );

    const unsubscribeExceptions = onSnapshot(exceptionsQuery, (snapshot) => {
      const exceptionsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AvailabilityException[];
      setExceptions(exceptionsList);
    });

    return () => {
      unsubscribeRules();
      unsubscribeExceptions();
    };
  }, [doctorId]);

  const handleAddWeeklyRule = async () => {
    try {
      await createAvailabilityRule({
        doctor_id: doctorId,
        recurrence_type: 'weekly',
        day_of_week: selectedDay,
        start_time: selectedStartTime,
        end_time: selectedEndTime,
      });
    } catch (error) {
      console.error('Error adding weekly rule:', error);
    }
  };

  const isTimeSlotAvailable = (day: number, time: string) => {
    // Check if there's a weekly rule for this time slot
    return rules.some(
      (rule) =>
        rule.recurrence_type === 'weekly' &&
        rule.day_of_week === day &&
        rule.start_time <= time &&
        rule.end_time > time
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow sm:rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900">Add Weekly Availability</h3>
        <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-2">
            <label htmlFor="day" className="block text-sm font-medium text-gray-700">
              Day
            </label>
            <select
              id="day"
              value={selectedDay}
              onChange={(e) => setSelectedDay(Number(e.target.value))}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              {DAYS_OF_WEEK.map((day, index) => (
                <option key={day} value={index}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">
              Start Time
            </label>
            <select
              id="start_time"
              value={selectedStartTime}
              onChange={(e) => setSelectedStartTime(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              {TIME_SLOTS.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="end_time" className="block text-sm font-medium text-gray-700">
              End Time
            </label>
            <select
              id="end_time"
              value={selectedEndTime}
              onChange={(e) => setSelectedEndTime(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              {TIME_SLOTS.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={handleAddWeeklyRule}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Weekly Rule
          </button>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="grid grid-cols-8 gap-px bg-gray-200">
          <div className="bg-gray-50 p-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
            Hour
          </div>
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="bg-gray-50 p-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-8 gap-px bg-gray-200">
          {TIME_SLOTS.map((time) => (
            <>
              <div
                key={`time-${time}`}
                className="bg-white p-3 text-center text-xs text-gray-500"
              >
                {time}
              </div>
              {DAYS_OF_WEEK.map((_, dayIndex) => (
                <div
                  key={`slot-${dayIndex}-${time}`}
                  className={`bg-white p-3 ${
                    isTimeSlotAvailable(dayIndex, time)
                      ? 'bg-green-50'
                      : ''
                  }`}
                />
              ))}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
