import fs from 'node:fs';
import path from 'node:path';

const STATUSES = ['INFO', 'WARN', 'ERROR'];

function pad(value) {
  return String(value).padStart(2, '0');
}

function dailyFileName(date) {
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  return `journal.${yyyy}-${mm}-${dd}.log`;
}

function clockTime(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * Añade una línea al journal del día: [HH:MM:SS] ESTATUS resumen
 * @param {'INFO' | 'WARN' | 'ERROR'} estatus
 * @param {string} resume
 */
export function writeJournalLine(estatus, resume) {
  if (!STATUSES.includes(estatus)) {
    throw new Error('estatus must be INFO, WARN or ERROR');
  }
  if (typeof resume !== 'string' || resume.trim() === '') {
    throw new Error('resume is required');
  }

  const now = new Date();
  const journalFile = path.join(process.cwd(), dailyFileName(now));
  if (!fs.existsSync(journalFile)) {
    fs.writeFileSync(journalFile, '', { encoding: 'utf8' });
  }
  fs.appendFileSync(journalFile, `[${clockTime(now)}] ${estatus} ${resume.trim()}\n`, {
    encoding: 'utf8',
  });
}

const isMain = process.argv[1]?.endsWith('write-journal.line.mjs');
if (isMain) {
  const estatus = process.argv[2];
  const resume = process.argv.slice(3).join(' ');
  if (!estatus || !resume) {
    console.error('usage: node write-journal.line.mjs <INFO|WARN|ERROR> <resume>');
    process.exit(1);
  }
  writeJournalLine(estatus, resume);
}
