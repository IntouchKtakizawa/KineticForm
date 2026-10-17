import { Platform } from 'react-native';

import { Exercise } from '@/types/workout';
import { exerciseLibrary } from '@/data/exercises';

export type ParsedWorkout = { id: string; name: string; exercises: Exercise[]; selected: boolean };

function matchExercise(name: string) {
  const normalized = name.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  return exerciseLibrary.find((exercise) => exercise.name.toLowerCase().replace(/[^a-z0-9 ]/g, '') === normalized)
    ?? exerciseLibrary.find((exercise) => normalized.includes(exercise.name.toLowerCase().replace(/[^a-z0-9 ]/g, '')) || exercise.name.toLowerCase().includes(normalized));
}

export function parseWorkoutText(text: string): ParsedWorkout[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const workouts: ParsedWorkout[] = [];
  let current: ParsedWorkout = { id: `import-${Date.now()}`, name: 'Imported Workout', exercises: [], selected: true };

  for (const line of lines) {
    const setMatch = line.match(/(\d+)\s*[x×]\s*([\d–-]+)/i);
    if (setMatch) {
      const rawName = line.slice(0, setMatch.index).replace(/[—–-]+\s*$/, '').trim();
      const [, sets, reps] = setMatch;
      const weightMatch = line.match(/(\d+(?:\.\d+)?)\s*(kg|lb)\b/i);
      const restMatch = line.match(/(\d+)\s*(sec|seconds|min|minutes)\s*(?:rest)?/i);
      const found = matchExercise(rawName);
      current.exercises.push({
        id: `${found?.id ?? rawName.toLowerCase().replace(/\W+/g, '-')}-${Date.now()}-${current.exercises.length}`,
        name: found?.name ?? rawName.trim(),
        muscle: found?.primaryMuscle ?? 'Other',
        equipment: found?.equipment ?? 'Unknown',
        type: found?.type ?? 'Strength',
        movement: found?.movement ?? 'Other',
        sets: Number(sets),
        repTarget: reps.replace('-', '–'),
        suggestedWeight: Number(weightMatch?.[1] || 0),
        restSeconds: restMatch ? Number(restMatch[1]) * (restMatch[2].toLowerCase().startsWith('min') ? 60 : 1) : found?.defaultRest ?? 60,
      });
    } else if (/day|workout|push|pull|legs|upper|lower|full body/i.test(line) && line.length < 60) {
      if (current.exercises.length) workouts.push(current);
      current = { id: `import-${Date.now()}-${workouts.length}`, name: line.replace(/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s*[-—:]?\s*/i, '') || line, exercises: [], selected: true };
    }
  }
  if (current.exercises.length) workouts.push(current);
  return workouts;
}

export async function extractDocumentText(asset: { uri: string; name: string; mimeType?: string | null; file?: globalThis.File }) {
  const name = asset.name.toLowerCase();
  if (Platform.OS !== 'web' && (name.endsWith('.pdf') || name.endsWith('.docx'))) throw new Error('For PDF and DOCX on mobile, copy and paste the plan text into the importer.');
  const buffer = asset.file ? await asset.file.arrayBuffer() : await fetch(asset.uri).then((response) => response.arrayBuffer());
  if (name.endsWith('.docx') || asset.mimeType?.includes('wordprocessingml')) {
    const mammoth = await import('mammoth/mammoth.browser');
    return (await mammoth.extractRawText({ arrayBuffer: buffer })).value;
  }
  if (name.endsWith('.pdf') || asset.mimeType === 'application/pdf') {
    const worker = await import('pdfjs-dist/legacy/build/pdf.worker.mjs');
    (globalThis as typeof globalThis & { pdfjsWorker?: unknown }).pdfjsWorker = worker;
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
    const pages: string[] = [];
    for (let index = 1; index <= pdf.numPages; index += 1) {
      const page = await pdf.getPage(index);
      const content = await page.getTextContent();
      const lines: string[] = [];
      let currentLine: string[] = [];
      let previousY: number | null = null;
      for (const item of content.items) {
        if (!('str' in item) || !item.str.trim()) continue;
        const y: number | null = 'transform' in item && Array.isArray(item.transform) ? Number(item.transform[5]) : previousY;
        if (previousY !== null && y !== null && Math.abs(y - previousY) > 2 && currentLine.length) {
          lines.push(currentLine.join(' '));
          currentLine = [];
        }
        currentLine.push(item.str.trim());
        if (y !== null) previousY = y;
      }
      if (currentLine.length) lines.push(currentLine.join(' '));
      pages.push(lines.join('\n'));
    }
    return pages.join('\n');
  }
  return new TextDecoder().decode(buffer);
}
