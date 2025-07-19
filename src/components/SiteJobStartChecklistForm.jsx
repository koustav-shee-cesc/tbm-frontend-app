import React, { useState, useEffect } from 'react';

// Reusable Message Box Component
const MessageBox = ({ message, type, onClose, details = '' }) => {
    const bgColor = type === 'success' ? 'bg-blue-600' : 'bg-red-600';
    const hoverColor = type === 'success' ? 'hover:bg-blue-700' : 'hover:bg-red-700';
    const titleColor = type === 'success' ? 'text-blue-600' : 'text-red-600';

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-sm w-full">
                <h3 className={`text-xl font-semibold mb-4 ${titleColor}`}>{type === 'success' ? 'Success!' : 'Error!'}</h3>
                <p className="mb-2">{message}</p>
                {details && <p className="text-sm text-gray-600 mb-6">{details}</p>}
                <button
                    onClick={onClose}
                    className={`px-6 py-2 text-white rounded-md transition-colors ${bgColor} ${hoverColor}`}
                >
                    Close
                </button>
            </div>
        </div>
    );
};

const SiteJobStartChecklistForm = () => {
    const [formData, setFormData] = useState({
        checklistDate: '',
        jobSite: '',
        teamName: '',
        teamMembers: [],
        informedStationStaff: '',
        workScrutinized: '',
        bareLiveComponents: '',
        abnormalitiesObserved: '',
        othersAbnormalities: '',
        teamMembersWornPPEs: '',
        cableBasementActivities: [],
        remarks: ''
    });

    const [companies, setCompanies] = useState([]);
    const [availableMembers, setAvailableMembers] = useState([]);
    const [selectedMemberToAdd, setSelectedMemberToAdd] = useState('');

    const [showMessageBox, setShowMessageBox] = useState(false);
    const [messageBoxContent, setMessageBoxContent] = useState({ message: '', type: 'success', details: '' });

    const [showOthersAbnormalities, setShowOthersAbnormalities] = useState(false);
    const [isSiteChecklistOfficeEligible, setIsSiteChecklistOfficeEliguloible] = useState(false); // NEW: State for Site Checklist Office eligibility
    const [siteChecklistOfficeEligibilityMessage, setSiteChecklistOfficeEligibilityMessage] = useState(''); // NEW: Message for eligibility

    // Fetch companies on component mount
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/companies');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setCompanies(data);
            } catch (error) {
                console.error("Failed to fetch companies:", error);
                setMessageBoxContent({
                    message: `Failed to load company names: ${error.message}`,
                    type: 'error',
                    details: 'Please ensure the backend server is running and companies are added.'
                });
                setShowMessageBox(true);
            }
        };
        fetchCompanies();

        // Set today's date as default
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        setFormData(prevData => ({
            ...prevData,
            checklistDate: `${year}-${month}-${day}`
        }));
    }, []);

    // Effect for fetching members based on selected teamName
    useEffect(() => {
        const fetchMembersByCompany = async () => {
            if (formData.teamName) {
                try {
                    const response = await fetch(`http://localhost:3000/api/members?companyName=${encodeURIComponent(formData.teamName)}`);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const data = await response.json();
                    setAvailableMembers(data.map(member => member.memberName));
                    setFormData(prevData => ({ ...prevData, teamMembers: [] }));
                    setSelectedMemberToAdd('');
                } catch (error) {
                    console.error("Failed to fetch members for selected company:", error);
                    setMessageBoxContent({
                        message: `Failed to load members for ${formData.teamName}: ${error.message}`,
                        type: 'error',
                        details: 'Please ensure the backend server is running and members are added for this company.'
                    });
                    setShowMessageBox(true);
                    setAvailableMembers([]);
                }
            } else {
                setAvailableMembers([]);
                setFormData(prevData => ({ ...prevData, teamMembers: [] }));
                setSelectedMemberToAdd('');
            }
        };
        fetchMembersByCompany();
    }, [formData.teamName]);

    // NEW EFFECT: Check Site Checklist Office eligibility
    useEffect(() => {
        const checkEligibility = async () => {
            const { checklistDate, teamName, teamMembers } = formData;
            if (checklistDate && teamName && teamMembers.length > 0) {
                try {
                    const queryParams = new URLSearchParams({
                        checklistDate: checklistDate,
                        teamName: teamName,
                        teamMembers: teamMembers.sort().join(',')
                    }).toString();
                    const response = await fetch(`http://localhost:3000/api/site-checklist-office-eligibility?${queryParams}`);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const data = await response.json();
                    setIsSiteChecklistOfficeEliguloible(data.isEligible);
                    if (!data.isEligible) {
                        setSiteChecklistOfficeEligibilityMessage(data.message || 'Site Checklist Office not found for this team and date.');
                    } else {
                        setSiteChecklistOfficeEligibilityMessage('Site Checklist Office found. You can proceed.');
                    }
                } catch (error) {
                    console.error("Error checking Site Checklist Office eligibility:", error);
                    setIsSiteChecklistOfficeEliguloible(false);
                    setSiteChecklistOfficeEligibilityMessage(`Error checking eligibility: ${error.message}`);
                }
            } else {
                setIsSiteChecklistOfficeEliguloible(false);
                setSiteChecklistOfficeEligibilityMessage('Please select Date, Team Name, and Team Member(s) to check Site Checklist Office eligibility.');
            }
        };
        checkEligibility();
    }, [formData.checklistDate, formData.teamName, formData.teamMembers]);


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData(prevData => {
            let newState = { ...prevData };

            if (type === 'checkbox' && name === 'cableBasementActivities') {
                const newCableBasementActivities = checked
                    ? [...prevData.cableBasementActivities, value]
                    : prevData.cableBasementActivities.filter(item => item !== value);
                newState = { ...newState, cableBasementActivities: newCableBasementActivities };
            } else if (type === 'radio' && name === 'abnormalitiesObserved') {
                setShowOthersAbnormalities(value === 'Others');
                if (value !== 'Others') {
                    newState = { ...newState, othersAbnormalities: '' };
                }
                newState = { ...newState, [name]: value };
            } else if (name === 'teamName') {
                newState = {
                    ...prevData,
                    [name]: value,
                    teamMembers: [],
                };
            }
            else {
                newState = { ...newState, [name]: value };
            }
            return newState;
        });
    };

    const handleAddMember = () => {
        if (selectedMemberToAdd && !formData.teamMembers.includes(selectedMemberToAdd)) {
            setFormData(prevData => ({
                ...prevData,
                teamMembers: [...prevData.teamMembers, selectedMemberToAdd].sort()
            }));
            setSelectedMemberToAdd('');
        } else if (formData.teamMembers.includes(selectedMemberToAdd)) {
            setMessageBoxContent({
                message: 'This team member has already been added.',
                type: 'error'
            });
            setShowMessageBox(true);
        } else {
            setMessageBoxContent({
                message: 'Please select a team member to add.',
                type: 'error'
            });
            setShowMessageBox(true);
        }
    };

    const handleRemoveMember = (memberToRemove) => {
        setFormData(prevData => ({
            ...prevData,
            teamMembers: prevData.teamMembers.filter(member => member !== memberToRemove)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // NEW: Check Site Checklist Office eligibility before proceeding
        if (!isSiteChecklistOfficeEliguloible) {
            setMessageBoxContent({
                message: 'Site Checklist Office not completed.',
                type: 'error',
                details: siteChecklistOfficeEligibilityMessage
            });
            setShowMessageBox(true);
            return;
        }

        // Basic validation for teamMembers
        if (formData.teamMembers.length === 0) {
            setMessageBoxContent({
                message: 'Please add at least one team member.',
                type: 'error'
            });
            setShowMessageBox(true);
            return;
        }

        // Conditional validation for othersAbnormalities
        if (formData.abnormalitiesObserved === 'Others' && !formData.othersAbnormalities.trim()) {
            setMessageBoxContent({
                message: 'Please specify other abnormalities.',
                type: 'error'
            });
            setShowMessageBox(true);
            return;
        }

        // Prepare data for submission
        const dataToSubmit = { ...formData };
        dataToSubmit.teamMembers = dataToSubmit.teamMembers.join(',');
        dataToSubmit.cableBasementActivities = dataToSubmit.cableBasementActivities.join(',');


        try {
            // Changed endpoint to /api/site-job-start-checklist
            const response = await fetch('http://localhost:3000/api/site-job-start-checklist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSubmit),
            });

            const result = await response.json();

            if (response.ok) {
                setMessageBoxContent({
                    message: 'Site Job Start Checklist submitted successfully and merged into Todays TBM!',
                    type: 'success'
                });
                setShowMessageBox(true);
                // Reset form
                setFormData(prevData => ({
                    checklistDate: new Date().toISOString().split('T')[0],
                    jobSite: '',
                    teamName: '',
                    teamMembers: [],
                    informedStationStaff: '',
                    workScrutinized: '',
                    bareLiveComponents: '',
                    abnormalitiesObserved: '',
                    othersAbnormalities: '',
                    teamMembersWornPPEs: '',
                    cableBasementActivities: [],
                    remarks: ''
                }));
                setShowOthersAbnormalities(false);
                setSelectedMemberToAdd('');
                setAvailableMembers([]);
                setIsSiteChecklistOfficeEliguloible(false); // Reset eligibility
                setSiteChecklistOfficeEligibilityMessage(''); // Clear message

            } else {
                setMessageBoxContent({
                    message: `Error submitting checklist: ${result.message || 'Unknown error'}`,
                    type: 'error',
                    details: JSON.stringify(result.errors || '')
                });
                setShowMessageBox(true);
                console.error('Error:', result);
            }
        } catch (error) {
            console.error('Network error:', error);
            setMessageBoxContent({
                message: 'Network error: Could not connect to the server.',
                type: 'error'
            });
            setShowMessageBox(true);
        }
    };

    return (
        <div className="form-container">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800 text-center mb-8 bg-blue-200 p-4 rounded-xl shadow-md">
                Points to be checked before starting job at site
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Date Field */}
                <div className="checklist-row">
                    <div>Date:<span className="required-asterisk">*</span></div>
                    <div className="col-span-full sm:col-span-5">
                        <input type="date" id="checklistDate" name="checklistDate"
                               value={formData.checklistDate} onChange={handleChange} required
                               className="block w-full"/>
                    </div>
                </div>

                {/* Job Site Field */}
                <div className="checklist-row">
                    <div>Job Site:<span className="required-asterisk">*</span></div>
                    <div className="col-span-full sm:col-span-5">
                        <input type="text" id="jobSite" name="jobSite" placeholder="Enter Job Site"
                               value={formData.jobSite} onChange={handleChange} required
                               className="block w-full"/>
                    </div>
                </div>

                {/* Team Name Field */}
                <div className="checklist-row">
                    <div>Team Name:<span className="required-asterisk">*</span></div>
                    <div className="col-span-full sm:col-span-5">
                        <select id="teamName" name="teamName"
                                value={formData.teamName} onChange={handleChange} required
                                className="block w-full">
                            <option value="">Select Team</option>
                            {companies.map(company => (
                                <option key={company._id} value={company.companyName}>
                                    {company.companyName}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Team Member Field (Custom Multi-select) */}
                <div className="checklist-row">
                    <div>Team Member(s):<span className="required-asterisk">*</span></div>
                    <div className="col-span-full sm:col-span-5">
                        <div className="add-member-section">
                            <select id="teamMemberSelect" className="flex-grow"
                                    value={selectedMemberToAdd}
                                    onChange={(e) => setSelectedMemberToAdd(e.target.value)}
                                    required={formData.teamMembers.length === 0}>
                                <option value="">Select a member to add</option>
                                {availableMembers
                                    .filter(member => !formData.teamMembers.includes(member))
                                    .map(member => (
                                        <option key={member} value={member}>{member}</option>
                                    ))}
                            </select>
                            <button type="button" onClick={handleAddMember}>Add</button>
                        </div>
                        <div id="selectedTeamMembersContainer" className="flex flex-wrap items-center gap-2">
                            {formData.teamMembers.map(member => (
                                <div key={member} className="selected-member-tag">
                                    <span>{member}</span>
                                    <button type="button" className="remove-btn" onClick={() => handleRemoveMember(member)}>&times;</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* NEW: Site Checklist Office Eligibility Message */}
                {(formData.checklistDate && formData.teamName && formData.teamMembers.length > 0) && (
                    <div className={`p-3 rounded-md text-sm ${isSiteChecklistOfficeEliguloible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {siteChecklistOfficeEligibilityMessage}
                    </div>
                )}

                {/* Informed Station Staff */}
                <div className="checklist-row">
                    <div>Informed Station Staff:<span className="required-asterisk">*</span></div>
                    <div className="radio-checkbox-group flex flex-wrap gap-x-4 col-span-full sm:col-span-5">
                        <label><input type="radio" name="informedStationStaff" value="Yes" checked={formData.informedStationStaff === 'Yes'} onChange={handleChange} required/> Yes</label>
                        <label><input type="radio" name="informedStationStaff" value="No" checked={formData.informedStationStaff === 'No'} onChange={handleChange}/> No</label>
                        <label><input type="radio" name="informedStationStaff" value="Not Applicable" checked={formData.informedStationStaff === 'Not Applicable'} onChange={handleChange}/> Not Applicable</label>
                    </div>
                </div>

                {/* Place of work scrutinized to identify safety Hazards */}
                <div className="checklist-row">
                    <div>Place of work scrutinized to identify safety Hazards:<span className="required-asterisk">*</span></div>
                    <div className="radio-checkbox-group flex flex-wrap gap-x-4 col-span-full sm:col-span-5">
                        <label><input type="radio" name="workScrutinized" value="Yes" checked={formData.workScrutinized === 'Yes'} onChange={handleChange} required/> Yes</label>
                        <label><input type="radio" name="workScrutinized" value="No" checked={formData.workScrutinized === 'No'} onChange={handleChange}/> No</label>
                    </div>
                </div>

                {/* Bare Live Electrical Components Present Nearby */}
                <div className="checklist-row">
                    <div>Bare Live Electrical Components Present Nearby:<span className="required-asterisk">*</span></div>
                    <div className="radio-checkbox-group flex flex-wrap gap-x-4 col-span-full sm:col-span-5">
                        <label><input type="radio" name="bareLiveComponents" value="Yes" checked={formData.bareLiveComponents === 'Yes'} onChange={handleChange} required/> Yes</label>
                        <label><input type="radio" name="bareLiveComponents" value="No" checked={formData.bareLiveComponents === 'No'} onChange={handleChange}/> No</label>
                    </div>
                </div>

                {/* Any other abnormalities observed */}
                <div className="checklist-row">
                    <div>Any other abnormalities observed:<span className="required-asterisk">*</span></div>
                    <div className="col-span-full sm:col-span-5">
                        <div className="radio-checkbox-group flex flex-wrap gap-x-4 mb-2">
                            <label><input type="radio" name="abnormalitiesObserved" value="Sound" checked={formData.abnormalitiesObserved === 'Sound'} onChange={handleChange} required/> Sound</label>
                            <label><input type="radio" name="abnormalitiesObserved" value="Smell" checked={formData.abnormalitiesObserved === 'Smell'} onChange={handleChange}/> Smell</label>
                            <label><input type="radio" name="abnormalitiesObserved" value="Others" checked={formData.abnormalitiesObserved === 'Others'} onChange={handleChange}/> Others (Pl specify)</label>
                        </div>
                        {showOthersAbnormalities && (
                            <div id="othersAbnormalitiesSection">
                                <textarea id="othersAbnormalities" name="othersAbnormalities" rows="2" placeholder="Please specify other abnormalities..."
                                          value={formData.othersAbnormalities} onChange={handleChange} required={showOthersAbnormalities}
                                          className="block w-full"></textarea>
                            </div>
                        )}
                    </div>
                </div>

                {/* All Team Members have worn PPEs */}
                <div className="checklist-row">
                    <div>All Team Members have worn PPEs:<span className="required-asterisk">*</span></div>
                    <div className="radio-checkbox-group flex flex-wrap gap-x-4 col-span-full sm:col-span-5">
                        <label><input type="radio" name="teamMembersWornPPEs" value="Yes" checked={formData.teamMembersWornPPEs === 'Yes'} onChange={handleChange} required/> Yes</label>
                        <label><input type="radio" name="teamMembersWornPPEs" value="No" checked={formData.teamMembersWornPPEs === 'No'} onChange={handleChange}/> No</label>
                    </div>
                </div>

                {/* For Cable Basement Related Activities */}
                <div className="checklist-row">
                    <div>For Cable Basement Related Activities<span className="required-asterisk">*</span></div>
                    <div className="col-span-full sm:col-span-5">
                        <div className="radio-checkbox-group flex flex-wrap gap-x-4">
                            <label><input type="checkbox" name="cableBasementActivities" value="CO2 Switch Isolated" checked={formData.cableBasementActivities.includes('CO2 Switch Isolated')} onChange={handleChange} required={formData.cableBasementActivities.length === 0}/> CO2 Switch Isolated</label>
                            <label><input type="checkbox" name="cableBasementActivities" value="Exhaust Switched On" checked={formData.cableBasementActivities.includes('Exhaust Switched On')} onChange={handleChange}/> Exhaust Switched On</label>
                            <label><input type="checkbox" name="cableBasementActivities" value="Lights Switched On" checked={formData.cableBasementActivities.includes('Lights Switched On')} onChange={handleChange}/> Lights Switched On</label>
                        </div>
                    </div>
                </div>

                {/* Remarks Field */}
                <div className="checklist-row">
                    <div>Remarks:</div>
                    <div className="col-span-full sm:col-span-5">
                        <textarea id="remarks" name="remarks" rows="4" placeholder="Add any additional remarks here..."
                                  value={formData.remarks} onChange={handleChange}
                                  className="block w-full"></textarea>
                    </div>
                </div>

                <button type="submit" className="submit-button" disabled={!isSiteChecklistOfficeEliguloible}>Submit Checklist</button>
            </form>

            {showMessageBox && (
                <MessageBox
                    message={messageBoxContent.message}
                    type={messageBoxContent.type}
                    details={messageBoxContent.details}
                    onClose={() => setShowMessageBox(false)}
                />
            )}
        </div>
    );
};

export default SiteJobStartChecklistForm;
