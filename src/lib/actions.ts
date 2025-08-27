
// This file serves as a central hub for re-exporting all server actions.
// By doing this, we can ensure that client components only import from this file,
// providing a clear boundary between server and client code.

'use server';

import { 
    promotePersonnel, 
    demotePersonnel, 
    firePersonnel, 
    updatePersonnel,
    addPersonnel,
    rehirePersonnel,
} from './actions/personnel-actions';

import { 
    getApplicationFormFields, 
    saveApplicationFormFields, 
    submitApplication, 
    updateApplicationStatus 
} from './actions/form-actions';

import {
    getPersonnel,
    getArchivedPersonnel,
    getBlacklistedPersonnel,
    getApplications,
    getRecentActivity
} from './actions/data-actions';

import {
    submitBugReport,
    submitSuggestion,
    getBugReports,
    getSuggestions,
    updateBugReportStatus,
    deleteBugReport,
    updateSuggestionStatus,
    deleteSuggestion
} from './actions/report-actions';

import {
    getUsers,
    assignUserRole
} from './actions/user-actions';

import { getCallsignLogs } from './actions/callsign-log-actions';

import { getAuditLogs, logUserAction, addBlacklistedPersonnel, removeBlacklistedPersonnel } from './actions/audit-log-actions';

import { updatePersonnelStatus } from './actions/status-actions';


export {
    promotePersonnel,
    demotePersonnel,
    firePersonnel,
    updatePersonnel,
    addPersonnel,
    rehirePersonnel,
    getApplicationFormFields,
    saveApplicationFormFields,
    submitApplication,
    updateApplicationStatus,
    getPersonnel,
    getArchivedPersonnel,
    getBlacklistedPersonnel,
    getApplications,
    getRecentActivity,
    submitBugReport,
    submitSuggestion,
    getBugReports,
    getSuggestions,
    updateBugReportStatus,
    deleteBugReport,
    updateSuggestionStatus,
    deleteSuggestion,
    getUsers,
    assignUserRole,
    getCallsignLogs,
    getAuditLogs,
    logUserAction,
    addBlacklistedPersonnel,
    removeBlacklistedPersonnel,
    updatePersonnelStatus,
};
