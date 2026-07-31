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
  return digitsOnly || raw;
};

export const findHeaderRow = (data, requiredAliases) => {
  // Official ALS reports frequently place titles and school details before
  // the actual headers, so scan the first 30 rows instead of only 10.
  const maxScan = Math.min(30, data.length);

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

export const SURNAME_ALIASES = ['surname', 'last name', 'family name', 'apelyido'];
export const GIVEN_NAME_ALIASES = ['given name', 'first name', 'name', 'student name', 'learner name', 'pangalan'];
export const MIDDLE_INITIAL_ALIASES = ['mi', 'm i', 'm.i', 'middle initial', 'middle name'];

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

export const ADDRESS_ALIASES = ['address', 'home address', 'residential address', 'tirahan'];
export const AGE_ALIASES = ['age', 'edad'];
export const SCHOOL_NAME_ALIASES = ['name of school', 'school name', 'school', 'paaralan', 'als program'];

export const parseStudentImportRows = (data) => {
  if (!data?.length) {
    return { error: 'Excel file is empty.' };
  }

  const headerRowIndex = findHeaderRow(data, [NAME_ALIASES, EMAIL_ALIASES, LRN_ALIASES, ADDRESS_ALIASES, AGE_ALIASES, SCHOOL_NAME_ALIASES]);
  const header = data[headerRowIndex] || [];

  const nameIdx = findColumnIndex(header, NAME_ALIASES);
  const surnameIdx = findColumnIndex(header, SURNAME_ALIASES);
  const givenNameIdx = findColumnIndex(header, GIVEN_NAME_ALIASES);
  const middleInitialIdx = findColumnIndex(header, MIDDLE_INITIAL_ALIASES);
  const emailIdx = findColumnIndex(header, EMAIL_ALIASES);
  const lrnIdx = findColumnIndex(header, LRN_ALIASES);
  const addressIdx = findColumnIndex(header, ADDRESS_ALIASES);
  const ageIdx = findColumnIndex(header, AGE_ALIASES);
  const schoolNameIdx = findColumnIndex(header, SCHOOL_NAME_ALIASES);

  if (nameIdx === -1 || emailIdx === -1 || lrnIdx === -1 || addressIdx === -1 || ageIdx === -1 || schoolNameIdx === -1) {
    return {
      error: 'Excel must have Name, Email, LRN, Address, Age, and Name of School columns. Column order does not matter.',
    };
  }

  const rows = data
    .slice(headerRowIndex + 1)
    .map((row) => {
      const surname = getCellString(row, surnameIdx);
      const givenName = getCellString(row, givenNameIdx);
      const middleInitial = getCellString(row, middleInitialIdx);
      // Supports both a single Full Name column and separate Surname, Name,
      // and M.I. columns. A period is added to a one-letter middle initial.
      const hasSeparateNameColumns = surnameIdx !== -1 && givenNameIdx !== -1 && surnameIdx !== givenNameIdx;
      const separatedName = [surname, givenName, middleInitial && middleInitial.length === 1 ? `${middleInitial}.` : middleInitial]
        .filter(Boolean)
        .join(' ');
      return {
      // "Surname,Name ,M.I." is a single report column and should be kept as
      // is; join values only when Surname and Name are separate columns.
      name: hasSeparateNameColumns ? separatedName : getCellString(row, nameIdx),
      email: getCellString(row, emailIdx).toLowerCase(),
      lrn: normalizeLrn(row[lrnIdx]),
      address: getCellString(row, addressIdx),
      age: getCellString(row, ageIdx),
      schoolName: getCellString(row, schoolNameIdx),
      };
    })
    .filter((row) => row.name && row.email && row.lrn && row.address && row.age && row.schoolName)
    // Ignore repeated report headers such as "LRN | Surname,Name,M.I. | ...".
    .filter((row) => row.lrn.toLowerCase() !== 'lrn' && row.email.toLowerCase() !== 'email');

  return { rows, nameIdx, emailIdx, lrnIdx, addressIdx, ageIdx, schoolNameIdx, headerRowIndex };
};

export const parseTeacherImportRows = (data) => {
  if (!data?.length) {
    return { error: 'Excel file is empty.' };
  }

  const headerRowIndex = findHeaderRow(data, [NAME_ALIASES, EMAIL_ALIASES, TEACHER_ID_ALIASES, ADDRESS_ALIASES, AGE_ALIASES]);
  const header = data[headerRowIndex] || [];

  const nameIdx = findColumnIndex(header, NAME_ALIASES);
  const emailIdx = findColumnIndex(header, EMAIL_ALIASES);
  const teacherIdIdx = findColumnIndex(header, TEACHER_ID_ALIASES);
  const addressIdx = findColumnIndex(header, ADDRESS_ALIASES);
  const ageIdx = findColumnIndex(header, AGE_ALIASES);

  if (nameIdx === -1 || emailIdx === -1 || teacherIdIdx === -1 || addressIdx === -1 || ageIdx === -1) {
    return {
      error: 'Excel must have Name, Email, TeacherID (or ID), Address, and Age columns. Column order does not matter.',
    };
  }

  const rows = data
    .slice(headerRowIndex + 1)
    .map((row) => ({
      name: getCellString(row, nameIdx),
      email: getCellString(row, emailIdx).toLowerCase(),
      teacherId: getCellString(row, teacherIdIdx),
      address: getCellString(row, addressIdx),
      age: getCellString(row, ageIdx),
    }))
    .filter((row) => row.name && row.email && row.teacherId && row.address && row.age);

  return { rows, nameIdx, emailIdx, teacherIdIdx, addressIdx, ageIdx, headerRowIndex };
};
