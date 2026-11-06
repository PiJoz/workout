// Trening -> plik .fit (format Garmina) jako aktywność "Trening siłowy" z seriami,
// do ręcznego importu w Garmin Connect (connect.garmin.com -> Importuj dane).
//
// Numery wiadomości, pól i ćwiczeń: profil FIT (sprawdzone w fitdecode/profile.py).
// Aplikacja nie zapisuje godzin, więc przebieg w czasie jest umowny: start o START_HOUR,
// seria = 5 s + 3 s na powtórzenie (albo jej czas), przerwa 90 s, między ćwiczeniami 120 s.

import { baseName } from './data.js';

const FIT_EPOCH = Date.UTC(1989, 11, 31) / 1000; // sekundy od 31.12.1989 00:00 UTC
const START_HOUR = 18;
const REST_S = 90;
const EXERCISE_GAP_S = 120;

// "kategoria|nazwa" (nazwa bez dopisku typu, jak w baseName) -> [kategoria, podtyp, podtyp serii bez ciężaru]
// z katalogu Garmina (exercise_category, *_exercise_name w profilu FIT). Klucz to nazwa, nie id, bo id
// własnych ćwiczeń mają losowy dopisek. Podtyp null = tylko kategoria (Garmin nie ma odpowiednika).
// Ćwiczenie spoza mapy idzie jako "nieznane" - z biblioteki tylko prostowanie nóg na maszynie (Garmin go nie ma).
export const GARMIN_EXERCISES = {
  'abs|Brzuszki': [6, 83], // crunch / crunch
  'abs|Spięcia brzucha na maszynie': [6, null], // crunch (maszyny Garmin nie ma)
  'abs|Spięcia brzucha na wyciągu': [6, 28], // crunch / kneeling_cable_crunch
  'abs|Plank': [19, 117, 43], // plank / weighted_plank, plank
  'abs|Plank boczny': [19, 66], // plank / side_plank
  'abs|Unoszenie nóg w zwisie': [16, 2, 1], // leg_raise / weighted_hanging_leg_raise, hanging_leg_raise
  'abs|Unoszenie nóg leżąc': [16, 9, 8], // leg_raise / (weighted_)lying_straight_leg_raise
  'abs|Russian twist': [5, 46], // core / russian_twist
  'abs|Kółko do ćwiczeń brzucha (ab wheel)': [5, 19, 18], // core / (weighted_)kneeling_ab_wheel
  'abs|Nożyce': [6, 14, 13], // crunch / (weighted_)flutter_kicks
  'abs|Mountain climbers': [19, 35, 34], // plank / (weighted_)mountain_climber
  'abs|Rowerek': [6, 78, 0], // crunch / (weighted_)bicycle_crunch
  'abs|Dragon flag': [5, null], // core
  'abs|Unoszenie kolan w zwisie': [16, 19, 0], // leg_raise / (weighted_)hanging_knee_raise
  'abs|Brzuszki na ławce skośnej': [6, 79, 83], // crunch / weighted_crunch, crunch
  'abs|Brzuszki z kettlebell': [6, 79, 83], // crunch / weighted_crunch, crunch
  'abs|Nogi do drążka (toes to bar)': [6, 82, 81], // crunch / (weighted_)toes_to_bar

  'plecy|Martwy ciąg': [8, 0], // deadlift / barbell_deadlift
  'plecy|Podciąganie nachwytem': [21, 24, 38], // pull_up / weighted_pull_up, pull_up
  'plecy|Podciąganie podchwytem': [21, 41, 39], // pull_up / weighted_chin_up, chin_up
  'plecy|Podciąganie z obciążeniem': [21, 24, 38],
  'plecy|Wiosłowanie sztangą w opadzie': [23, 46], // row / bent_over_row_with_barbell
  'plecy|Wiosłowanie hantlem': [23, 2], // row / dumbbell_row
  'plecy|Ściąganie drążka wyciągu górnego': [21, 13], // pull_up / lat_pulldown
  'plecy|Wiosłowanie na wyciągu dolnym': [23, 18], // row / seated_cable_row
  'plecy|Wiosłowanie T-sztangą': [23, 28], // row / t_bar_row
  'plecy|Hiperekstensje': [13, null], // hyperextension
  'plecy|Pullover na wyciągu': [21, 19], // pull_up / standing_cable_pullover
  'plecy|Podciąganie chwytem neutralnym': [21, 45, 43], // pull_up / (weighted_)neutral_grip_pull_up
  'plecy|Wiosłowanie Pendlaya': [23, 45], // row / barbell_row
  'plecy|Wiosłowanie na maszynie': [23, null], // row
  'plecy|Martwy ciąg z podwyższenia (rack pull)': [8, 7], // deadlift / rack_pull
  'plecy|Skłony ze sztangą na karku (good morning)': [15, 2], // leg_curl / good_morning

  'biceps|Uginanie ramion ze sztangą': [7, 3], // curl / barbell_biceps_curl
  'biceps|Uginanie ramion ze sztangą łamaną': [7, 38], // curl / standing_ez_bar_biceps_curl
  'biceps|Uginanie ramion z hantlami': [7, 46], // curl / dumbbell_biceps_curl
  'biceps|Uginanie młotkowe': [7, 16], // curl / dumbbell_hammer_curl
  'biceps|Uginanie na modlitewniku': [7, 19], // curl / ez_bar_preacher_curl
  'biceps|Uginanie na wyciągu': [7, 8], // curl / cable_biceps_curl
  'biceps|Uginanie koncentryczne': [7, 44], // curl / one_arm_concentration_curl
  'biceps|Uginanie na ławce skośnej': [7, 22], // curl / incline_dumbbell_biceps_curl
  'biceps|Uginanie na maszynie': [7, null], // curl
  'biceps|Uginanie na modlitewniku hantlem': [7, 26], // curl / one_arm_preacher_curl

  // Cardio w treningu siłowym: Garmin zapisuje serię z czasem, dystansu w serii nie ma.
  'cardio|Bieg': [32, 0], // run / run
  'cardio|Bieżnia': [32, 0],
  'cardio|Rower': [33, null], // bike
  'cardio|Rower stacjonarny': [41, null], // indoor_bike
  'cardio|Orbitrek': [39, null], // elliptical
  'cardio|Wioślarz': [42, null], // indoor_row
  'cardio|Pływanie': [2, null], // cardio (pływania wśród ćwiczeń Garmin nie ma)
  'cardio|Spacer': [32, 1], // run / walk
  'cardio|Skakanka': [2, 6], // cardio / jump_rope
  'cardio|Stepper / schody': [47, 0], // stair_stepper / stair_stepper
  'cardio|Burpees': [29, 1, 0], // total_body / (weighted_)burpee

  'klatka|Wyciskanie sztangi na ławce płaskiej': [0, 1], // bench_press / barbell_bench_press
  'klatka|Wyciskanie sztangi na ławce skośnej': [0, 8], // bench_press / incline_barbell_bench_press
  'klatka|Wyciskanie hantli na ławce płaskiej': [0, 6], // bench_press / dumbbell_bench_press
  'klatka|Wyciskanie hantli na ławce skośnej': [0, 9], // bench_press / incline_dumbbell_bench_press
  'klatka|Rozpiętki z hantlami': [9, 2], // flye / dumbbell_flye
  'klatka|Krzyżowanie linek wyciągu': [9, 0], // flye / cable_crossover
  'klatka|Butterfly (maszyna)': [9, null], // flye
  'klatka|Wyciskanie na maszynie': [0, null], // bench_press
  'klatka|Pompki': [22, 40, 77], // push_up / weighted_push_up, push_up
  'klatka|Pompki na poręczach (klatka)': [30, 40, 2], // triceps_extension / weighted_dip, body_weight_dip
  'klatka|Wyciskanie sztangi na ławce ujemnej': [0, null], // bench_press (ujemnej ze sztangą Garmin nie ma)
  'klatka|Rozpiętki na ławce skośnej': [9, 3], // flye / incline_dumbbell_flye
  'klatka|Wyciskanie na maszynie na ławce skośnej': [0, null],
  'klatka|Wyciskanie na maszynie na ławce ujemnej': [0, null],
  'klatka|Pompki na paraletkach': [22, 40, 77],

  'nogi|Przysiad ze sztangą': [28, 6], // squat / barbell_back_squat
  'nogi|Przysiad przedni': [28, 8], // squat / barbell_front_squat
  'nogi|Przysiad bułgarski': [17, 18, 39], // lunge / dumbbell_bulgarian_split_squat, overhead_bulgarian_split_squat
  'nogi|Wypychanie na suwnicy': [28, 0], // squat / leg_press
  'nogi|Wykroki': [17, 33, 32], // lunge / weighted_lunge, lunge
  'nogi|Martwy ciąg rumuński': [8, 23], // deadlift / romanian_deadlift
  'nogi|Uginanie nóg na maszynie': [15, 0], // leg_curl / leg_curl
  'nogi|Hip thrust': [10, 1], // hip_raise / barbell_hip_thrust_with_bench
  'nogi|Wspięcia na palce': [1, 19, 18], // calf_raise / (weighted_)standing_calf_raise
  'nogi|Przysiad bez obciążenia': [28, 62, 100], // squat / weighted_squat, air_squat
  'nogi|Krzesełko przy ścianie': [28, null], // squat
  'nogi|Spacer farmera': [3, 1], // carry / farmers_walk
  'nogi|Wspięcia na palce w opadzie (donkey)': [1, 5, 4], // calf_raise / (weighted_)donkey_calf_raise
  'nogi|Mostek biodrowy ze sztangą': [10, 0], // hip_raise / barbell_hip_thrust_on_floor
  'nogi|Glute-ham raise': [15, null], // leg_curl
  'nogi|Martwy ciąg sumo': [8, 15], // deadlift / sumo_deadlift
  'nogi|Martwy ciąg na prostych nogach': [8, 25], // deadlift / straight_leg_deadlift
  'nogi|Wejścia na skrzynię ze sztangą': [28, 17], // squat / barbell_step_up
  'nogi|Uginanie nóg leżąc (maszyna)': [15, 0],
  'nogi|Uginanie nóg siedząc (maszyna)': [15, 0],
  'nogi|Uginanie nóg stojąc': [15, 0],
  'nogi|Wspięcia na palce siedząc (maszyna)': [1, 6], // calf_raise / seated_calf_raise
  'nogi|Wspięcia na palce stojąc (maszyna)': [1, 18], // calf_raise / standing_calf_raise
  'nogi|Wspięcia na palce ze sztangą': [1, 17], // calf_raise / standing_barbell_calf_raise

  'ramiona|Wyciskanie żołnierskie': [24, 14], // shoulder_press / overhead_barbell_press
  'ramiona|Wyciskanie hantli nad głowę': [24, 24], // shoulder_press / dumbbell_shoulder_press
  'ramiona|Arnoldki': [24, 1], // shoulder_press / arnold_press
  'ramiona|Wznosy hantli bokiem': [14, 34], // lateral_raise / dumbbell_lateral_raise
  'ramiona|Wznosy hantli przodem': [24, 28], // shoulder_press / dumbbell_front_raise
  'ramiona|Odwrotne rozpiętki': [14, 3], // lateral_raise / bent_over_lateral_raise
  'ramiona|Face pull': [23, 5], // row / face_pull
  'ramiona|Szrugsy': [26, 1], // shrug / barbell_shrug
  'ramiona|Podciąganie sztangi wzdłuż tułowia': [26, 2], // shrug / barbell_upright_row
  'ramiona|Wyciskanie na maszynie barkowej': [24, null], // shoulder_press
  'ramiona|Wyciskanie z podrzutem (push press)': [24, 3], // shoulder_press / barbell_push_press
  'ramiona|Wyciskanie sztangi zza karku': [24, 4], // shoulder_press / barbell_shoulder_press
  'ramiona|Wznosy hantli bokiem siedząc': [14, 24], // lateral_raise / seated_lateral_raise
  'ramiona|Wznosy bokiem na maszynie': [14, null], // lateral_raise
  'ramiona|Odwrotne rozpiętki na maszynie': [9, null], // flye
  'ramiona|Wyciskanie hantla jednorącz stojąc': [24, 18], // shoulder_press / single_arm_dumbbell_shoulder_press
  'ramiona|Wyciskanie kłody (log press)': [24, null], // shoulder_press
  'ramiona|Wyciskanie nad głowę na maszynie Smitha': [24, 20], // shoulder_press / smith_machine_overhead_press
  'ramiona|Szrugsy na maszynie': [26, null], // shrug
  'ramiona|Wznosy Y (Y raise)': [25, 21, 20], // shoulder_stability / (weighted_)incline_y_raise

  'triceps|Wyciskanie francuskie': [30, 13], // triceps_extension / lying_ez_bar_triceps_extension
  'triceps|Prostowanie ramion na wyciągu': [30, 39], // triceps_extension / triceps_pressdown
  'triceps|Prostowanie ramion zza głowy': [30, 15], // triceps_extension / overhead_dumbbell_triceps_extension
  'triceps|Wyciskanie sztangi wąskim chwytem': [0, 4], // bench_press / close_grip_barbell_bench_press
  'triceps|Prostowanie ramienia w opadzie (kickback)': [30, 6], // triceps_extension / dumbbell_kickback
  'triceps|Pompki na poręczach (triceps)': [30, 40, 2], // triceps_extension / weighted_dip, body_weight_dip
  'triceps|Pompki diamentowe': [22, 16, 15], // push_up / (weighted_)diamond_push_up
  'triceps|Pompki w podporze tyłem': [30, 1, 0], // triceps_extension / (weighted_)bench_dip
  'triceps|Prostowanie ramion zza głowy na wyciągu': [30, 5], // triceps_extension / cable_overhead_triceps_extension
  'triceps|Wyciskanie francuskie sztangą łamaną': [30, 13],
  'triceps|Dipy na kółkach': [14, 18, 17], // lateral_raise / (weighted_)ring_dip - tak jest u Garmina
  'triceps|Wyciskanie wąskim chwytem na maszynie Smitha': [0, 22], // bench_press / smith_machine_bench_press
  'triceps|Dipy siedząc (maszyna)': [30, null], // triceps_extension
  'triceps|Prostowanie ramion na wyciągu (drążek V)': [30, 39], // triceps_extension / triceps_pressdown
  'triceps|Prostowanie ramion na wyciągu (lina)': [30, 19], // triceps_extension / rope_pressdown
};
const UNKNOWN = [65534, null];

export function garminExercise(ex) {
  return (ex && GARMIN_EXERCISES[`${ex.category}|${baseName(ex)}`]) || UNKNOWN;
}

// CRC-16 z dokumentacji FIT.
const CRC_TABLE = [0x0000, 0xcc01, 0xd801, 0x1400, 0xf001, 0x3c00, 0x2800, 0xe401,
  0xa001, 0x6c00, 0x7800, 0xb401, 0x5000, 0x9c01, 0x8801, 0x4400];
export function fitCrc(bytes, crc = 0) {
  for (const b of bytes) {
    let t = CRC_TABLE[crc & 0xf];
    crc = ((crc >> 4) & 0x0fff) ^ t ^ CRC_TABLE[b & 0xf];
    t = CRC_TABLE[crc & 0xf];
    crc = ((crc >> 4) & 0x0fff) ^ t ^ CRC_TABLE[(b >> 4) & 0xf];
  }
  return crc;
}

// Typy bazowe: [kod, rozmiar, wartość "brak"].
const T = { enum: [0x00, 1, 0xff], uint8: [0x02, 1, 0xff], uint16: [0x84, 2, 0xffff], uint32: [0x86, 4, 0xffffffff], uint32z: [0x8c, 4, 0] };

// Wiadomości: numer globalny + pola [numer pola, typ].
const MESSAGES = {
  file_id: [0, { type: [0, 'enum'], manufacturer: [1, 'uint16'], product: [2, 'uint16'], serial: [3, 'uint32z'], time_created: [4, 'uint32'] }],
  event: [21, { timestamp: [253, 'uint32'], event: [0, 'enum'], event_type: [1, 'enum'], event_group: [4, 'uint8'] }],
  set: [225, { timestamp: [254, 'uint32'], duration: [0, 'uint32'], repetitions: [3, 'uint16'], weight: [4, 'uint16'], set_type: [5, 'uint8'],
    start_time: [6, 'uint32'], category: [7, 'uint16'], category_subtype: [8, 'uint16'], weight_display_unit: [9, 'enum'],
    message_index: [10, 'uint16'] }],
  lap: [19, { timestamp: [253, 'uint32'], message_index: [254, 'uint16'], event: [0, 'enum'], event_type: [1, 'enum'], start_time: [2, 'uint32'],
    total_elapsed_time: [7, 'uint32'], total_timer_time: [8, 'uint32'], sport: [25, 'enum'], sub_sport: [39, 'enum'] }],
  session: [18, { timestamp: [253, 'uint32'], message_index: [254, 'uint16'], event: [0, 'enum'], event_type: [1, 'enum'], start_time: [2, 'uint32'],
    sport: [5, 'enum'], sub_sport: [6, 'enum'], total_elapsed_time: [7, 'uint32'], total_timer_time: [8, 'uint32'],
    first_lap_index: [25, 'uint16'], num_laps: [26, 'uint16'], trigger: [28, 'enum'] }],
  activity: [34, { timestamp: [253, 'uint32'], total_timer_time: [0, 'uint32'], num_sessions: [1, 'uint16'], type: [2, 'enum'],
    event: [3, 'enum'], event_type: [4, 'enum'], local_timestamp: [5, 'uint32'] }],
};

class Writer {
  constructor() {
    this.bytes = [];
    this.local = new Map(); // nazwa wiadomości -> lokalny numer definicji
  }

  u(v, size) {
    for (let i = 0; i < size; i++) this.bytes.push((v / 2 ** (8 * i)) & 0xff); // little-endian, bez bitowych 32-bit pułapek
  }

  // Każda wiadomość ma własną definicję (lokalne numery 0..15) - wszystkie pola zawsze.
  write(name, values) {
    const [global, fields] = MESSAGES[name];
    const names = Object.keys(fields);
    if (!this.local.has(name)) {
      const n = this.local.size;
      this.local.set(name, n);
      this.bytes.push(0x40 | n, 0, 0);
      this.u(global, 2);
      this.bytes.push(names.length);
      for (const f of names) {
        const [num, type] = fields[f];
        this.bytes.push(num, T[type][1], T[type][0]);
      }
    }
    this.bytes.push(this.local.get(name));
    for (const f of names) {
      const [, type] = fields[f];
      const [, size, invalid] = T[type];
      const v = values[f];
      this.u(v === undefined || v === null ? invalid : Math.round(v), size);
    }
  }

  file() {
    const data = this.bytes;
    const header = [14, 0x20];
    const h = { push: (...b) => header.push(...b) };
    const u = (v, s) => { for (let i = 0; i < s; i++) h.push((v / 2 ** (8 * i)) & 0xff); };
    u(2132, 2); // wersja profilu 21.32
    u(data.length, 4);
    h.push(...[...'.FIT'].map((c) => c.charCodeAt(0)));
    u(fitCrc(header), 2);
    const all = [...header, ...data];
    const crc = fitCrc(all);
    return new Uint8Array([...all, crc & 0xff, crc >> 8]);
  }
}

// entries: [{ exerciseId, sets }] jednego dnia, w kolejności z aplikacji; date: "RRRR-MM-DD";
// exerciseOf: id -> ćwiczenie ({ category, name, type }), np. store.getExercise;
// weightUnit: w czym Garmin ma pokazywać ciężar (w pliku zawsze kg).
export function workoutToFit(date, entries, exerciseOf, { weightUnit = 'kg' } = {}) {
  const [y, m, d] = date.split('-').map(Number);
  const startDate = new Date(y, m - 1, d, START_HOUR, 0, 0);
  const start = Math.round(startDate.getTime() / 1000) - FIT_EPOCH;
  const tz = -startDate.getTimezoneOffset() * 60;
  const w = new Writer();
  w.write('file_id', { type: 4, manufacturer: 255, product: 1, serial: 2026, time_created: start });
  w.write('event', { timestamp: start, event: 0, event_type: 0, event_group: 0 });

  let t = start;
  let index = 0;
  entries.forEach((e, ei) => {
    const [category, subtype, unweighted = subtype] = garminExercise(exerciseOf(e.exerciseId));
    e.sets.forEach((s, si) => {
      const dur = s.time || 5 + 3 * (s.reps || 8);
      w.write('set', {
        timestamp: t + dur, start_time: t, duration: dur * 1000, set_type: 1,
        repetitions: s.reps ?? null, weight: s.weight ? s.weight * 16 : null, weight_display_unit: weightUnit === 'lb' ? 2 : 1,
        category, category_subtype: s.weight ? subtype : unweighted, message_index: index++,
      });
      t += dur;
      const rest = si < e.sets.length - 1 ? REST_S : ei < entries.length - 1 ? EXERCISE_GAP_S : 0;
      if (rest) {
        w.write('set', { timestamp: t + rest, start_time: t, duration: rest * 1000, set_type: 0, message_index: index++ });
        t += rest;
      }
    });
  });

  const total = (t - start) * 1000;
  w.write('event', { timestamp: t, event: 0, event_type: 4, event_group: 0 });
  w.write('lap', { timestamp: t, message_index: 0, event: 9, event_type: 1, start_time: start,
    total_elapsed_time: total, total_timer_time: total, sport: 10, sub_sport: 20 });
  w.write('session', { timestamp: t, message_index: 0, event: 8, event_type: 1, start_time: start, sport: 10, sub_sport: 20,
    total_elapsed_time: total, total_timer_time: total, first_lap_index: 0, num_laps: 1, trigger: 0 });
  w.write('activity', { timestamp: t, total_timer_time: total, num_sessions: 1, type: 0, event: 26, event_type: 1, local_timestamp: t + tz });
  return w.file();
}
