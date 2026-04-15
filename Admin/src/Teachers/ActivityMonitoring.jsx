import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx-js-style";
import { showAlert } from '../utils/swal';
import {
  FaFile,
  FaFilePdf,
  FaFileImage,
  FaFileWord,
  FaFileArchive,
  FaDownload,
  FaChevronLeft,
  FaBookOpen,
  FaFileExport,
  FaMapMarkerAlt,
  FaClock,
  FaCalendarAlt,
  FaClipboardList,
  FaUsers,
  FaTasks,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaSearch,
  FaEye,
} from "react-icons/fa";

// Ensure API_BASE_URL ends with a slash
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/$/, '') + '/';

const getActivitySortTime = (activity) => {
  const candidate = activity?.date || activity?.createdAt || activity?.updatedAt;
  const parsed = candidate ? new Date(candidate).getTime() : 0;
  return Number.isNaN(parsed) ? 0 : parsed;
};

const sortActivitiesNewestFirst = (activities = []) =>
  [...activities].sort((a, b) => getActivitySortTime(b) - getActivitySortTime(a));

const getSubmissionSortTime = (submission) => {
  const candidate = submission?.submissionDate || submission?.submittedAt || submission?.createdAt || submission?.updatedAt;
  const parsed = candidate ? new Date(candidate).getTime() : 0;
  return Number.isNaN(parsed) ? 0 : parsed;
};

const sortSubmissionsNewestFirst = (submissions = []) =>
  [...submissions].sort((a, b) => getSubmissionSortTime(b) - getSubmissionSortTime(a));

const EXCEL_THEME = {
  primary: "1E3A8A", // Dark Blue
  secondary: "3B82F6", // Soft Blue
  title: "0F172A", // Slate 900
  subtitle: "334155", // Slate 700
  background: "F8FAFC",
  subHeaderBg: "E0F2FE",
  subHeaderText: "1F2937",
  headerBg: "0F766E",
  headerText: "111827", // Gray 900
  headerLabel: "FFFFFF",
  sectionBg: "DBEAFE", // Light Blue
  labelBg: "F1F5F9", // Very light gray
  rowAlt: "F1F5F9", // Very light gray
  rowBase: "FFFFFF",
  border: "E5E7EB", // Light gray
  scoreGood: "DCFCE7", // Green 100
  scoreWarn: "FEF3C7", // Amber 100
  scoreLow: "FEE2E2", // Red 100
  blank: "E2E8F0", // Slate 200
  statusGood: "16A34A", // Soft Green text
  statusWarn: "92400E", // Amber text
  statusLow: "991B1B", // Soft red text
  statusNone: "64748B", // Gray text
  infoSoft: "F8FAFC",
  chartBlue: "DBEAFE", // Light blue
  chartTeal: "E0F2FE", // very soft blue
  white: "FFFFFF",
  lightText: "F9FAFB",
};

const buildExcelBorder = (weight = "thin", color = EXCEL_THEME.border) => ({
  top: { style: weight, color: { rgb: color } },
  bottom: { style: weight, color: { rgb: color } },
  left: { style: weight, color: { rgb: color } },
  right: { style: weight, color: { rgb: color } },
});

const buildExcelStyle = ({
  font = {},
  fillColor,
  align = "left",
  vertical = "center",
  bold = false,
  size = 11,
  color = EXCEL_THEME.headerText,
  wrapText = false,
  border,
  numFmt,
} = {}) => {
  const style = {
    font: { name: "Calibri", sz: size, bold, color: { rgb: color }, ...font },
    alignment: { horizontal: align, vertical, wrapText },
  };

  if (border) {
    style.border = border;
  }

  if (fillColor) {
    style.fill = {
      patternType: "solid",
      fgColor: { rgb: fillColor },
    };
  }

  if (numFmt) {
    style.numFmt = numFmt;
  }

  return style;
};

const setWorksheetCellStyle = (worksheet, rowIndex, columnIndex, style) => {
  const address = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
  if (!worksheet[address]) {
    // Create cell if it doesn't exist
    XLSX.utils.sheet_add_aoa(worksheet, [[null]], { origin: address });
  }
  worksheet[address].s = style;
  if (style?.numFmt) {
    worksheet[address].z = style.numFmt;
  }
};

const parseScoreValue = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const formatStatusLabel = (average, completionRate) => {
  if (completionRate === 0) return "No Submission";
  if (average >= 85) return "On Track";
  if (average >= 70) return "Needs Review";
  return "At Risk";
};

const formatStatusDisplay = (status) => {
  if (status === "On Track") return `[OK] ${status}`;
  if (status === "Needs Review") return `[WARN] ${status}`;
  if (status === "At Risk") return `[RISK] ${status}`;
  if (status === "No Submission") return `[NONE] ${status}`;
  return status;
};

const getStatusColor = (status) => {
  if (String(status).includes("On Track")) return EXCEL_THEME.statusGood;
  if (String(status).includes("Needs Review")) return EXCEL_THEME.statusWarn;
  if (String(status).includes("No Submission")) return EXCEL_THEME.statusNone;
  return EXCEL_THEME.statusLow;
};

const applyOuterBorderToRange = (worksheet, startRow, endRow, startColumn, endColumn, color = EXCEL_THEME.border) => {
  for (let row = startRow; row <= endRow; row++) {
    for (let column = startColumn; column <= endColumn; column++) {
      const address = XLSX.utils.encode_cell({ r: row, c: column });
      const cell = worksheet[address];
      if (!cell) continue;

      const border = { ...(cell.s?.border || {}) };

      if (row === startRow) border.top = { style: "medium", color: { rgb: color } };
      if (row === endRow) border.bottom = { style: "medium", color: { rgb: color } };
      if (column === startColumn) border.left = { style: "medium", color: { rgb: color } };
      if (column === endColumn) border.right = { style: "medium", color: { rgb: color } };

      cell.s = {
        ...(cell.s || {}),
        border,
      };
    }
  }
};

const buildWorksheetColumns = (rows = [], columns = [], options = {}) =>
  columns.map((column, columnIndex) => {
    const columnLabel = String(column || "");
    const maxLength = rows.reduce((longest, row) => {
      const cellValue = row?.[columnIndex];
      return Math.max(longest, String(cellValue ?? "").length);
    }, columnLabel.length);

    const overrideWidth = options.overrides?.[columnLabel];
    if (overrideWidth) {
      return { wch: overrideWidth };
    }

    const basePadding = options.padding ?? 4;
    const minWidth = options.minWidth ?? 14;
    const maxWidth = options.maxWidth ?? 32;

    if (/email/i.test(columnLabel)) return { wch: 30 };
    if (/name/i.test(columnLabel)) return { wch: 22 };
    if (/status/i.test(columnLabel)) return { wch: 24 };
    if (/completion/i.test(columnLabel)) return { wch: 18 };
    if (/average|highest|lowest/i.test(columnLabel)) return { wch: 14 };
    if (/submitted|missing|count|students|activities/i.test(columnLabel)) return { wch: 14 };
    if (columnIndex >= 2 && columnIndex <= columns.length - 5) {
      return { wch: Math.min(Math.max(maxLength + 3, 16), 20) };
    }

    return { wch: Math.min(Math.max(maxLength + basePadding, minWidth), maxWidth) };
  });

const buildReportFilename = (className = "Class") =>
  `Activity_Report_${String(className).trim().replace(/\s+/g, "_") || "Class"}.xlsx`;

export default function ActivityMonitoring() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [classSearchTerm, setClassSearchTerm] = useState("");
  const [submissionSearchTerm, setSubmissionSearchTerm] = useState("");
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState("all");
  const reportFileHandlesRef = useRef({});

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const teacherId = user?.role === "teacher" ? user._id : null;

  useEffect(() => {
    if (!teacherId) {
      setError("Teacher not logged in");
      return;
    }
    const fetchClasses = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}class`, { params: { teacherId } });
        setClasses(res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load classes");
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [teacherId]);

  useEffect(() => {
    if (!selectedClass) return;

    const fetchActivitiesAndSubmissions = async () => {
      setLoading(true);
      setError(null);
      try {
        const activitiesRes = await axios.get(`${API_BASE_URL}activities`, {
          params: { classId: selectedClass._id },
        });
        const activitiesData = sortActivitiesNewestFirst(activitiesRes.data || []);

        const activitiesWithSubmissions = await Promise.all(
          activitiesData.map(async (activity) => {
            try {
              console.log('🔵 [FRONTEND] Fetching submissions for activity:', activity._id, activity.title);
              const submissionsRes = await axios.get(
                `${API_BASE_URL}activities/submissions/teacher/${teacherId}`,
                { params: { activityId: activity._id } }
              );
              console.log('✅ [FRONTEND] Got', submissionsRes.data.submissions?.length || 0, 'submissions for activity:', activity.title);
              const subs = sortSubmissionsNewestFirst(submissionsRes.data.submissions || []);
              return { ...activity, submissions: subs };
            } catch {
              return { ...activity, submissions: [] };
            }
          })
        );

        setActivities(sortActivitiesNewestFirst(activitiesWithSubmissions));
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load activities");
      } finally {
        setLoading(false);
      }
    };

    fetchActivitiesAndSubmissions();
  }, [selectedClass, teacherId]);

  const handleScoreChange = (activityId, submissionId, newScore) => {
    setActivities(prevActivities =>
      prevActivities.map(activity => {
        if (activity._id === activityId) {
          return {
            ...activity,
            submissions: activity.submissions.map(sub =>
              sub._id === submissionId ? { ...sub, score: newScore } : sub
            ),
          };
        }
        return activity;
      })
    );
    if (selectedActivity?._id === activityId) {
      setSelectedActivity(prev => ({
        ...prev,
        submissions: prev.submissions.map(sub => sub._id === submissionId ? { ...sub, score: newScore } : sub)
      }));
    }
  };

  const handleSubmitScore = async (submissionId, score, activityId) => {
    try {
      const scoreNumber = Number(score);
      if (isNaN(scoreNumber)) {
        await showAlert('warning', 'Invalid Score', 'Please enter a valid number');
        return;
      }
      const res = await axios.put(`${API_BASE_URL}activities/submissions/score/${submissionId}`, { score: scoreNumber });
      // Update local state to reflect "Graded" status
      const updatedStatus = res.data?.status || 'Graded';
      setActivities(prevActivities =>
        prevActivities.map(activity => {
          if (activity._id === activityId) {
            return {
              ...activity,
              submissions: activity.submissions.map(sub =>
                sub._id === submissionId ? { ...sub, score: scoreNumber, status: updatedStatus } : sub
              ),
            };
          }
          return activity;
        })
      );
      if (selectedActivity?._id === activityId) {
        setSelectedActivity(prev => ({
          ...prev,
          submissions: prev.submissions.map(sub =>
            sub._id === submissionId ? { ...sub, score: scoreNumber, status: updatedStatus } : sub
          ),
        }));
      }
      await showAlert('success', 'Score Updated', 'Score updated successfully!');
    } catch (err) {
      await showAlert('error', 'Update Failed', `Failed to update score: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDownloadFile = async (url, fileName) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed:', err);
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return <FaFile className="text-gray-400" />;
    const lower = fileName.toLowerCase();
    if (lower.endsWith(".pdf")) return <FaFilePdf className="text-red-500" />;
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png")) return <FaFileImage className="text-blue-500" />;
    if (lower.endsWith(".docx")) return <FaFileWord className="text-blue-600" />;
    if (lower.endsWith(".zip")) return <FaFileArchive className="text-yellow-500" />;
    return <FaFile className="text-gray-400" />;
  };

  const filteredClasses = classes.filter(cls =>
    cls.className.toLowerCase().includes(classSearchTerm.toLowerCase())
  );

  const parseSubmissionScore = (score) => {
    if (score === "" || score === null || score === undefined) return null;
    const parsed = Number(score);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const hasSubmissionScore = (submission) => parseSubmissionScore(submission?.score) !== null;

  const isNewSubmission = (submission) => {
    const candidate = submission?.submissionDate || submission?.submittedAt || submission?.createdAt;
    if (!candidate) return false;

    const submittedTime = new Date(candidate).getTime();
    if (Number.isNaN(submittedTime)) return false;

    const NEW_SUBMISSION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
    return Date.now() - submittedTime <= NEW_SUBMISSION_WINDOW_MS;
  };

  const matchesSubmissionFilter = (submission) => {
    const hasScore = hasSubmissionScore(submission);
    const isNew = isNewSubmission(submission);

    if (submissionStatusFilter === "graded") return hasScore || submission?.status === "Graded";
    if (submissionStatusFilter === "no_score") return !hasScore;
    if (submissionStatusFilter === "new") return !hasScore && isNew;
    if (submissionStatusFilter === "old") return !hasScore && !isNew;
    return true;
  };

  const filteredSubmissions = (selectedActivity?.submissions || []).filter((sub) => {
    const studentName = sub.studentId?.name || "";
    const matchesSearch = studentName.toLowerCase().includes(submissionSearchTerm.toLowerCase());
    return matchesSearch && matchesSubmissionFilter(sub);
  });

  const handleBackToClasses = () => {
    setSelectedClass(null);
    setActivities([]);
    setSelectedActivity(null);
  };

  const handleBackToActivities = () => {
    setSelectedActivity(null);
    setSubmissionSearchTerm("");
    setSubmissionStatusFilter("all");
  };

  const saveWorkbookToFile = async (workbook, fileName, classId) => {
    const workbookBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const canUseFilePicker =
      typeof window !== "undefined" && typeof window.showSaveFilePicker === "function";

    if (!canUseFilePicker) {
      XLSX.writeFile(workbook, fileName);
      return "downloaded";
    }

    const handleKey = classId || fileName;
    let fileHandle = reportFileHandlesRef.current[handleKey];

    const ensureWritableHandle = async () => {
      if (fileHandle) {
        const currentPermission = await fileHandle.queryPermission?.({ mode: "readwrite" });
        if (currentPermission === "granted") return fileHandle;

        const nextPermission = await fileHandle.requestPermission?.({ mode: "readwrite" });
        if (nextPermission === "granted") return fileHandle;
      }

      fileHandle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: "Excel Workbook",
            accept: {
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
            },
          },
        ],
      });

      reportFileHandlesRef.current[handleKey] = fileHandle;
      return fileHandle;
    };

    try {
      const writableHandle = await ensureWritableHandle();
      const writableStream = await writableHandle.createWritable();
      await writableStream.write(workbookBuffer);
      await writableStream.close();
      return "updated";
    } catch (saveError) {
      if (saveError?.name === "AbortError") {
        return "cancelled";
      }

      delete reportFileHandlesRef.current[handleKey];
      fileHandle = null;

      if (
        saveError?.name === "NotAllowedError" ||
        saveError?.name === "NotFoundError" ||
        saveError?.name === "SecurityError"
      ) {
        const writableHandle = await ensureWritableHandle();
        const writableStream = await writableHandle.createWritable();
        await writableStream.write(workbookBuffer);
        await writableStream.close();
        return "updated";
      }

      throw saveError;
    }
  };

  const handleExportExcel = async () => {
    if (!selectedClass) return;
    try {
      const res = await axios.get(`${API_BASE_URL}activities/export-scores`, {
        params: { classId: selectedClass._id }
      });
      const { exportData, activityTitles } = res.data;
      const normalizedRows = exportData.map((rowObj) => {
        const scores = activityTitles.map((title) => parseScoreValue(rowObj[title]));
        const submittedScores = scores.filter((score) => score !== null);
        const submittedCount = submittedScores.length;
        const averageScore = submittedCount
          ? submittedScores.reduce((total, score) => total + score, 0) / submittedCount
          : 0;
        const completionRate = activityTitles.length ? submittedCount / activityTitles.length : 0;
        const status = formatStatusLabel(averageScore, completionRate);

        return {
          name: rowObj.Name || "",
          email: rowObj.Email || "",
          scores,
          submittedCount,
          averageScore,
          completionRate,
          status,
          statusDisplay: formatStatusDisplay(status),
        };
      });

      const overallSubmittedScores = normalizedRows.flatMap((row) => row.scores.filter((score) => score !== null));
      const overallAverage = overallSubmittedScores.length
        ? overallSubmittedScores.reduce((total, score) => total + score, 0) / overallSubmittedScores.length
        : 0;
      const overallCompletion = normalizedRows.length && activityTitles.length
        ? overallSubmittedScores.length / (normalizedRows.length * activityTitles.length)
        : 0;
      const topStudent = [...normalizedRows]
        .filter((row) => row.submittedCount > 0)
        .sort((a, b) => b.averageScore - a.averageScore)[0];
      const onTrackCount = normalizedRows.filter((row) => row.status === "On Track").length;
      const needsReviewCount = normalizedRows.filter((row) => row.status === "Needs Review").length;
      const atRiskCount = normalizedRows.filter((row) => row.status === "At Risk").length;
      const noSubmissionCount = normalizedRows.filter((row) => row.status === "No Submission").length;

      const summaryRows = activityTitles.map((title, index) => {
        const scores = normalizedRows
          .map((row) => row.scores[index])
          .filter((score) => score !== null);
        const submitted = scores.length;
        const missing = Math.max(normalizedRows.length - submitted, 0);
        const average = submitted ? scores.reduce((total, score) => total + score, 0) / submitted : 0;
        const highest = submitted ? Math.max(...scores) : null;
        const lowest = submitted ? Math.min(...scores) : null;
        const completionRate = normalizedRows.length ? submitted / normalizedRows.length : 0;
        const status = formatStatusLabel(average, completionRate);

        return {
          activity: title,
          average,
          highest,
          lowest,
          submitted,
          missing,
          completionRate,
          status,
          statusDisplay: formatStatusDisplay(status),
        };
      });

      const columns = [
        "Name",
        "Email",
        ...activityTitles,
        "Submitted",
        "Average",
        "Completion Rate",
        "Status",
      ];
      const topActivity = [...summaryRows]
        .filter((row) => row.submitted > 0)
        .sort((a, b) => b.average - a.average)[0];
      const highlightRows = [
        ["Class Performance Highlights"],
        ["[OK] On Track", onTrackCount, "[WARN] Needs Review", needsReviewCount, "[RISK] At Risk", atRiskCount, "[NONE] No Submission", noSubmissionCount],
      ];
      const statusDistributionRows = [
        ["On Track", onTrackCount, normalizedRows.length ? onTrackCount / normalizedRows.length : 0],
        ["Needs Review", needsReviewCount, normalizedRows.length ? needsReviewCount / normalizedRows.length : 0],
        ["At Risk", atRiskCount, normalizedRows.length ? atRiskCount / normalizedRows.length : 0],
        ["No Submission", noSubmissionCount, normalizedRows.length ? noSubmissionCount / normalizedRows.length : 0],
      ];
      const generatedAt = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      const rows = [
        [`Activity Report: ${selectedClass.className}`],
        ['Performance Dashboard Export'],
        [],
        ['Generated On', generatedAt],
        ['Class', selectedClass.className || 'N/A'],
        ['Total Students', normalizedRows.length],
        ['Total Activities', activityTitles.length],
        ['Overall Average', overallAverage],
        ['Completion Rate', overallCompletion],
        ['Top Student', topStudent ? `${topStudent.name} (${topStudent.averageScore.toFixed(2)})` : 'N/A'],
        [],
        ...highlightRows,
        [],
        columns,
      ];

      normalizedRows.forEach((row) => {
        rows.push([
          row.name,
          row.email,
          ...row.scores.map((score) => (score === null ? "" : score)),
          row.submittedCount,
          row.submittedCount ? row.averageScore : "",
          row.completionRate,
          row.statusDisplay,
        ]);
      });

      const worksheet = XLSX.utils.aoa_to_sheet(rows);
      const tableHeaderRow = 14;
      const dataStartRow = tableHeaderRow + 1;
      const dataEndRow = dataStartRow + normalizedRows.length - 1;
      const firstNumericColumn = 2;
      const lastNumericColumn = firstNumericColumn + activityTitles.length - 1;
      worksheet["!merges"] = worksheet["!merges"] || [];
      worksheet["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } });
      worksheet["!merges"].push({ s: { r: 1, c: 0 }, e: { r: 1, c: columns.length - 1 } });
      worksheet["!merges"].push({ s: { r: 11, c: 0 }, e: { r: 11, c: columns.length - 1 } });
      worksheet["!cols"] = buildWorksheetColumns(rows.slice(tableHeaderRow), columns, {
        minWidth: 14,
        maxWidth: 30,
        overrides: {
          Name: 22,
          Email: 30,
          Submitted: 12,
          Average: 14,
          "Completion Rate": 18,
          Status: 24,
        },
      });
      worksheet["!rows"] = rows.map((_, rowIndex) => {
        if (rowIndex === 0) return { hpt: 36 };
        if (rowIndex === 1) return { hpt: 26 };
        if (rowIndex >= 3 && rowIndex <= 9) return { hpt: 23 };
        if (rowIndex === 11) return { hpt: 26 };
        if (rowIndex === 12) return { hpt: 28 };
        if (rowIndex === tableHeaderRow) return { hpt: 30 };
        if (rowIndex > tableHeaderRow) return { hpt: 22 };
        return { hpt: 22 };
      });

      // Main Title
      setWorksheetCellStyle(worksheet, 0, 0, buildExcelStyle({
        bold: true, size: 20, color: EXCEL_THEME.white, fillColor: EXCEL_THEME.primary,
        align: "center", border: buildExcelBorder("medium", EXCEL_THEME.primary)
      }));

      // Subtitle
      setWorksheetCellStyle(worksheet, 1, 0, buildExcelStyle({
        bold: true, size: 12, color: EXCEL_THEME.subHeaderText, fillColor: EXCEL_THEME.subHeaderBg,
        align: "center", border: buildExcelBorder("medium", EXCEL_THEME.chartBlue)
      }));

      // Dashboard Section (rows 3-9)
      const dashboardRowFills = [
        { label: EXCEL_THEME.labelBg, value: EXCEL_THEME.rowBase },
        { label: EXCEL_THEME.labelBg, value: EXCEL_THEME.rowBase },
        { label: EXCEL_THEME.labelBg, value: EXCEL_THEME.rowBase },
        { label: EXCEL_THEME.labelBg, value: EXCEL_THEME.rowBase },
        { label: EXCEL_THEME.labelBg, value: EXCEL_THEME.scoreGood },
        { label: EXCEL_THEME.labelBg, value: EXCEL_THEME.chartBlue },
        { label: EXCEL_THEME.labelBg, value: EXCEL_THEME.rowBase },
      ];
      for (let r = 3; r <= 9; r++) {
        const rowTheme = dashboardRowFills[r - 3] || { label: EXCEL_THEME.labelBg, value: EXCEL_THEME.rowBase };
        setWorksheetCellStyle(worksheet, r, 0, buildExcelStyle({
          bold: true, fillColor: rowTheme.label, align: "left",
          border: buildExcelBorder("thin")
        }));
        const numFmt = r === 7 ? "0.00" : r === 8 ? "0.0%" : undefined;
        setWorksheetCellStyle(worksheet, r, 1, buildExcelStyle({
          bold: true,
          fillColor: rowTheme.value,
          align: typeof rows[r][1] === "number" ? "right" : "left",
          border: buildExcelBorder("thin"), numFmt
        }));
      }

      // Highlights Section Title
      setWorksheetCellStyle(worksheet, 11, 0, buildExcelStyle({
        bold: true, size: 14, color: EXCEL_THEME.title, fillColor: EXCEL_THEME.sectionBg,
        align: "center", border: buildExcelBorder("medium", EXCEL_THEME.secondary)
      }));

      // Highlight Statuses
      const highlightStyles = [
        { color: EXCEL_THEME.statusGood, fill: EXCEL_THEME.scoreGood },
        { color: EXCEL_THEME.statusWarn, fill: EXCEL_THEME.scoreWarn },
        { color: EXCEL_THEME.statusLow, fill: EXCEL_THEME.scoreLow },
        { color: EXCEL_THEME.statusNone, fill: EXCEL_THEME.blank },
      ];
      for (let c = 0; c < 8; c++) {
        const style = highlightStyles[Math.floor(c / 2)];
        setWorksheetCellStyle(worksheet, 12, c, buildExcelStyle({
          bold: true, size: 12, color: style.color, fillColor: style.fill,
          align: 'center', border: buildExcelBorder("medium", style.color)
        }));
      }

      // Main Table Header
      for (let c = 0; c < columns.length; c++) {
        setWorksheetCellStyle(worksheet, 14, c, buildExcelStyle({
          bold: true, size: 12, color: EXCEL_THEME.headerLabel, fillColor: EXCEL_THEME.headerBg,
          align: "center", border: buildExcelBorder("medium", EXCEL_THEME.primary), wrapText: true
        }));
      }

      for (let r = dataStartRow; r <= dataEndRow; r++) {
        const isEvenRow = (r - dataStartRow) % 2 === 0;
        const rowFill = isEvenRow ? EXCEL_THEME.rowBase : EXCEL_THEME.rowAlt;

        for (let c = 0; c < columns.length; c++) {
          const cell = worksheet[XLSX.utils.encode_cell({ r, c })];
          if (!cell) continue;

          let fillColor = rowFill;
          let align = "left";
          let numFmt;
          let fontColor = EXCEL_THEME.headerText;

          if (c >= firstNumericColumn && c <= lastNumericColumn) {
            align = "right";
            numFmt = "0.00";
            const score = parseScoreValue(cell.v);
            if (score === null) fillColor = EXCEL_THEME.blank;
            else if (score >= 85) fillColor = EXCEL_THEME.scoreGood;
            else if (score >= 70) fillColor = EXCEL_THEME.scoreWarn;
            else fillColor = EXCEL_THEME.scoreLow;
          } else if (columns[c] === "Submitted") {
            align = "center";
            numFmt = "0";
          } else if (columns[c] === "Average") {
            align = "right";
            numFmt = "0.00";
            const average = parseScoreValue(cell.v);
            if (average !== null) {
              fillColor = average >= 85 ? EXCEL_THEME.scoreGood : average >= 70 ? EXCEL_THEME.scoreWarn : EXCEL_THEME.scoreLow;
            }
          } else if (columns[c] === "Completion Rate") {
            align = "right";
            numFmt = "0.0%";
          } else if (columns[c] === "Status") {
            align = "center";
            fontColor = getStatusColor(String(cell.v || ""));
          }

          setWorksheetCellStyle(worksheet, r, c, buildExcelStyle({
            fillColor, align, color: fontColor, border: buildExcelBorder("thin"), numFmt,
          }));
        }
      }

      worksheet["!autofilter"] = {
        ref: XLSX.utils.encode_range({
          s: { r: tableHeaderRow, c: 0 },
          e: { r: Math.max(dataEndRow, tableHeaderRow), c: columns.length - 1 }
        })
      };
      applyOuterBorderToRange(worksheet, 3, 9, 0, 1, EXCEL_THEME.secondary);
      applyOuterBorderToRange(worksheet, 12, 12, 0, 7, EXCEL_THEME.secondary);
      applyOuterBorderToRange(worksheet, tableHeaderRow, Math.max(dataEndRow, tableHeaderRow), 0, columns.length - 1, EXCEL_THEME.secondary);

      const summarySheetRows = [
        [`Activity Summary: ${selectedClass.className}`],
        ["Performance Snapshot"],
        [],
        ["Generated On", generatedAt],
        ["Top Performer", topStudent ? `${topStudent.name} (${topStudent.averageScore.toFixed(2)})` : "N/A"],
        ["Top Activity", topActivity ? `${topActivity.activity} (${topActivity.average.toFixed(2)})` : "N/A"],
        ["Legend", "[OK] On Track | [WARN] Needs Review | [RISK] At Risk | [NONE] No Submission"],
        [],
        ["Dashboard Metrics"],
        ["Overall Average", overallAverage, "Completion Rate", overallCompletion, "Students", normalizedRows.length, "Activities", activityTitles.length],
        [],
        ["Activity", "Average", "Highest", "Lowest", "Submitted", "Missing", "Completion Rate", "Status"],
        ...summaryRows.map((row) => [
          row.activity,
          row.submitted ? row.average : "",
          row.highest ?? "",
          row.lowest ?? "",
          row.submitted,
          row.missing,
          row.completionRate,
          row.statusDisplay,
        ]),
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summarySheetRows);
      summarySheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
        { s: { r: 8, c: 0 }, e: { r: 8, c: 7 } }
      ];
      summarySheet["!cols"] = buildWorksheetColumns(summarySheetRows.slice(11), summarySheetRows[11], {
        minWidth: 14,
        maxWidth: 28,
        overrides: {
          Activity: 24,
          Average: 14,
          Highest: 14,
          Lowest: 14,
          Submitted: 12,
          Missing: 12,
          "Completion Rate": 18,
          Status: 24,
        },
      });
      summarySheet["!autofilter"] = {
        ref: XLSX.utils.encode_range({
          s: { r: 11, c: 0 },
          e: { r: Math.max(summarySheetRows.length - 1, 11), c: 7 }
        })
      };
      summarySheet["!rows"] = summarySheetRows.map((_, rowIndex) => {
        if (rowIndex === 0) return { hpt: 34 };
        if (rowIndex === 1) return { hpt: 24 };
        if (rowIndex >= 3 && rowIndex <= 6) return { hpt: 23 };
        if (rowIndex === 8) return { hpt: 26 };
        if (rowIndex === 9) return { hpt: 24 };
        if (rowIndex === 11) return { hpt: 28 };
        if (rowIndex > 11) return { hpt: 22 };
        return { hpt: 22 };
      });

      setWorksheetCellStyle(summarySheet, 0, 0, buildExcelStyle({
        bold: true, size: 18, color: EXCEL_THEME.white, fillColor: EXCEL_THEME.primary,
        align: "center", border: buildExcelBorder("medium", EXCEL_THEME.primary)
      }));
      setWorksheetCellStyle(summarySheet, 1, 0, buildExcelStyle({
        bold: true, size: 12, color: EXCEL_THEME.subHeaderText, fillColor: EXCEL_THEME.subHeaderBg,
        align: "center", border: buildExcelBorder("medium", EXCEL_THEME.chartBlue)
      }));

      const summaryInfoFills = [
        { label: EXCEL_THEME.labelBg, value: EXCEL_THEME.rowBase },
        { label: EXCEL_THEME.labelBg, value: EXCEL_THEME.rowBase },
        { label: EXCEL_THEME.labelBg, value: EXCEL_THEME.rowBase },
        { label: EXCEL_THEME.labelBg, value: EXCEL_THEME.rowBase },
      ];
      for (let r = 3; r <= 6; r++) {
        const rowTheme = summaryInfoFills[r - 3] || { label: EXCEL_THEME.labelBg, value: EXCEL_THEME.rowBase };
        setWorksheetCellStyle(summarySheet, r, 0, buildExcelStyle({ bold: true, fillColor: rowTheme.label, border: buildExcelBorder("thin") }));
        setWorksheetCellStyle(summarySheet, r, 1, buildExcelStyle({ bold: true, align: "left", fillColor: rowTheme.value, border: buildExcelBorder("thin") }));
      }
      setWorksheetCellStyle(summarySheet, 4, 1, buildExcelStyle({ bold: true, align: "left", fillColor: EXCEL_THEME.scoreGood, border: buildExcelBorder("thin") }));
      setWorksheetCellStyle(summarySheet, 5, 1, buildExcelStyle({ bold: true, align: "left", fillColor: EXCEL_THEME.chartBlue, border: buildExcelBorder("thin") }));
      setWorksheetCellStyle(summarySheet, 6, 1, buildExcelStyle({ align: "left", fillColor: EXCEL_THEME.rowBase, border: buildExcelBorder("thin") }));

      setWorksheetCellStyle(summarySheet, 8, 0, buildExcelStyle({
        bold: true, size: 13, color: EXCEL_THEME.title, fillColor: EXCEL_THEME.sectionBg,
        align: "center", border: buildExcelBorder("medium", EXCEL_THEME.secondary)
      }));

      const metricRowStyles = [
        EXCEL_THEME.infoSoft,
        EXCEL_THEME.chartBlue,
        EXCEL_THEME.infoSoft,
        EXCEL_THEME.chartTeal,
      ];
      for (let c = 0; c < 8; c++) {
        setWorksheetCellStyle(summarySheet, 9, c, buildExcelStyle({
          bold: c % 2 === 0,
          size: 11,
          fillColor: metricRowStyles[Math.floor(c / 2)],
          align: c % 2 === 0 ? "left" : "right",
          border: buildExcelBorder("medium", EXCEL_THEME.secondary),
          numFmt: c === 1 ? "0.00" : c === 3 ? "0.0%" : c === 5 || c === 7 ? "0" : undefined,
        }));
      }


      for (let c = 0; c < 8; c++) {
        setWorksheetCellStyle(summarySheet, 11, c, buildExcelStyle({
          bold: true, size: 12, color: EXCEL_THEME.headerLabel, fillColor: EXCEL_THEME.headerBg,
          align: "center", border: buildExcelBorder("medium", EXCEL_THEME.primary), wrapText: true
        }));
      }

      for (let r = 12; r < summarySheetRows.length; r++) {
        const isEvenRow = (r - 12) % 2 === 0;
        const rowFill = isEvenRow ? EXCEL_THEME.rowBase : EXCEL_THEME.rowAlt;

        for (let c = 0; c < 8; c++) {
          const value = summarySheetRows[r][c];
          let fillColor = rowFill;
          let align = c === 0 ? "left" : c === 7 ? "center" : "right";
          let numFmt = undefined;
          let fontColor = EXCEL_THEME.headerText;

          if (c >= 1 && c <= 3 && value !== '') {
            numFmt = "0.00";
            const numeric = parseScoreValue(value);
            if (numeric !== null) {
              fillColor = numeric >= 85 ? EXCEL_THEME.scoreGood : numeric >= 70 ? EXCEL_THEME.scoreWarn : EXCEL_THEME.scoreLow;
            }
          } else if (c === 6) {
            numFmt = "0.0%";
          } else if (c === 7) {
            fontColor = getStatusColor(String(value || ""));
          } else if (c === 4 || c === 5) {
            numFmt = "0";
          }

          setWorksheetCellStyle(summarySheet, r, c, buildExcelStyle({
            fillColor, align, color: fontColor, border: buildExcelBorder("thin"), numFmt,
          }));
        }
      }
      applyOuterBorderToRange(summarySheet, 3, 6, 0, 1, EXCEL_THEME.secondary);
      applyOuterBorderToRange(summarySheet, 9, 9, 0, 7, EXCEL_THEME.secondary);
      applyOuterBorderToRange(summarySheet, 11, Math.max(summarySheetRows.length - 1, 11), 0, 7, EXCEL_THEME.secondary);

      const chartSheetRows = [
        [`Dashboard Data: ${selectedClass.className}`],
        ["Presentation-ready chart inputs for comparison and distribution"],
        [],
        ["Status Distribution"],
        ["Status", "Count", "Share"],
        ...statusDistributionRows,
        [],
        ["Activity Comparison"],
        ["Activity", "Average Score", "Submission Count", "Completion Rate", "Score Band", "Completion Band"],
        ...summaryRows.map((row) => [
          row.activity,
          row.submitted ? row.average : 0,
          row.submitted,
          row.completionRate,
          row.submitted ? "|".repeat(Math.max(1, Math.round(row.average / 10))) : "",
          row.submitted ? "|".repeat(Math.max(1, Math.round(row.completionRate * 10))) : "",
        ]),
      ];

      const chartSheet = XLSX.utils.aoa_to_sheet(chartSheetRows);
      chartSheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 2 } },
        { s: { r: 10, c: 0 }, e: { r: 10, c: 5 } },
      ];
      chartSheet["!cols"] = [
        { wch: 24 },
        { wch: 16 },
        { wch: 16 },
        { wch: 18 },
        { wch: 20 },
        { wch: 20 },
      ];
      chartSheet["!rows"] = chartSheetRows.map((_, rowIndex) => {
        if (rowIndex === 0) return { hpt: 34 };
        if (rowIndex === 1) return { hpt: 24 };
        if (rowIndex === 3 || rowIndex === 10) return { hpt: 24 };
        if (rowIndex === 4 || rowIndex === 11) return { hpt: 28 };
        if (rowIndex > 11) return { hpt: 22 };
        return { hpt: 22 };
      });
      chartSheet["!autofilter"] = {
        ref: XLSX.utils.encode_range({
          s: { r: 11, c: 0 },
          e: { r: Math.max(chartSheetRows.length - 1, 11), c: 5 }
        })
      };

      setWorksheetCellStyle(chartSheet, 0, 0, buildExcelStyle({
        bold: true, size: 18, color: EXCEL_THEME.white, fillColor: EXCEL_THEME.primary,
        align: "center", border: buildExcelBorder("medium", EXCEL_THEME.primary)
      }));
      setWorksheetCellStyle(chartSheet, 1, 0, buildExcelStyle({
        bold: true, size: 12, color: EXCEL_THEME.subHeaderText, fillColor: EXCEL_THEME.subHeaderBg,
        align: "center", border: buildExcelBorder("medium", EXCEL_THEME.chartBlue)
      }));
      setWorksheetCellStyle(chartSheet, 3, 0, buildExcelStyle({
        bold: true, size: 13, color: EXCEL_THEME.title, fillColor: EXCEL_THEME.sectionBg,
        align: "center", border: buildExcelBorder("medium", EXCEL_THEME.secondary)
      }));
      setWorksheetCellStyle(chartSheet, 10, 0, buildExcelStyle({
        bold: true, size: 13, color: EXCEL_THEME.title, fillColor: EXCEL_THEME.sectionBg,
        align: "center", border: buildExcelBorder("medium", EXCEL_THEME.secondary)
      }));

      for (const headerRow of [4, 11]) {
        const endColumn = headerRow === 4 ? 2 : 5;
        for (let c = 0; c <= endColumn; c++) {
          setWorksheetCellStyle(chartSheet, headerRow, c, buildExcelStyle({
            bold: true, size: 12, color: EXCEL_THEME.headerLabel, fillColor: EXCEL_THEME.headerBg,
            align: "center", border: buildExcelBorder("medium", EXCEL_THEME.primary)
          }));
        }
      }

      for (let r = 5; r <= 8; r++) {
        const rowFill = (r - 5) % 2 === 0 ? EXCEL_THEME.rowBase : EXCEL_THEME.rowAlt;
        const currentStatus = statusDistributionRows[r - 5]?.[0];

        for (let c = 0; c <= 2; c++) {
          const statusFill = currentStatus === "On Track"
            ? EXCEL_THEME.scoreGood
            : currentStatus === "Needs Review"
              ? EXCEL_THEME.scoreWarn
              : currentStatus === "No Submission"
                ? EXCEL_THEME.blank
                : EXCEL_THEME.scoreLow;
          const fillColor = c === 0 || c === 1 ? statusFill : rowFill;
          const fontColor = c === 0
            ? currentStatus === "On Track"
              ? EXCEL_THEME.statusGood
              : currentStatus === "Needs Review"
                ? EXCEL_THEME.statusWarn
                : currentStatus === "No Submission"
                  ? EXCEL_THEME.statusNone
                : EXCEL_THEME.statusLow
            : EXCEL_THEME.headerText;

          setWorksheetCellStyle(chartSheet, r, c, buildExcelStyle({
            fillColor,
            align: c === 0 ? "left" : "right",
            border: buildExcelBorder("thin"),
            color: fontColor,
            bold: c === 0,
            numFmt: c === 2 ? "0.0%" : c === 1 ? "0" : undefined,
          }));
        }
      }

      for (let r = 12; r < chartSheetRows.length; r++) {
        const isEvenRow = (r - 12) % 2 === 0;
        const rowFill = isEvenRow ? EXCEL_THEME.rowBase : EXCEL_THEME.rowAlt;

        for (let c = 0; c <= 5; c++) {
          const value = chartSheetRows[r][c];
          const numeric = parseScoreValue(value);
          let fillColor = rowFill;

          if (c === 1 && numeric !== null) {
            fillColor = numeric >= 85 ? EXCEL_THEME.scoreGood : numeric >= 70 ? EXCEL_THEME.scoreWarn : EXCEL_THEME.scoreLow;
          } else if (c === 3) {
            fillColor = EXCEL_THEME.chartTeal;
          }

          setWorksheetCellStyle(chartSheet, r, c, buildExcelStyle({
            fillColor,
            align: c === 0 || c >= 4 ? "left" : "right",
            border: buildExcelBorder("thin"),
            numFmt: c === 1 ? "0.00" : c === 2 ? "0" : c === 3 ? "0.0%" : undefined,
          }));
        }
      }

      applyOuterBorderToRange(chartSheet, 4, 8, 0, 2, EXCEL_THEME.secondary);
      applyOuterBorderToRange(chartSheet, 11, Math.max(chartSheetRows.length - 1, 11), 0, 5, EXCEL_THEME.secondary);

      const workbook = XLSX.utils.book_new();
      const mainSheetView = {
        showGridLines: false,
        view: "pageLayout",
        zoomScale: 85,
        state: 'frozen',
        ySplit: 15,
        topLeftCell: 'A16',
        activeTab: 0
      };
      worksheet['!views'] = [mainSheetView];

      const summarySheetView = {
        showGridLines: false,
        view: "pageLayout",
        zoomScale: 90,
        state: 'frozen',
        ySplit: 12,
        topLeftCell: 'A13',
      };
      summarySheet['!views'] = [summarySheetView];
      const chartSheetView = {
        showGridLines: false,
        view: "pageLayout",
        zoomScale: 90,
        state: "frozen",
        ySplit: 12,
        topLeftCell: "A13",
      };
      chartSheet["!views"] = [chartSheetView];

      const reportFileName = buildReportFilename(selectedClass.className);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Student Scores");
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Activity Summary");
      XLSX.utils.book_append_sheet(workbook, chartSheet, "Dashboard Data");
      const saveMode = await saveWorkbookToFile(workbook, reportFileName, selectedClass._id);

      if (saveMode === "updated") {
        await showAlert("success", "Excel Updated", "The report was saved to the same Excel file.");
      } else if (saveMode === "downloaded") {
        await showAlert("success", "Excel Downloaded", "The report was downloaded as a new Excel file.");
      }
    } catch (err) {
      if (err?.name === "AbortError") {
        return;
      }
      await showAlert('error', 'Export Failed', 'Failed to export scores: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <FaSpinner className="animate-spin text-4xl text-blue-600 mr-3" />
            <p className="text-lg font-semibold text-gray-600">Loading...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
            <div className="flex items-center">
              <FaTimesCircle className="text-red-500 text-xl mr-3" />
              <p className="text-red-700 font-medium">Error: {error}</p>
            </div>
          </div>
        )}

        {/* Class Selection View */}
        {!selectedClass && (
          <>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-600 p-3 rounded-xl">
                  <FaClipboardList className="text-3xl text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Activity Monitoring</h1>
                  <p className="text-gray-600 text-sm sm:text-base">Select a class to view activities and submissions</p>
                </div>
              </div>
              <div className="h-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full w-24"></div>
            </div>

            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search classes..."
                  className="w-full p-4 pl-12 border-2 border-blue-200 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
                  value={classSearchTerm}
                  onChange={(e) => setClassSearchTerm(e.target.value)}
                />
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Classes Grid */}
            {filteredClasses.length === 0 && !loading ? (
              <div className="text-center py-16">
                <div className="bg-white rounded-xl shadow-md p-12 max-w-md mx-auto">
                  <FaClipboardList className="text-6xl text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No Classes Found</h3>
                  <p className="text-gray-600">No classes match your search criteria.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClasses.map((cls) => (
                  <div
                    key={cls._id}
                    className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden border-2 border-transparent hover:border-blue-300"
                    onClick={() => setSelectedClass(cls)}
                  >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <FaBookOpen className="text-white text-xl" />
                        <h3 className="text-xl font-bold text-white truncate">{cls.className}</h3>
                      </div>
                      {cls.section && (
                        <p className="text-blue-100 text-sm">Section: {cls.section}</p>
                      )}
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-3">
                      <div className="flex items-center gap-3 text-gray-700">
                        <FaMapMarkerAlt className="text-blue-600 flex-shrink-0" />
                        <span className="text-sm"><strong>Room:</strong> {cls.roomNumber || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-700">
                        <FaCalendarAlt className="text-blue-600 flex-shrink-0" />
                        <span className="text-sm"><strong>Day:</strong> {cls.day || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-700">
                        <FaClock className="text-blue-600 flex-shrink-0" />
                        <span className="text-sm"><strong>Time:</strong> {cls.time ? new Date(cls.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "N/A"}</span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-blue-50 px-6 py-3 border-t-2 border-blue-100">
                      <p className="text-sm text-blue-700 font-semibold text-center flex items-center justify-center gap-2">
                        <FaTasks /> View Activities
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Activities View */}
        {selectedClass && !selectedActivity && (
          <>
            {/* Header with Back Button */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
              <button
                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-blue-200 text-blue-700 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-sm"
                onClick={handleBackToClasses}
              >
                <FaChevronLeft /> Back to Classes
              </button>
              <button
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all shadow-md"
                onClick={handleExportExcel}
              >
                <FaFileExport /> Export to Excel
              </button>
            </div>

            {/* Class Info Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-xl p-6 sm:p-8 mb-8 text-white">
              <div className="flex items-center gap-3 mb-4">
                <FaTasks className="text-4xl" />
                <h1 className="text-2xl sm:text-3xl font-bold">Activities for {selectedClass.className}</h1>
              </div>
              <div className="flex flex-wrap gap-4 text-sm sm:text-base">
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                  <FaMapMarkerAlt />
                  <span><strong>Room:</strong> {selectedClass.roomNumber || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                  <FaCalendarAlt />
                  <span><strong>Day:</strong> {selectedClass.day || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
                  <FaClock />
                  <span><strong>Time:</strong> {selectedClass.time ? new Date(selectedClass.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Activities Grid */}
            {activities.length === 0 && !loading ? (
              <div className="text-center py-16">
                <div className="bg-white rounded-xl shadow-md p-12 max-w-md mx-auto">
                  <FaBookOpen className="text-6xl text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No Activities</h3>
                  <p className="text-gray-600">No activities found for this class.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {activities.map(activity => (
                  <div
                    key={activity._id}
                    onClick={() => setSelectedActivity(activity)}
                    className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden border-2 border-transparent hover:border-blue-300"
                  >
                    {/* Activity Title */}
                    <div className="p-6 border-b-2 border-blue-100">
                      <div className="flex items-center gap-2 mb-2">
                        <FaBookOpen className="text-blue-600 text-xl" />
                        <h2 className="text-lg font-bold text-gray-800 truncate">{activity.title}</h2>
                      </div>
                      {activity.date && (
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <FaCalendarAlt className="text-blue-600" />
                          Due: {new Date(activity.date).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Submissions Count */}
                    <div className="bg-blue-50 px-6 py-4 flex justify-between items-center">
                      <div className="flex items-center gap-2 text-gray-700">
                        <FaUsers className="text-blue-600" />
                        <span className="text-sm font-semibold">Submissions</span>
                      </div>
                      <div className="bg-blue-600 text-white font-bold text-lg rounded-full h-10 w-10 flex items-center justify-center shadow-md">
                        {activity.submissions.length}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Submissions View */}
        {selectedClass && selectedActivity && (
          <>
            {/* Back Button */}
            <button
              className="flex items-center gap-2 mb-8 px-6 py-3 bg-white border-2 border-blue-200 text-blue-700 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-sm"
              onClick={handleBackToActivities}
            >
              <FaChevronLeft /> Back to Activities
            </button>

            {/* Activity Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-xl p-6 mb-8 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <FaBookOpen className="text-3xl" />
                  <div>
                    <h2 className="text-2xl font-bold">{selectedActivity.title}</h2>
                    {selectedActivity.date && (
                      <p className="text-blue-100 text-sm flex items-center gap-2 mt-1">
                        <FaCalendarAlt />
                        Due: {new Date(selectedActivity.date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="bg-white/20 px-4 py-2 rounded-lg">
                  <p className="text-sm font-semibold">Total Submissions: {selectedActivity.submissions.length}</p>
                </div>
              </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="mb-6 flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="relative max-w-md w-full">
                <input
                  type="text"
                  placeholder="Search by student name..."
                  className="w-full p-3 pl-10 border-2 border-blue-200 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={submissionSearchTerm}
                  onChange={(e) => setSubmissionSearchTerm(e.target.value)}
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>

              <select
                className="w-full sm:w-56 p-3 border-2 border-blue-200 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={submissionStatusFilter}
                onChange={(e) => setSubmissionStatusFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="new">New</option>
                <option value="old">Old</option>
                <option value="graded">Graded</option>
                <option value="no_score">No Score</option>
              </select>
            </div>

            {/* Submissions Table */}
            {filteredSubmissions.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-white rounded-xl shadow-md p-12 max-w-md mx-auto">
                  <FaUsers className="text-6xl text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No Submissions</h3>
                  <p className="text-gray-600">No submissions found for this activity.</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Student</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Submitted</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Attachment</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">Score</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredSubmissions
                        .map((sub, index) => {
                          const fileTypeIcon = getFileIcon(sub.fileName);
                          const hasScore = hasSubmissionScore(sub);
                          const isGraded = hasScore || sub.status === 'Graded';
                          
                          // Build proper fileUrl
                          let fileUrl = null;
                          if (sub.cloudinaryUrl) {
                            fileUrl = sub.cloudinaryUrl;
                          } else if (sub.filePath && sub.filePath.startsWith('http')) {
                            fileUrl = sub.filePath;
                          } else if (sub._id) {
                            fileUrl = `${API_BASE_URL}activities/submission/${sub._id}/download`;
                          }

                          // Validate that fileUrl is a full URL (not just a filename)
                          const isValidUrl = fileUrl && (fileUrl.startsWith('http://') || fileUrl.startsWith('https://'));
                          const canShowImage = isValidUrl && /\.(jpg|jpeg|png|gif)$/i.test(sub.fileName);

                          const dueDate = selectedActivity.date ? new Date(selectedActivity.date) : null;
                          const submissionDate = sub.submissionDate ? new Date(sub.submissionDate) : null;
                          const isLate = submissionDate && dueDate && submissionDate > dueDate;
                          const isNew = !isGraded && isNewSubmission(sub);

                          return (
                            <tr key={sub._id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-blue-50/50'} hover:bg-blue-50 transition-colors`}>
                              {/* Student Info */}
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="bg-blue-100 p-2 rounded-full">
                                    <FaUsers className="text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-800">{sub.studentId?.name || "-"}</p>
                                    <p className="text-sm text-gray-600">{sub.studentId?.email || "-"}</p>
                                  </div>
                                </div>
                              </td>

                              {/* Submission Date */}
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-gray-700">
                                  <FaCalendarAlt className="text-blue-600" />
                                  <span className="text-sm">
                                    {submissionDate ? submissionDate.toLocaleDateString() : "-"}
                                  </span>
                                </div>
                              </td>

                              {/* Attachment */}
                              <td className="px-6 py-4">
                                {sub.fileName ? (
                                  <div className="flex flex-col gap-2">
                                    <span className="text-xs text-gray-600 truncate max-w-xs">{sub.fileName}</span>
                                    {/* Image preview for Cloudinary uploads */}
                                    {canShowImage && sub.cloudinaryPublicId && isValidUrl && (
                                      <img
                                        src={fileUrl}
                                        alt={sub.fileName}
                                        className="w-24 h-16 object-cover rounded border border-gray-200"
                                        onError={(e) => {
                                          console.warn('Image failed to load:', fileUrl);
                                          e.target.style.display = 'none';
                                        }}
                                        loading="lazy"
                                      />
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                      {/* View button */}
                                      <a
                                        href={isValidUrl ? fileUrl : `${API_BASE_URL}activities/submission/${sub._id}/download`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                                      >
                                        <FaEye size={12} />
                                        <span>View</span>
                                      </a>
                                      {/* Download button */}
                                      <button
                                        onClick={() => handleDownloadFile(
                                          isValidUrl ? fileUrl : `${API_BASE_URL}activities/submission/${sub._id}/download`,
                                          sub.fileName
                                        )}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium cursor-pointer"
                                      >
                                        {fileTypeIcon}
                                        <span>Download</span>
                                        <FaDownload size={12} />
                                      </button>
                                    </div>
                                  </div>
                                ) : sub.content ? (
                                  <span className="text-gray-700 text-sm">
                                    {sub.content.length > 80 ? sub.content.substring(0, 80) + '...' : sub.content}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 italic flex items-center gap-2">
                                    <FaFile /> No file
                                  </span>
                                )}
                              </td>

                              {/* Score Input */}
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                  <FaTasks className="text-blue-600" />
                                  <input
                                    type="number"
                                    value={sub.score ?? ""}
                                    onChange={(e) => handleScoreChange(selectedActivity._id, sub._id, e.target.value)}
                                    className="w-20 p-2 border-2 border-blue-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="0"
                                  />
                                </div>
                              </td>

                              {/* Status */}
                              <td className="px-6 py-4">
                                <div className="flex flex-col items-center gap-1">
                                  {/* Submission status */}
                                  {isGraded ? (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                                      <FaCheckCircle /> Graded
                                    </span>
                                  ) : sub.status === 'Resubmitted' ? (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                                      <FaClock /> Resubmitted
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                      <FaClipboardList /> Submitted
                                    </span>
                                  )}
                                  {!isGraded && (isNew ? (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-xs font-semibold">
                                      <FaClock /> New
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                                      <FaClock /> Old
                                    </span>
                                  ))}
                                  {/* Late indicator */}
                                  {isLate && !isGraded && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                                      <FaTimesCircle /> Late
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Save Button */}
                              <td className="px-6 py-4">
                                <div className="flex justify-center">
                                  <button
                                    onClick={() => handleSubmitScore(sub._id, sub.score, selectedActivity._id)}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                                  >
                                    <FaCheckCircle /> Save
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
