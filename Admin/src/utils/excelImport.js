const normalizeHeader = (value) => {
  if (value == null || value === '') return '';
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[.:;#*()[\]{}]/g, '')
    .replace(/\s+/g, ' ');
};

export const normalizeHeaders = (row = []) => row.map(normalizeHeader);

const matchesAlias = (header, alias) => {
  if (!header || !alias) return false;
  if (header === alias) return true;
  if (alias.length <= 3) return false;
  return header.includes(alias) || alias.includes(header);
};

export const findColumnIndex = (headers, aliases) => {
  const normalized = normalizeHeaders(headers);

  for (const alias of aliases) {
    const exactIdx = normalized.indexOf(alias);
    if (exactIdx !== -1) return exactIdx;
  }

  for (let i = 0; i < normalized.length; i++) {
    const header = normalized[i];
    if (!header) continue;
    if (aliases.some((alias) => matchesAlias(header, alias))) {
      return i;
    }
  }

  return -1;
};

export const getCellString = (row, index) => {
  if (!row || index < 0) return '';
  const value = row[index];
  if (value == null || value === '') return '';

  if (typeof value === 'number') {
    if (Number.isInteger(value)) return String(value);
    return String(Math.trunc(value));
  }

  return String(value).trim();
};

export const normalizeLrn = (value) => {
  if (value == null || value === '') return '';

  let raw = '';
  if (typeof value === 'number') {
    raw = Number.isInteger(value) ? String(value) : String(Math.trunc(value));
  } else {
    raw = String(value).trim();
  }

  if (!raw) return '';
  const digitsOnly = raw.replace(/\D/g, '');
  return (digitsOnly || raw).replace(/^0+/, '') || '0';
};

export const findHeaderRow = (data, requiredAliases) => {
  const maxScan = Math.min(10, data.length);

  for (let rowIndex = 0; rowIndex < maxScan; rowIndex++) {
    const row = data[rowIndex];
    if (!Array.isArray(row)) continue;

    const hasAllColumns = requiredAliases.every((aliases) =>
      findColumnIndex(row, aliases) !== -1
    );

    if (hasAllColumns) return rowIndex;
  }

  return 0;
};

export const NAME_ALIASES = [
  'name',
  'full name',
  'student name',
  'learner name',
  'complete name',
  'pangalan',
];

export const EMAIL_ALIASES = [
  'email',
  'email address',
  'e-mail',
  'e mail',
];

export const LRN_ALIASES = [
  'lrn',
  'lrn no',
  'lrn number',
  'learner reference number',
  'learner reference no',
  'learner ref no',
  'learner reference',
];

export const TEACHER_ID_ALIASES = [
  'teacherid',
  'teacher id',
  'teacher id no',
  'teacher number',
  'id',
];

export const parseStudentImportRows = (data) => {
  if (!data?.length) {
    return { error: 'Excel file is empty.' };
  }

  const headerRowIndex = findHeaderRow(data, [NAME_ALIASES, EMAIL_ALIASES, LRN_ALIASES]);
  const header = data[headerRowIndex] || [];

  const nameIdx = findColumnIndex(header, NAME_ALIASES);
  const emailIdx = findColumnIndex(header, EMAIL_ALIASES);
  const lrnIdx = findColumnIndex(header, LRN_ALIASES);

  if (nameIdx === -1 || emailIdx === -1 || lrnIdx === -1) {
    return {
      error: 'Excel must have Name, Email, and LRN columns. Column order does not matter.',
    };
  }

  const rows = data
    .slice(headerRowIndex + 1)
    .map((row) => ({
      name: getCellString(row, nameIdx),
      email: getCellString(row, emailIdx).toLowerCase(),
      lrn: normalizeLrn(row[lrnIdx]),
    }))
    .filter((row) => row.name && row.email && row.lrn);

  return { rows, nameIdx, emailIdx, lrnIdx, headerRowIndex };
};

export const parseTeacherImportRows = (data) => {
  if (!data?.length) {
    return { error: 'Excel file is empty.' };
  }

  const headerRowIndex = findHeaderRow(data, [NAME_ALIASES, EMAIL_ALIASES, TEACHER_ID_ALIASES]);
  const header = data[headerRowIndex] || [];

  const nameIdx = findColumnIndex(header, NAME_ALIASES);
  const emailIdx = findColumnIndex(header, EMAIL_ALIASES);
  const teacherIdIdx = findColumnIndex(header, TEACHER_ID_ALIASES);

  if (nameIdx === -1 || emailIdx === -1 || teacherIdIdx === -1) {
    return {
      error: 'Excel must have Name, Email, and TeacherID (or ID) columns. Column order does not matter.',
    };
  }

  const rows = data
    .slice(headerRowIndex + 1)
    .map((row) => ({
      name: getCellString(row, nameIdx),
      email: getCellString(row, emailIdx).toLowerCase(),
      teacherId: getCellString(row, teacherIdIdx),
    }))
    .filter((row) => row.name && row.email && row.teacherId);

  return { rows, nameIdx, emailIdx, teacherIdIdx, headerRowIndex };
};
