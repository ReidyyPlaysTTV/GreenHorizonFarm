
// This file serves as a central hub for re-exporting all server actions.
// We DO NOT use 'use server' here to avoid build errors with barrel re-exports.
// The underlying action files contain the 'use server' directive.

export {
    promotePersonnel,
    demotePersonnel,
    firePersonnel,
    updatePersonnel,
    addPersonnel,
    rehirePersonnel
} from './actions/personnel-actions';

export {
    getApplicationFormFields,
    saveApplicationFormFields,
    submitApplication,
    updateApplicationStatus,
    getApplicationById,
    deleteApplication
} from './actions/form-actions';

export {
    getPersonnel,
    getArchivedPersonnel,
    getBlacklistedPersonnel,
    getApplications,
    getRecentActivity
} from './actions/data-actions';

export {
    submitBugReport,
    submitSuggestion,
    getBugReports,
    getSuggestions,
    updateBugReportStatus,
    deleteBugReport,
    updateSuggestionStatus,
    deleteSuggestion
} from './actions/report-actions';

export {
    testDatabaseConnection,
    getUsers,
    getUserByUsername,
    loginUser,
    submitAccessRequest,
    approveAccessRequest,
    denyAccessRequest,
    getAccessRequests,
    setUserStatus,
    deleteUser,
    getReviewedApplicationsCount,
    createUser,
    updateUser,
    resetUserPassword,
    changeUserPassword,
    updateProfilePicture
} from './actions/user-actions';

export {
    logCallsignChange,
    getCallsignLogs
} from './actions/callsign-log-actions';

export {
    logUserAction,
    getAuditLogs,
    addBlacklistedPersonnel,
    removeBlacklistedPersonnel
} from './actions/audit-log-actions';

export {
    updatePersonnelStatus
} from './actions/status-actions';

export {
    getPermissionsMap,
    updateRolePermissions
} from './actions/permission-actions';

export {
    getSopLink,
    updateSopLink,
    getApplicationStatus,
    updateApplicationStatusSetting,
    getLoginBackgroundImage,
    updateLoginBackgroundImage,
    getMaintenanceMode,
    updateMaintenanceMode
} from './actions/settings-actions';

export {
    getAnnouncements,
    addAnnouncement,
    deleteAnnouncement
} from './actions/announcement-actions';

export {
    getGalleryImages,
    addGalleryImage,
    deleteGalleryImage
} from './actions/gallery-actions';

export {
    getChangelogs,
    addChangelog,
    deleteChangelog
} from './actions/changelog-actions';

export {
    getRanks
} from './actions/rank-actions';

export {
    submitDetailedOrder,
    getDetailedOrders,
    getOrdersByStaff
} from './actions/order-actions';

export {
    submitSecurityTimeLog,
    submitSecurityIncident,
    getSecurityTimeLogs,
    getSecurityIncidents
} from './actions/security-actions';

export {
    submitFarmEvent,
    updateFarmEvent,
    cancelFarmEvent,
    completeFarmEvent,
    deleteFarmEvent,
    getFarmEvents
} from './actions/event-actions';

export {
    getBaseBalance,
    updateBaseBalance,
    addFarmTransaction,
    getFarmTransactions
} from './actions/finance-actions';

export {
    addFarmProcedure,
    deleteFarmProcedure,
    getFarmProcedures
} from './actions/procedure-actions';

export {
    addStaffIncident,
    addFarmProduct,
    addManagerPlan,
    addPromotionSuggestion,
    getManagerData,
    reviewPromotionSuggestion,
    reviewManagerPlan,
    sendCeoChatMessage,
    getCeoChatMessages
} from './actions/manager-actions';
